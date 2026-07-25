import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Scissors, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { business } from "@/config/business";
import { primaryRole, ROLE_LABELS } from "@/features/auth/types";
import { useAccount } from "@/features/auth/use-account";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — The Gentleman's Den" },
      {
        name: "description",
        content: "Your personal hub at The Gentleman's Den: bookings, profile and account access.",
      },
      { property: "og:title", content: "Dashboard — The Gentleman's Den" },
      { property: "og:description", content: "Manage your grooming appointments and account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

const ROLE_INTRO = {
  owner: "You have full control of the shop: services, barbers, bookings and payments.",
  staff: "Here you'll find your chair schedule and the clients booked with you.",
  customer: "Book a chair, track your appointments and keep your details up to date.",
} as const;

function DashboardPage() {
  const { data: account } = useAccount();
  if (!account) return null;

  const role = primaryRole(account.roles);
  const firstName = account.profile.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div>
        <Badge variant="secondary" className="mb-3">
          {ROLE_LABELS[role]} access
        </Badge>
        <h1 className="font-display text-3xl sm:text-4xl">Welcome, {firstName}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{ROLE_INTRO[role]}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            <CardTitle className="font-display text-xl">Your access level</CardTitle>
            <CardDescription>
              Signed in as {account.email ?? "your account"} with {ROLE_LABELS[role]} permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link to="/profile">Update your details</Link>
            </Button>
          </CardContent>
        </Card>

        {role === "owner" ? (
          <Card>
            <CardHeader>
              <Scissors className="size-5 text-primary" aria-hidden="true" />
              <CardTitle className="font-display text-xl">Services &amp; pricing</CardTitle>
              <CardDescription>
                Add, price and retire the services clients can book.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm">
                <Link to="/manage-services">Manage services</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {role === "owner" ? (
          <Card>
            <CardHeader>
              <Users className="size-5 text-primary" aria-hidden="true" />
              <CardTitle className="font-display text-xl">Team &amp; roles</CardTitle>
              <CardDescription>
                Promote a client to barber, or hand another owner the keys.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm">
                <Link to="/team">Manage the team</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CalendarCheck className="size-5 text-primary" aria-hidden="true" />
            <CardTitle className="font-display text-xl">
              {role === "customer" ? "Your appointments" : "Chair schedule"}
            </CardTitle>
            <CardDescription>
              Booking is being fitted out next — your account is ready for it.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {business.hours[0].days}: {business.hours[0].time}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Scissors className="size-5 text-primary" aria-hidden="true" />
            <CardTitle className="font-display text-xl">{business.shortName}</CardTitle>
            <CardDescription>{business.addressLine}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="ghost" size="sm">
              <Link to="/services">View the menu</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
