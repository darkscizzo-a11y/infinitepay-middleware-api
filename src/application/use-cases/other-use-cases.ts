import {
  ICheckoutRepository,
  IPaymentRepository,
  IWebhookEventRepository,
} from '../../domain/repositories/index';
import { WebhookEventType } from '../../domain/entities/index';
import { NotFoundError } from '../../shared/errors/AppError';
import { PaginatedResult } from '../../shared/types';
import { CheckoutResponseDTO, ListCheckoutsQueryDTO } from '../dtos/checkout.dto';

export class GetCheckoutUseCase {
  constructor(private readonly checkoutRepository: ICheckoutRepository) {}

  async execute(id: string): Promise<CheckoutResponseDTO> {
    const checkout = await this.checkoutRepository.findById(id);
    if (!checkout) throw new NotFoundError('Checkout');

    return {
      id: checkout.id,
      status: checkout.status,
      payment_url: checkout.paymentUrl,
      amount: checkout.amount,
      created_at: checkout.createdAt.toISOString(),
      updated_at: checkout.updatedAt.toISOString(),
      customer: checkout.customer
        ? { id: checkout.customer.id, name: checkout.customer.name, email: checkout.customer.email }
        : undefined,
      items: checkout.items?.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    };
  }
}

export class ListCheckoutsUseCase {
  constructor(private readonly checkoutRepository: ICheckoutRepository) {}

  async execute(query: ListCheckoutsQueryDTO): Promise<PaginatedResult<CheckoutResponseDTO>> {
    const result = await this.checkoutRepository.findAll({
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      limit: query.limit,
      orderBy: query.orderBy,
      orderDir: query.orderDir,
    });

    return {
      ...result,
      data: result.data.map((checkout) => ({
        id: checkout.id,
        status: checkout.status,
        payment_url: checkout.paymentUrl,
        amount: checkout.amount,
        created_at: checkout.createdAt.toISOString(),
        updated_at: checkout.updatedAt.toISOString(),
      })),
    };
  }
}

export interface WebhookPayload {
  event: string;
  data: {
    id: string;
    checkout_id?: string;
    subscription_id?: string;
    invoice_id?: string;
    status: string;
    amount: number;
    paid_at?: string;
    due_date?: string;
  };
}

const eventTypeMap: Record<string, WebhookEventType> = {
  'payment.pending': 'payment_pending',
  'payment.approved': 'payment_approved',
  'payment.refused': 'payment_refused',
  'payment.refunded': 'payment_refunded',
  'payment.cancelled': 'payment_cancelled',
  'invoice.paid': 'invoice_paid',
  'invoice.overdue': 'invoice_overdue',
  'subscription.created': 'subscription_created',
  'subscription.active': 'subscription_active',
  'subscription.cancelled': 'subscription_cancelled',
  'subscription.past_due': 'subscription_past_due',
};

export class ProcessWebhookUseCase {
  constructor(
    private readonly checkoutRepository: ICheckoutRepository,
    private readonly paymentRepository: IPaymentRepository,
    private readonly webhookEventRepository: IWebhookEventRepository
  ) {}

  async execute(payload: WebhookPayload): Promise<void> {
    const eventType = eventTypeMap[payload.event];

    const webhookEvent = await this.webhookEventRepository.create({
      eventType: eventType ?? 'payment_pending',
      payload: payload as unknown as Record<string, unknown>,
    });

    try {
      await this.processEvent(payload);
      await this.webhookEventRepository.markAsProcessed(webhookEvent.id);
    } catch (err) {
      throw err;
    }
  }

  private async processEvent(payload: WebhookPayload): Promise<void> {
    const { event, data } = payload;

    switch (event) {
      case 'payment.approved':
        await this.handlePaymentStatus(data, 'approved', 'paid', data.paid_at ? new Date(data.paid_at) : new Date());
        break;
      case 'payment.refused':
        await this.handlePaymentStatus(data, 'refused', 'refused');
        break;
      case 'payment.refunded':
        await this.handlePaymentStatus(data, 'refunded', 'refunded');
        break;
      case 'payment.cancelled':
        await this.handlePaymentStatus(data, 'cancelled', 'cancelled');
        break;
    }
  }

  private async handlePaymentStatus(
    data: WebhookPayload['data'],
    paymentStatus: 'approved' | 'refused' | 'refunded' | 'cancelled',
    checkoutStatus: 'paid' | 'refused' | 'refunded' | 'cancelled',
    paidAt?: Date
  ): Promise<void> {
    if (!data.checkout_id) return;

    const checkout = await this.checkoutRepository.findByExternalId(data.checkout_id);
    if (!checkout) return;

    const payments = await this.paymentRepository.findByCheckoutId(checkout.id);
    const payment = payments[0];
    if (payment) {
      await this.paymentRepository.updateStatus(payment.id, paymentStatus, paidAt);
    }

    await this.checkoutRepository.updateStatus(
      checkout.id,
      checkoutStatus,
      checkout.externalId ?? undefined,
      checkout.paymentUrl ?? undefined
    );
  }
}
