// src/interfaces/http/schemas/checkout.schema.ts
import { z } from 'zod';

export const createCheckoutSchema = z.object({
  customer: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    document: z.string().min(11).max(14).regex(/^\d+$/, 'Document must contain only digits'),
  }),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        quantity: z.number().int().positive(),
        price: z.number().positive().finite(),
      })
    )
    .min(1),
  amount: z.number().positive().finite(),
  description: z.string().max(500).optional(),
});

export const listCheckoutsSchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled', 'refunded', 'refused']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  orderBy: z.enum(['createdAt', 'amount', 'status']).default('createdAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
});

export const listPaymentsSchema = z.object({
  status: z.enum(['pending', 'approved', 'refused', 'refunded', 'cancelled']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  orderBy: z.enum(['createdAt', 'amount', 'status']).default('createdAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});
