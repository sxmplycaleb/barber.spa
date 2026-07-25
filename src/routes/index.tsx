import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, ShieldCheck, Smartphone, Users } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { business } from "@/config/business";
import { useSessionUserId } from "@/features/auth/use-account";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Gentleman's Den — Premium Barbershop in Nairobi" },
      {
        name: "description",
        content:
          "A premium barbershop for the modern gentleman. Create an account to book your barber, manage appointments and pay by M-Pesa.",
      },
      { property: "og:title", content: "The Gentleman's Den — Premium Barbershop" },
      {
        property: "og:description",
        content:
          "Book your chair with Nairobi's premium barbershop. Sharp cuts, hot towel shaves and M-Pesa checkout.",
      },
    ],
  }),
  component: Index,
});

const PILLARS = [
  {
    icon: CalendarCheck,
    title: "Book your chair",
    body: "Pick your barber, service and time. Your appointments live in your account.",
  },
  {
    icon: Smartphone,
    title: "Pay with M-Pesa",
    body: "Confirm your booking with a familiar M-Pesa prompt — no cards required.",
  },
  {
    icon: Users,
    title: "One account, three views",
    body: "Clients, barbers and the owner each see exactly what belongs to them.",
  },
] as const;

function Index() {
  const { data: userId } = useSessionUserId();
  const isSignedIn = Boolean(userId);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border/60">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary">
                {business.city}, {business.country}
              </p>
              <h1 className="mt-5 font-display text-5xl leading-[1.05] sm:text-6xl">
                {business.name}
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">{business.tagline}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                {isSignedIn ? (
                  <Button asChild size="lg">
                    <Link to="/dashboard">Go to my dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg">
                      <Link to="/auth" search={{ mode: "signup", next: "/dashboard" }}>
                        Create your account
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <Link to="/auth" search={{ mode: "signin", next: "/dashboard" }}>
                        Sign in
                      </Link>
                    </Button>
                  </>
                )}
              </div>
              <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                Secure sign-in with email or Google.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 p-8">
              <h2 className="font-display text-2xl">Opening hours</h2>
              <dl className="mt-5 space-y-3 text-sm">
                {business.hours.map((slot) => (
                  <div
                    key={slot.days}
                    className="flex justify-between gap-4 border-b border-border/40 pb-3 last:border-0 last:pb-0"
                  >
                    <dt className="text-muted-foreground">{slot.days}</dt>
                    <dd>{slot.time}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-sm text-muted-foreground">{business.addressLine}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-3xl sm:text-4xl">Built around your account</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Sign-in is the foundation — bookings, payments and staff schedules all hang off it.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PILLARS.map((pillar) => (
              <Card key={pillar.title}>
                <CardHeader>
                  <pillar.icon className="size-5 text-primary" aria-hidden="true" />
                  <CardTitle className="font-display text-xl">{pillar.title}</CardTitle>
                  <CardDescription>{pillar.body}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
