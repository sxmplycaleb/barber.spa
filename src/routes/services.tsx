import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Clock, Scissors } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { listPublicServices } from "@/features/services/services.functions";
import { formatDuration, formatKes, type Service } from "@/features/services/types";

const publicServicesQuery = queryOptions({
  queryKey: ["services", "public"],
  queryFn: () => listPublicServices(),
});

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services & pricing — The Gentleman's Den" },
      {
        name: "description",
        content:
          "Haircuts, skin fades, beard sculpts and hot towel shaves at The Gentleman's Den, with clear pricing in Kenyan shillings.",
      },
      { property: "og:title", content: "Services & pricing — The Gentleman's Den" },
      {
        property: "og:description",
        content: "Browse our barbering menu and prices before you book your chair.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicServicesQuery),
  component: ServicesPage,
  errorComponent: ServicesError,
  notFoundComponent: ServicesError,
});

function ServicesError() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl">Our menu is briefly unavailable</h1>
      <p className="mt-2 text-muted-foreground">
        Please refresh in a moment, or call the shop and we'll talk you through it.
      </p>
    </div>
  );
}

function ServicesPage() {
  const { data: services } = useSuspenseQuery(publicServicesQuery);

  const grouped = services.reduce<Record<string, Service[]>>((acc, service) => {
    (acc[service.category] ??= []).push(service);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border/60 bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <Badge variant="secondary" className="mb-4">
              Services &amp; pricing
            </Badge>
            <h1 className="font-display text-4xl sm:text-5xl">The menu</h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Every service is performed by a trained barber, finished with hot towels, and priced
              plainly in Kenyan shillings — no surprises at the counter.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          {services.length === 0 ? (
            <p className="text-muted-foreground">
              Our service menu is being updated. Please check back shortly.
            </p>
          ) : (
            <div className="space-y-12">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <h2 className="font-display text-2xl">{category}</h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((service) => (
                      <Card key={service.id} className="flex flex-col">
                        <CardHeader>
                          <Scissors className="size-5 text-primary" aria-hidden="true" />
                          <CardTitle className="font-display text-xl">{service.name}</CardTitle>
                          {service.description ? (
                            <CardDescription>{service.description}</CardDescription>
                          ) : null}
                        </CardHeader>
                        <CardContent className="mt-auto flex items-center justify-between">
                          <span className="font-display text-xl text-primary">
                            {formatKes(service.priceKes)}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="size-4" aria-hidden="true" />
                            {formatDuration(service.durationMinutes)}
                          </span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-14 rounded-lg border border-border/60 bg-card/40 p-8 text-center">
            <h2 className="font-display text-2xl">Ready for the chair?</h2>
            <p className="mt-2 text-muted-foreground">
              Create an account and we'll keep your preferences on file.
            </p>
            <Button asChild className="mt-5">
              <Link to="/auth" search={{ mode: "signup" }}>
                Create your account
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
