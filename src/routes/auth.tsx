import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Scissors } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { business } from "@/config/business";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = "signin" | "signup";

function safeNext(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "signup" ? ("signup" as const) : ("signin" as const),
    next: safeNext(search.next),
  }),
  head: () => ({
    meta: [
      { title: "Sign in — The Gentleman's Den" },
      {
        name: "description",
        content:
          "Sign in or create your account to book a barber, manage appointments and pay with M-Pesa at The Gentleman's Den.",
      },
      { property: "og:title", content: "Sign in — The Gentleman's Den" },
      {
        property: "og:description",
        content: "Access your bookings and account at The Gentleman's Den barbershop.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, next } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AuthMode>(mode);
  const [pending, setPending] = useState<null | "email" | "google" | "reset">(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("email");
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${next}`,
            data: { full_name: fullName, phone },
          },
        });
        if (error) throw error;
        toast.success("Account created", {
          description: "Check your inbox if we ask you to confirm your email.",
        });
        const { data: session } = await supabase.auth.getSession();
        if (session.session) navigate({ to: next });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: next });
      }
    } catch (error) {
      toast.error("Sign in failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPending(null);
    }
  }

  async function handleGoogle() {
    setPending("google");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setPending(null);
      toast.error("Google sign-in failed", { description: result.error.message });
      return;
    }
    if (result.redirected) return;
    navigate({ to: next });
  }

  async function handleForgotPassword() {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    setPending("reset");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(null);
    if (error) {
      toast.error("Could not send reset link", { description: error.message });
      return;
    }
    toast.success("Reset link sent", { description: `Check ${email} for the link.` });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <Scissors className="size-5 text-primary" aria-hidden="true" />
            <span className="font-display text-xl font-semibold">{business.name}</span>
          </Link>
          <h1 className="mt-6 font-display text-3xl">
            {tab === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tab === "signup"
              ? "One account for bookings, payments and your grooming history."
              : "Sign in to manage your appointments."}
          </p>
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as AuthMode)}
          className="mt-8"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-6">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {tab === "signup" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      autoComplete="name"
                      required
                      minLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (M-Pesa)</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="07XX XXX XXX"
                      autoComplete="tel"
                      inputMode="tel"
                    />
                  </div>
                </>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={tab === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={8}
                />
              </div>

              <Button type="submit" className="w-full" disabled={pending !== null}>
                {pending === "email" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                {tab === "signup" ? "Create account" : "Sign in"}
              </Button>
            </form>

            {tab === "signin" ? (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={pending !== null}
                className="mt-3 w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Forgot your password?
              </button>
            ) : null}

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogle}
              disabled={pending !== null}
            >
              {pending === "google" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Continue with Google
            </Button>
          </TabsContent>
        </Tabs>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:underline">
            Back to {business.shortName}
          </Link>
        </p>
      </div>
    </main>
  );
}
