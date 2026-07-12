import { FastifyReply, FastifyRequest } from 'fastify';
import {
  ICustomerRepository,
  IRecurrencePlanRepository,
  ISubscriptionInvoiceRepository,
  ISubscriptionRepository,
} from '../../../domain/repositories/index';
import { NotFoundError } from '../../../shared/errors/AppError';
import {
  createRecurrencePlanSchema,
  createSubscriptionInvoiceSchema,
  createSubscriptionSchema,
  listRecurrencePlansSchema,
  listSubscriptionInvoicesSchema,
  listSubscriptionsSchema,
  uuidParamSchema,
} from '../schemas/recurrence.schema';

export class RecurrenceController {
  constructor(
    private readonly planRepository: IRecurrencePlanRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly invoiceRepository: ISubscriptionInvoiceRepository,
    private readonly customerRepository: ICustomerRepository
  ) {}

  async index(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const dashboard = await this.invoiceRepository.getDashboard();
    reply.send(dashboard);
  }

  async createPlan(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = createRecurrencePlanSchema.parse(request.body);
    const plan = await this.planRepository.create({
      ...body,
      amount: Math.round(body.amount * 100),
    });
    reply.status(201).send(this.serializePlan(plan));
  }

  async listPlans(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = listRecurrencePlansSchema.parse(request.query);
    const result = await this.planRepository.findAll(query);

    reply.send({
      ...result,
      data: result.data.map((plan) => this.serializePlan(plan)),
    });
  }

  async createSubscription(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = createSubscriptionSchema.parse(request.body);
    const plan = await this.planRepository.findById(body.planId);
    if (!plan) throw new NotFoundError('Recurrence plan');

    const customer = await this.customerRepository.findOrCreate(body.customer);
    const subscription = await this.subscriptionRepository.create({
      planId: plan.id,
      customerId: customer.id,
      nextDueDate: new Date(body.nextDueDate),
      externalId: body.externalId,
      metadata: body.metadata,
    });

    if (body.createFirstInvoice) {
      await this.invoiceRepository.create({
        subscriptionId: subscription.id,
        amount: plan.amount,
        dueDate: new Date(body.nextDueDate),
      });
    }

    const created = await this.subscriptionRepository.updateStatus(subscription.id, 'active');
    reply.status(201).send(this.serializeSubscription(created));
  }

  async listSubscriptions(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = listSubscriptionsSchema.parse(request.query);
    const result = await this.subscriptionRepository.findAll(query);

    reply.send({
      ...result,
      data: result.data.map((subscription) => this.serializeSubscription(subscription)),
    });
  }

  async getSubscriptionById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = uuidParamSchema.parse(request.params);
    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) throw new NotFoundError('Subscription');
    reply.send(this.serializeSubscription(subscription));
  }

  async createInvoice(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = createSubscriptionInvoiceSchema.parse(request.body);
    const subscription = await this.subscriptionRepository.findById(body.subscriptionId);
    if (!subscription) throw new NotFoundError('Subscription');
    if (!subscription.plan?.amount) throw new NotFoundError('Recurrence plan amount');

    const amountInCents = body.amount ? Math.round(body.amount * 100) : subscription.plan.amount;

    const invoice = await this.invoiceRepository.create({
      subscriptionId: subscription.id,
      amount: amountInCents,
      dueDate: new Date(body.dueDate),
      externalId: body.externalId,
      paymentId: body.paymentId,
    });

    reply.status(201).send(this.serializeInvoice(invoice));
  }

  async listInvoices(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = listSubscriptionInvoicesSchema.parse(request.query);
    const result = await this.invoiceRepository.findAll(query);

    reply.send({
      ...result,
      data: result.data.map((invoice) => this.serializeInvoice(invoice)),
    });
  }

  private serializePlan(plan: any): Record<string, unknown> {
    return {
      id: plan.id,
      external_id: plan.externalId ?? null,
      name: plan.name,
      description: plan.description ?? null,
      amount: plan.amount / 100,
      interval: plan.interval,
      status: plan.status,
      metadata: plan.metadata ?? null,
      created_at: plan.createdAt.toISOString(),
      updated_at: plan.updatedAt.toISOString(),
    };
  }

  private serializeSubscription(subscription: any): Record<string, unknown> {
    return {
      id: subscription.id,
      external_id: subscription.externalId ?? null,
      status: subscription.status,
      started_at: subscription.startedAt.toISOString(),
      next_due_date: subscription.nextDueDate.toISOString(),
      cancelled_at: subscription.cancelledAt?.toISOString() ?? null,
      metadata: subscription.metadata ?? null,
      customer: subscription.customer
        ? {
            id: subscription.customer.id,
            name: subscription.customer.name,
            email: subscription.customer.email,
            document: subscription.customer.document,
          }
        : undefined,
      plan: subscription.plan ? this.serializePlan(subscription.plan) : undefined,
      invoices: subscription.invoices?.map((invoice: any) => this.serializeInvoice(invoice)) ?? [],
      created_at: subscription.createdAt.toISOString(),
      updated_at: subscription.updatedAt.toISOString(),
    };
  }

  private serializeInvoice(invoice: any): Record<string, unknown> {
    return {
      id: invoice.id,
      external_id: invoice.externalId ?? null,
      subscription_id: invoice.subscriptionId,
      payment_id: invoice.paymentId ?? null,
      amount: invoice.amount / 100,
      status: invoice.status,
      due_date: invoice.dueDate.toISOString(),
      paid_at: invoice.paidAt?.toISOString() ?? null,
      created_at: invoice.createdAt.toISOString(),
      updated_at: invoice.updatedAt.toISOString(),
    };
  }
}
