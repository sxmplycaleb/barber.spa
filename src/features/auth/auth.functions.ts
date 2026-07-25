/**
 * Auth & RBAC server functions.
 *
 * Module scope stays thin: imports, types and server-function declarations
 * only. All runtime logic lives in `auth.server.ts`, loaded inside handlers.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { APP_ROLES, type Account, type ManagedAccount } from "./types";

const profileInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+?254|0)[17]\d{8}$/, "Enter a valid Kenyan phone number")
    .optional()
    .or(z.literal("")),
});

const roleInputSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(APP_ROLES),
});

/**
 * Returns the signed-in user's account, provisioning the profile row and
 * default role on first call. Safe to call on every session start.
 */
export const getMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Account> => {
    const { ensureAccount } = await import("./auth.server");
    const claims = context.claims as { email?: string; user_metadata?: Record<string, unknown> };
    const metadata = claims.user_metadata ?? {};
    return ensureAccount({
      userId: context.userId,
      email: claims.email ?? null,
      fullName: typeof metadata.full_name === "string" ? metadata.full_name : null,
      phone: typeof metadata.phone === "string" ? metadata.phone : null,
    });
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => profileInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<Account> => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ full_name: data.fullName, phone: data.phone || null })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);

    const { ensureAccount, writeAuditLog } = await import("./auth.server");
    await writeAuditLog({
      actorId: context.userId,
      action: "profile.updated",
      entityType: "profile",
      entityId: context.userId,
    });
    const claims = context.claims as { email?: string };
    return ensureAccount({ userId: context.userId, email: claims.email ?? null });
  });

/** Owner-only: every account on the platform with its role. */
export const listAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedAccount[]> => {
    const { assertOwner, listManagedAccounts } = await import("./auth.server");
    await assertOwner(context.userId);
    return listManagedAccounts();
  });

/** Owner-only: set a user's single role (owner / staff / customer). */
export const setAccountRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => roleInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { assertOwner, replaceUserRole } = await import("./auth.server");
    await assertOwner(context.userId);
    await replaceUserRole({
      actorId: context.userId,
      targetUserId: data.userId,
      role: data.role,
    });
    return { ok: true };
  });
