// src/infrastructure/database/repositories/CustomerRepository.ts
import { PrismaClient } from '@prisma/client';
import {
  CreateCustomerData,
  CreatePaymentData,
  CreateRecurrencePlanData,
  CreateSubscriptionData,
  CreateSubscriptionInvoiceData,
  ICustomerRepository,
  IPaymentRepository,
  IRecurrencePlanRepository,
  ISubscriptionInvoiceRepository,
  ISubscriptionRepository,
  IWebhookEventRepository,
  CreateWebhookEventData,
  ListRecurrencePlansFilters,
  ListSubscriptionInvoicesFilters,
  ListSubscriptionsFilters,
  SubscriptionDashboard,
} from '../../../domain/repositories/index';
import {
  Customer,
  InvoiceStatus,
  Payment,
  PaymentStatus,
  RecurrencePlan,
  Subscription,
  SubscriptionInvoice,
  SubscriptionStatus,
  WebhookEvent,
} from '../../../domain/entities/index';
import { PaginatedResult, FilterParams } from '../../../shared/types';

export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findOrCreate(data: CreateCustomerData): Promise<Customer> {
    const existing = await this.prisma.customer.findFirst({
      where: { email: data.email, document: data.document },
    });
    if (existing) return existing;

    return this.prisma.customer.create({ data });
  }

  async findById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({ where: { email } });
  }
}

// src/infrastructure/database/repositories/PaymentRepository.ts
export class PaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreatePaymentData): Promise<Payment> {
    return this.prisma.payment.create({ data });
  }

  async findById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  async findByCheckoutId(checkoutId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({ where: { checkoutId } });
  }

  async findAll(filters: FilterParams): Promise<PaginatedResult<Payment>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const orderBy: any = {};
    orderBy[filters.orderBy ?? 'createdAt'] = filters.orderDir ?? 'desc';

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({ where, skip, take: limit, orderBy }),
      this.prisma.payment.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(id: string, status: PaymentStatus, paidAt?: Date): Promise<Payment> {
    return this.prisma.payment.update({ where: { id }, data: { status, paidAt } });
  }
}

// src/infrastructure/database/repositories/RecurrencePlanRepository.ts
function buildDateFilter(filters: FilterParams): Record<string, unknown> | undefined {
  if (!filters.startDate && !filters.endDate) return undefined;

  const createdAt: Record<string, Date> = {};
  if (filters.startDate) createdAt.gte = new Date(filters.startDate);
  if (filters.endDate) createdAt.lte = new Date(filters.endDate);
  return createdAt;
}

function buildPagination(filters: FilterParams): { page: number; limit: number; skip: number } {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  return { page, limit, skip: (page - 1) * limit };
}

function buildOrder(filters: FilterParams): Record<string, string> {
  return { [filters.orderBy ?? 'createdAt']: filters.orderDir ?? 'desc' };
}

export class RecurrencePlanRepository implements IRecurrencePlanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateRecurrencePlanData): Promise<RecurrencePlan> {
    const plan = await (this.prisma as any).recurrencePlan.create({
      data: {
        name: data.name,
        description: data.description,
        amount: data.amount,
        interval: data.interval,
        externalId: data.externalId,
        metadata: data.metadata as any,
      },
    });
    return plan as RecurrencePlan;
  }

  async findById(id: string): Promise<RecurrencePlan | null> {
    return ((this.prisma as any).recurrencePlan.findUnique({ where: { id } }) as Promise<RecurrencePlan | null>);
  }

  async findAll(filters: ListRecurrencePlansFilters): Promise<PaginatedResult<RecurrencePlan>> {
    const { page, limit, skip } = buildPagination(filters);
    const where: any = {};
    if (filters.status) where.status = filters.status;
    const createdAt = buildDateFilter(filters);
    if (createdAt) where.createdAt = createdAt;

    const [items, total] = await Promise.all([
      (this.prisma as any).recurrencePlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: buildOrder(filters),
      }),
      (this.prisma as any).recurrencePlan.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateSubscriptionData): Promise<Subscription> {
    const subscription = await (this.prisma as any).subscription.create({
      data: {
        planId: data.planId,
        customerId: data.customerId,
        nextDueDate: data.nextDueDate,
        externalId: data.externalId,
        metadata: data.metadata as any,
      },
      include: { customer: true, plan: true, invoices: true },
    });
    return subscription as Subscription;
  }

  async findById(id: string): Promise<Subscription | null> {
    return ((this.prisma as any).subscription.findUnique({
      where: { id },
      include: { customer: true, plan: true, invoices: true },
    }) as Promise<Subscription | null>);
  }

  async findAll(filters: ListSubscriptionsFilters): Promise<PaginatedResult<Subscription>> {
    const { page, limit, skip } = buildPagination(filters);
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.planId) where.planId = filters.planId;
    const createdAt = buildDateFilter(filters);
    if (createdAt) where.createdAt = createdAt;

    const [items, total] = await Promise.all([
      (this.prisma as any).subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: buildOrder(filters),
        include: { customer: true, plan: true, invoices: true },
      }),
      (this.prisma as any).subscription.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(id: string, status: SubscriptionStatus, nextDueDate?: Date): Promise<Subscription> {
    const data: Record<string, unknown> = { status };
    if (nextDueDate) data.nextDueDate = nextDueDate;
    if (status === 'cancelled') data.cancelledAt = new Date();

    return ((this.prisma as any).subscription.update({
      where: { id },
      data,
      include: { customer: true, plan: true, invoices: true },
    }) as Promise<Subscription>);
  }
}

export class SubscriptionInvoiceRepository implements ISubscriptionInvoiceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateSubscriptionInvoiceData): Promise<SubscriptionInvoice> {
    const invoice = await (this.prisma as any).subscriptionInvoice.create({
      data: {
        subscriptionId: data.subscriptionId,
        amount: data.amount,
        dueDate: data.dueDate,
        externalId: data.externalId,
        paymentId: data.paymentId,
      },
      include: { subscription: { include: { customer: true, plan: true } } },
    });
    return invoice as SubscriptionInvoice;
  }

  async findById(id: string): Promise<SubscriptionInvoice | null> {
    return ((this.prisma as any).subscriptionInvoice.findUnique({
      where: { id },
      include: { subscription: { include: { customer: true, plan: true } } },
    }) as Promise<SubscriptionInvoice | null>);
  }

  async findByExternalId(externalId: string): Promise<SubscriptionInvoice | null> {
    return ((this.prisma as any).subscriptionInvoice.findUnique({
      where: { externalId },
      include: { subscription: { include: { customer: true, plan: true } } },
    }) as Promise<SubscriptionInvoice | null>);
  }

  async findAll(filters: ListSubscriptionInvoicesFilters): Promise<PaginatedResult<SubscriptionInvoice>> {
    const { page, limit, skip } = buildPagination(filters);
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.subscriptionId) where.subscriptionId = filters.subscriptionId;
    if (filters.overdueOnly) {
      where.status = 'overdue';
      where.dueDate = { lt: new Date() };
    }
    const createdAt = buildDateFilter(filters);
    if (createdAt) where.createdAt = createdAt;

    const [items, total] = await Promise.all([
      (this.prisma as any).subscriptionInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: buildOrder(filters),
        include: { subscription: { include: { customer: true, plan: true } } },
      }),
      (this.prisma as any).subscriptionInvoice.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(id: string, status: InvoiceStatus, paidAt?: Date): Promise<SubscriptionInvoice> {
    return ((this.prisma as any).subscriptionInvoice.update({
      where: { id },
      data: { status, paidAt },
      include: { subscription: { include: { customer: true, plan: true } } },
    }) as Promise<SubscriptionInvoice>);
  }

  async markPendingInvoicesAsOverdue(referenceDate = new Date()): Promise<number> {
    const result = await (this.prisma as any).subscriptionInvoice.updateMany({
      where: {
        status: 'pending',
        dueDate: { lt: referenceDate },
      },
      data: { status: 'overdue' },
    });

    await (this.prisma as any).subscription.updateMany({
      where: {
        invoices: {
          some: {
            status: 'overdue',
            dueDate: { lt: referenceDate },
          },
        },
        status: { in: ['active', 'pending'] },
      },
      data: { status: 'past_due' },
    });

    return result.count;
  }

  async getDashboard(referenceDate = new Date()): Promise<SubscriptionDashboard> {
    await this.markPendingInvoicesAsOverdue(referenceDate);

    const [
      activePlans,
      inactivePlans,
      activeSubscriptions,
      pendingSubscriptions,
      pastDueSubscriptions,
      cancelledSubscriptions,
      expiredSubscriptions,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      refusedInvoices,
      cancelledInvoices,
      paidAmount,
      overdueAmount,
      pendingAmount,
      overdueRows,
    ] = await Promise.all([
      (this.prisma as any).recurrencePlan.count({ where: { status: 'active' } }),
      (this.prisma as any).recurrencePlan.count({ where: { status: 'inactive' } }),
      (this.prisma as any).subscription.count({ where: { status: 'active' } }),
      (this.prisma as any).subscription.count({ where: { status: 'pending' } }),
      (this.prisma as any).subscription.count({ where: { status: 'past_due' } }),
      (this.prisma as any).subscription.count({ where: { status: 'cancelled' } }),
      (this.prisma as any).subscription.count({ where: { status: 'expired' } }),
      (this.prisma as any).subscriptionInvoice.count({ where: { status: 'paid' } }),
      (this.prisma as any).subscriptionInvoice.count({ where: { status: 'pending' } }),
      (this.prisma as any).subscriptionInvoice.count({ where: { status: 'overdue' } }),
      (this.prisma as any).subscriptionInvoice.count({ where: { status: 'refused' } }),
      (this.prisma as any).subscriptionInvoice.count({ where: { status: 'cancelled' } }),
      (this.prisma as any).subscriptionInvoice.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),
      (this.prisma as any).subscriptionInvoice.aggregate({
        where: { status: 'overdue' },
        _sum: { amount: true },
      }),
      (this.prisma as any).subscriptionInvoice.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true },
      }),
      (this.prisma as any).subscriptionInvoice.findMany({
        where: { status: 'overdue', dueDate: { lt: referenceDate } },
        orderBy: { dueDate: 'asc' },
        take: 50,
        include: { subscription: { include: { customer: true, plan: true } } },
      }),
    ]);

    const dayMs = 1000 * 60 * 60 * 24;

    return {
      generatedAt: referenceDate.toISOString(),
      plans: { active: activePlans, inactive: inactivePlans },
      subscriptions: {
        active: activeSubscriptions,
        pending: pendingSubscriptions,
        pastDue: pastDueSubscriptions,
        cancelled: cancelledSubscriptions,
        expired: expiredSubscriptions,
      },
      invoices: {
        paid: paidInvoices,
        pending: pendingInvoices,
        overdue: overdueInvoices,
        refused: refusedInvoices,
        cancelled: cancelledInvoices,
        paidAmount: paidAmount._sum.amount ?? 0,
        overdueAmount: overdueAmount._sum.amount ?? 0,
        pendingAmount: pendingAmount._sum.amount ?? 0,
      },
      delinquentCustomers: overdueRows.map((invoice: any) => ({
        customerId: invoice.subscription.customer.id,
        name: invoice.subscription.customer.name,
        email: invoice.subscription.customer.email,
        document: invoice.subscription.customer.document,
        subscriptionId: invoice.subscriptionId,
        invoiceId: invoice.id,
        amount: invoice.amount,
        dueDate: invoice.dueDate.toISOString(),
        daysLate: Math.max(1, Math.floor((referenceDate.getTime() - invoice.dueDate.getTime()) / dayMs)),
      })),
    };
  }
}

// src/infrastructure/database/repositories/WebhookEventRepository.ts
export class WebhookEventRepository implements IWebhookEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateWebhookEventData): Promise<WebhookEvent> {
    const event = await this.prisma.webhookEvent.create({ data: data as any });
    return event as unknown as WebhookEvent;
  }

  async markAsProcessed(id: string): Promise<WebhookEvent> {
    const event = await this.prisma.webhookEvent.update({
      where: { id },
      data: { processed: true },
    });
    return event as unknown as WebhookEvent;
  }

  async findUnprocessed(): Promise<WebhookEvent[]> {
    const events = await this.prisma.webhookEvent.findMany({
      where: { processed: false },
      orderBy: { createdAt: 'asc' },
    });
    return events as unknown as WebhookEvent[];
  }
}
