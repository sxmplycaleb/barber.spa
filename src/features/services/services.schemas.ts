import { z } from "zod";

export const serviceInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.string().trim().min(2).max(40),
  priceKes: z.coerce.number().int().min(0).max(1_000_000),
  durationMinutes: z.coerce.number().int().min(5).max(600),
  imageUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export const serviceUpdateSchema = serviceInputSchema.extend({
  id: z.string().uuid(),
});

export const serviceIdSchema = z.object({ id: z.string().uuid() });

export type ServiceFormValues = z.infer<typeof serviceInputSchema>;
