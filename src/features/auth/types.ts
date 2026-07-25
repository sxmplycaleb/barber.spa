/**
 * Auth & RBAC domain types.
 *
 * These are the shared contracts between the server functions in
 * `auth.functions.ts` and every presentation layer that consumes them.
 */

export const APP_ROLES = ["owner", "staff", "customer"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export interface Profile {
  id: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface Account {
  userId: string;
  email: string | null;
  profile: Profile;
  roles: AppRole[];
}

export interface ManagedAccount {
  userId: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  roles: AppRole[];
  createdAt: string;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Owner",
  staff: "Barber",
  customer: "Client",
};

/** Every role lands on the same hub, which renders role-aware content. */
export const ROLE_HOME = "/dashboard" as const;

export function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("owner")) return "owner";
  if (roles.includes("staff")) return "staff";
  return "customer";
}


export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}
