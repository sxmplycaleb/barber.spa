import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Scissors, User, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { business } from "@/config/business";
import { useAccount, useSignOut } from "@/features/auth/use-account";
import { primaryRole, ROLE_LABELS } from "@/features/auth/types";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { mode: "signin", next: location.pathname } });
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { data: account, isPending } = useAccount();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const role = account ? primaryRole(account.roles) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Scissors className="size-5 text-primary" aria-hidden="true" />
            <span className="font-display text-lg font-semibold">{business.shortName}</span>
          </Link>

          <nav aria-label="Account" className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">
                <LayoutDashboard className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/profile">
                <User className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
            </Button>
            {role === "owner" ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/team">
                  <Users className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Team</span>
                </Link>
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : account ? (
          <Outlet />
        ) : (
          <div className="rounded-lg border border-border/60 bg-card p-8 text-center">
            <h1 className="font-display text-2xl">We couldn't load your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your session may have expired. Sign in again to continue.
            </p>
            <Button
              className="mt-6"
              onClick={() => navigate({ to: "/auth", search: { mode: "signin", next: "/dashboard" } })}
            >
              Back to sign in
            </Button>
          </div>
        )}
      </div>

      {role ? (
        <footer className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
          Signed in as {ROLE_LABELS[role]} · {business.name}
        </footer>
      ) : null}
    </div>
  );
}
