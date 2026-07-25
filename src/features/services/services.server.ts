/**
 * Server-only helpers for the service catalog. Loaded lazily inside
 * server-function handlers.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

import type { Service } from "./types";
import type { ServiceFormValues } from "./services.schemas";

type ServiceRow = Omit<
  Database["public"]["Tables"]["services"]["Row"],
  "created_at" | "updated_at"
>;

export const SERVICE_COLUMNS =
  "id, name, slug, description, category, price_kes, duration_minutes, image_url, is_active, sort_order";

export function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    priceKes: row.price_kes,
    durationMinutes: row.duration_minutes,
    imageUrl: row.image_url,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

/** Publishable-key client for public reads during SSR. */
export function createPublicClient(): SupabaseClient<Database> {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Returns a slug that is unique across the catalog. */
export async function uniqueSlug(
  client: SupabaseClient<Database>,
  name: string,
  ignoreId?: string,
): Promise<string> {
  const base = slugify(name) || "service";
  let candidate = base;
  for (let attempt = 2; attempt < 50; attempt += 1) {
    let query = client.from("services").select("id").eq("slug", candidate).limit(1);
    if (ignoreId) query = query.neq("id", ignoreId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return candidate;
    candidate = `${base}-${attempt}`;
  }
  return `${base}-${Date.now()}`;
}

export function toRow(values: ServiceFormValues, slug: string) {
  return {
    name: values.name,
    slug,
    description: values.description ? values.description : null,
    category: values.category,
    price_kes: values.priceKes,
    duration_minutes: values.durationMinutes,
    image_url: values.imageUrl ? values.imageUrl : null,
    is_active: values.isActive,
    sort_order: values.sortOrder,
  };
}
