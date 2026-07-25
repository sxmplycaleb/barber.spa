/** Service catalog domain types. */

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  priceKes: number;
  durationMinutes: number;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ServiceInput {
  name: string;
  description?: string;
  category: string;
  priceKes: number;
  durationMinutes: number;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

export const SERVICE_CATEGORIES = [
  "Haircuts",
  "Beard",
  "Shaves",
  "Treatments",
  "Packages",
] as const;

export function formatKes(amount: number): string {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}
