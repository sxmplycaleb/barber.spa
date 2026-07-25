import { business } from "@/config/business";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <h2 className="font-display text-xl">{business.name}</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">{business.tagline}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium">Opening hours</h3>
          <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
            {business.hours.map((slot) => (
              <div key={slot.days} className="flex justify-between gap-4">
                <dt>{slot.days}</dt>
                <dd>{slot.time}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h3 className="text-sm font-medium">Visit us</h3>
          <address className="mt-3 space-y-1 text-sm not-italic text-muted-foreground">
            <p>{business.addressLine}</p>
            <p>
              <a className="hover:text-foreground" href={`tel:${business.phone.replace(/\s/g, "")}`}>
                {business.phone}
              </a>
            </p>
            <p>
              <a className="hover:text-foreground" href={`mailto:${business.email}`}>
                {business.email}
              </a>
            </p>
          </address>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {business.name}. {business.city}, {business.country}.
      </div>
    </footer>
  );
}