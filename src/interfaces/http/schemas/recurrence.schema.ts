import { z } from 'zod';

export const paginationSchema = z.object({
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  orderBy: z.string().default('createdAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
});

export const createRecurrencePlanSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  amount: z.number().positive(),
  interval: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  externalId: z.string().max(120).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listRecurrencePlansSchema = paginationSchema.extend({
  status: z.enum(['active', 'inactive']).optional(),
  orderBy: z.enum(['createdAt', 'amount', 'status', 'name']).default('createdAt'),
});

export const createSubscriptionSchema = z.object({
  planId: z.string().uuid(),
  customer: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    document: z.string().min(11).max(14).regex(/^\d+$/, 'Document must contain only digits'),
  }),
  nextDueDate: z.string().datetime(),
  externalId: z.string().max(120).optional(),
  metadata: z.record(z.unknown()).optional(),
  createFirstInvoice: z.boolean().default(true),
});

export const listSubscriptionsSchema = paginationSchema.extend({
  status: z.enum(['pending', 'active', 'past_due', 'cancelled', 'expired']).optional(),
  customerId: z.string().uuid().optional(),
  planId: z.string().uuid().optional(),
  orderBy: z.enum(['createdAt', 'nextDueDate', 'status']).default('createdAt'),
});

export const listSubscriptionInvoicesSchema = paginationSchema.extend({
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled', 'refused']).optional(),
  subscriptionId: z.string().uuid().optional(),
  overdueOnly: z.coerce.boolean().default(false),
  orderBy: z.enum(['createdAt', 'dueDate', 'amount', 'status']).default('dueDate'),
});

export const createSubscriptionInvoiceSchema = z.object({
  subscriptionId: z.string().uuid(),
  amount: z.number().positive().optional(),
  dueDate: z.string().datetime(),
  externalId: z.string().max(120).optional(),
  paymentId: z.string().uuid().optional(),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});
