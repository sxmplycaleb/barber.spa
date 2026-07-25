/**
 * Business configuration. Keeps brand, contact and locale details out of
 * presentation components so they can be changed in one place.
 */

export const business = {
  name: "The Gentleman's Den",
  shortName: "The Den",
  tagline: "Barbering & grooming, done properly.",
  description:
    "A premium barbershop and grooming lounge. Book a master barber, choose your service and pay with M-Pesa — all in under a minute.",
  city: "Nairobi",
  country: "Kenya",
  addressLine: "Kilimani, Nairobi",
  phone: "+254 700 000 000",
  email: "hello@gentlemansden.co.ke",
  currency: "KES",
  timezone: "Africa/Nairobi",
  hours: [
    { days: "Monday – Friday", time: "09:00 – 20:00" },
    { days: "Saturday", time: "08:00 – 20:00" },
    { days: "Sunday", time: "10:00 – 17:00" },
  ],
} as const;

export function formatCurrency(amountMinor: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: business.currency,
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}
