/**
 * Service catalog server functions. Module scope stays thin: imports,
 * types and server-function declarations only.
 */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { serviceIdSchema, serviceInputSchema, serviceUpdateSchema } from "./services.schemas";
import type { Service } from "./types";

/** Public: active services for the marketing site and booking flow. */
export const listPublicServices = createServerFn({ method: "GET" }).handler(
  async (): Promise<Service[]> => {
    const { createPublicClient, mapService, SERVICE_COLUMNS } = await import("./services.server");
    const client = createPublicClient();
    const { data, error } = await client
      .from("services")
      .select(SERVICE_COLUMNS)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapService);
  },
);

/** Owner/staff: the full catalog including hidden services. */
export const listAllServices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Service[]> => {
    const { mapService, SERVICE_COLUMNS } = await import("./services.server");
    const { data, error } = await context.supabase
      .from("services")
      .select(SERVICE_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapService);
  });

export const createService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => serviceInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<Service> => {
    const { assertOwner, writeAuditLog } = await import("@/features/auth/auth.server");
    await assertOwner(context.userId);

    const { mapService, SERVICE_COLUMNS, toRow, uniqueSlug } = await import("./services.server");
    const slug = await uniqueSlug(context.supabase, data.name);
    const { data: inserted, error } = await context.supabase
      .from("services")
      .insert(toRow(data, slug))
      .select(SERVICE_COLUMNS)
      .single();
    if (error) throw new Error(error.message);

    await writeAuditLog({
      actorId: context.userId,
      action: "service.created",
      entityType: "service",
      entityId: inserted.id,
      metadata: { name: inserted.name, price_kes: inserted.price_kes },
    });
    return mapService(inserted);
  });

export const updateService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => serviceUpdateSchema.parse(data))
  .handler(async ({ data, context }): Promise<Service> => {
    const { assertOwner, writeAuditLog } = await import("@/features/auth/auth.server");
    await assertOwner(context.userId);

    const { mapService, SERVICE_COLUMNS, toRow, uniqueSlug } = await import("./services.server");
    const { id, ...values } = data;
    const slug = await uniqueSlug(context.supabase, values.name, id);
    const { data: updated, error } = await context.supabase
      .from("services")
      .update(toRow(values, slug))
      .eq("id", id)
      .select(SERVICE_COLUMNS)
      .single();
    if (error) throw new Error(error.message);

    await writeAuditLog({
      actorId: context.userId,
      action: "service.updated",
      entityType: "service",
      entityId: id,
      metadata: { name: updated.name, price_kes: updated.price_kes },
    });
    return mapService(updated);
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => serviceIdSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { assertOwner, writeAuditLog } = await import("@/features/auth/auth.server");
    await assertOwner(context.userId);

    const { error } = await context.supabase.from("services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);

    await writeAuditLog({
      actorId: context.userId,
      action: "service.deleted",
      entityType: "service",
      entityId: data.id,
    });
    return { ok: true };
  });
