// src/domain/repositories/ICheckoutRepository.ts
import {
  BillingInterval,
  Checkout,
  CheckoutStatus,
  Customer,
  GatewayConfig,
  InvoiceStatus,
  Payment,
  PaymentStatus,
  RecurrencePlan,
  RecurrencePlanStatus,
  Subscription,
  SubscriptionInvoice,
  SubscriptionStatus,
  WebhookEvent,
  WebhookEventType,
} from '../entities/index';
import { PaginatedResult, FilterParams } from '../../shared/types';

export interface CreateCheckoutData {
  customerId: string;
  amount: number;
  description?: string;
  metadata?: Record<string, unknown>;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export interface ICheckoutRepository {
  create(data: CreateCheckoutData): Promise<Checkout>;
  findById(id: string): Promise<Checkout | null>;
  findByExternalId(externalId: string): Promise<Checkout | null>;
  findAll(filters: FilterParams): Promise<PaginatedResult<Checkout>>;
  updateStatus(id: string, status: CheckoutStatus, externalId?: string, paymentUrl?: string): Promise<Checkout>;
}

// src/domain/repositories/ICustomerRepository.ts
export interface CreateCustomerData {
  name: string;
  email: string;
  document: string;
}

export interface ICustomerRepository {
  findOrCreate(data: CreateCustomerData): Promise<Customer>;
  findById(id: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
}

// src/domain/repositories/IPaymentRepository.ts
export interface CreatePaymentData {
  checkoutId: string;
  amount: number;
  externalId?: string;
}

export interface IPaymentRepository {
  create(data: CreatePaymentData): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByCheckoutId(checkoutId: string): Promise<Payment[]>;
  findAll(filters: FilterParams): Promise<PaginatedResult<Payment>>;
  updateStatus(id: string, status: PaymentStatus, paidAt?: Date): Promise<Payment>;
}

export interface CreateRecurrencePlanData {
  name: string;
  description?: string;
  amount: number;
  interval: BillingInterval;
  externalId?: string;
  metadata?: Record<string, unknown>;
}

export interface ListRecurrencePlansFilters extends FilterParams {
  status?: RecurrencePlanStatus;
}

export interface IRecurrencePlanRepository {
  create(data: CreateRecurrencePlanData): Promise<RecurrencePlan>;
  findById(id: string): Promise<RecurrencePlan | null>;
  findAll(filters: ListRecurrencePlansFilters): Promise<PaginatedResult<RecurrencePlan>>;
}

export interface CreateSubscriptionData {
  planId: string;
  customerId: string;
  nextDueDate: Date;
  externalId?: string;
  metadata?: Record<string, unknown>;
}

export interface ListSubscriptionsFilters extends FilterParams {
  status?: SubscriptionStatus;
  customerId?: string;
  planId?: string;
}

export interface ISubscriptionRepository {
  create(data: CreateSubscriptionData): Promise<Subscription>;
  findById(id: string): Promise<Subscription | null>;
  findByExternalId(externalId: string): Promise<Subscription | null>;
  findAll(filters: ListSubscriptionsFilters): Promise<PaginatedResult<Subscription>>;
  updateStatus(id: string, status: SubscriptionStatus, nextDueDate?: Date): Promise<Subscription>;
}

export interface CreateSubscriptionInvoiceData {
  subscriptionId: string;
  amount: number;
  dueDate: Date;
  externalId?: string;
  paymentId?: string;
}

export interface ListSubscriptionInvoicesFilters extends FilterParams {
  status?: InvoiceStatus;
  subscriptionId?: string;
  overdueOnly?: boolean;
}

export interface SubscriptionDashboard {
  generatedAt: string;
  plans: {
    active: number;
    inactive: number;
  };
  subscriptions: {
    active: number;
    pending: number;
    pastDue: number;
    cancelled: number;
    expired: number;
  };
  invoices: {
    paid: number;
    pending: number;
    overdue: number;
    refused: number;
    cancelled: number;
    paidAmount: number;
    overdueAmount: number;
    pendingAmount: number;
  };
  delinquentCustomers: Array<{
    customerId: string;
    name: string;
    email: string;
    document: string;
    subscriptionId: string;
    invoiceId: string;
    amount: number;
    dueDate: string;
    daysLate: number;
  }>;
}

export interface ISubscriptionInvoiceRepository {
  create(data: CreateSubscriptionInvoiceData): Promise<SubscriptionInvoice>;
  findById(id: string): Promise<SubscriptionInvoice | null>;
  findByExternalId(externalId: string): Promise<SubscriptionInvoice | null>;
  findAll(filters: ListSubscriptionInvoicesFilters): Promise<PaginatedResult<SubscriptionInvoice>>;
  updateStatus(id: string, status: InvoiceStatus, paidAt?: Date): Promise<SubscriptionInvoice>;
  getDashboard(referenceDate?: Date): Promise<SubscriptionDashboard>;
  markPendingInvoicesAsOverdue(referenceDate?: Date): Promise<number>;
}

// src/domain/repositories/IWebhookEventRepository.ts
export interface CreateWebhookEventData {
  paymentId?: string;
  eventType: WebhookEventType;
  payload: Record<string, unknown>;
}

export interface IWebhookEventRepository {
  create(data: CreateWebhookEventData): Promise<WebhookEvent>;
  markAsProcessed(id: string): Promise<WebhookEvent>;
  findUnprocessed(): Promise<WebhookEvent[]>;
}

// src/domain/repositories/IGatewayConfigRepository.ts
export interface IGatewayConfigRepository {
  get(): Promise<GatewayConfig | null>;
  upsert(data: Omit<GatewayConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<GatewayConfig>;
}
