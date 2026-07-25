/**
 * Server-only auth helpers. Never imported from client-reachable module
 * scope — server functions load this lazily inside their handlers.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { type AppRole, type Account, type ManagedAccount } from "./types";

interface EnsureAccountInput {
  userId: string;
  email: string | null;
  fullName?: string | null;
  phone?: string | null;
}

export async function writeAuditLog(entry: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    metadata: (entry.metadata ?? {}) as never,
  });
  if (error) console.error("[audit] failed to write entry", error.message);
}

/**
 * Idempotently provisions the profile row and the default role for a
 * freshly authenticated user.
 *
 * Bootstrap rule: the very first account to sign in becomes the business
 * owner (there is no seeded owner). Everyone afterwards is a customer, and
 * only an owner can promote them.
 */
export async function ensureAccount(input: EnsureAccountInput): Promise<Account> {
  const { userId, email } = input;

  const { data: existingProfile, error: profileReadError } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, phone, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (profileReadError) throw new Error(profileReadError.message);

  let profileRow = existingProfile;

  if (!profileRow) {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        full_name: input.fullName ?? null,
        phone: input.phone ?? null,
      })
      .select("id, full_name, phone, avatar_url")
      .single();
    if (insertError) throw new Error(insertError.message);
    profileRow = inserted;
    await writeAuditLog({
      actorId: userId,
      action: "profile.created",
      entityType: "profile",
      entityId: userId,
    });
  } else if (input.fullName && !profileRow.full_name) {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: input.fullName, phone: input.phone ?? profileRow.phone })
      .eq("id", userId)
      .select("id, full_name, phone, avatar_url")
      .single();
    if (updateError) throw new Error(updateError.message);
    profileRow = updated;
  }

  const roles = await ensureRoles(userId);

  return {
    userId,
    email,
    profile: {
      id: profileRow.id,
      fullName: profileRow.full_name,
      phone: profileRow.phone,
      avatarUrl: profileRow.avatar_url,
    },
    roles,
  };
}

async function ensureRoles(userId: string): Promise<AppRole[]> {
  const { data: roleRows, error: roleReadError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (roleReadError) throw new Error(roleReadError.message);

  if (roleRows && roleRows.length > 0) {
    return roleRows.map((row) => row.role as AppRole);
  }

  const { count, error: ownerCountError } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "owner");
  if (ownerCountError) throw new Error(ownerCountError.message);

  const role: AppRole = (count ?? 0) === 0 ? "owner" : "customer";

  const { error: grantError } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: userId, role });
  if (grantError && grantError.code !== "23505") throw new Error(grantError.message);

  await writeAuditLog({
    actorId: userId,
    action: "role.granted",
    entityType: "user_role",
    entityId: userId,
    metadata: { role, reason: role === "owner" ? "first-account-bootstrap" : "default" },
  });

  return [role];
}

export async function assertOwner(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "owner",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: owner role required");
}

export async function assertStaffOrOwner(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["owner", "staff"]);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Forbidden: staff or owner role required");
}

export async function listManagedAccounts(): Promise<ManagedAccount[]> {
  const [{ data: profiles, error: profileError }, { data: roles, error: rolesError }] =
    await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, phone, created_at")
        .order("created_at", { ascending: true }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
  if (profileError) throw new Error(profileError.message);
  if (rolesError) throw new Error(rolesError.message);

  const emails = new Map<string, string | null>();
  const { data: userList } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  for (const user of userList?.users ?? []) emails.set(user.id, user.email ?? null);

  const rolesByUser = new Map<string, AppRole[]>();
  for (const row of roles ?? []) {
    const list = rolesByUser.get(row.user_id) ?? [];
    list.push(row.role as AppRole);
    rolesByUser.set(row.user_id, list);
  }

  return (profiles ?? []).map((profile) => ({
    userId: profile.id,
    email: emails.get(profile.id) ?? null,
    fullName: profile.full_name,
    phone: profile.phone,
    roles: rolesByUser.get(profile.id) ?? [],
    createdAt: profile.created_at,
  }));
}

export async function replaceUserRole(input: {
  actorId: string;
  targetUserId: string;
  role: AppRole;
}): Promise<void> {
  const { actorId, targetUserId, role } = input;

  if (actorId === targetUserId && role !== "owner") {
    const { count, error } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "owner");
    if (error) throw new Error(error.message);
    if ((count ?? 0) <= 1) {
      throw new Error("You are the only owner — promote another owner first.");
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", targetUserId);
  if (deleteError) throw new Error(deleteError.message);

  const { error: insertError } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: targetUserId, role });
  if (insertError) throw new Error(insertError.message);

  await writeAuditLog({
    actorId,
    action: "role.changed",
    entityType: "user_role",
    entityId: targetUserId,
    metadata: { role },
  });
}
