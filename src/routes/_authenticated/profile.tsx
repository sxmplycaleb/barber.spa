import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { primaryRole, ROLE_LABELS } from "@/features/auth/types";
import { useAccount, useUpdateProfile } from "@/features/auth/use-account";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — The Gentleman's Den" },
      {
        name: "description",
        content: "Update your name and M-Pesa phone number for bookings at The Gentleman's Den.",
      },
      { property: "og:title", content: "Your profile — The Gentleman's Den" },
      { property: "og:description", content: "Keep your booking and contact details current." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: account } = useAccount();
  const updateProfile = useUpdateProfile();
  const [fullName, setFullName] = useState(account?.profile.fullName ?? "");
  const [phone, setPhone] = useState(account?.profile.phone ?? "");

  if (!account) return null;
  const role = primaryRole(account.roles);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateProfile.mutate(
      { fullName, phone },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: (error) =>
          toast.error("Could not save your profile", {
            description: error instanceof Error ? error.message : "Please try again.",
          }),
      },
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Your profile</h1>
        <p className="mt-2 text-muted-foreground">
          {ROLE_LABELS[role]} account · {account.email ?? "no email on file"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Contact details</CardTitle>
          <CardDescription>
            We use your phone number for booking reminders and M-Pesa payment prompts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                minLength={2}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="07XX XXX XXX"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
