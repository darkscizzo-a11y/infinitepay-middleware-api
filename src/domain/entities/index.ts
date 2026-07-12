// src/domain/entities/Customer.ts
export interface Customer {
  id: string;
  name: string;
  email: string;
  document: string;
  createdAt: Date;
}

// src/domain/entities/CheckoutItem.ts
export interface CheckoutItem {
  id: string;
  checkoutId: string;
  name: string;
  quantity: number;
  price: number;
}

// src/domain/entities/Checkout.ts
export type CheckoutStatus = 'pending' | 'paid' | 'cancelled' | 'refunded' | 'refused';

export interface Checkout {
  id: string;
  customerId: string;
  externalId?: string | null;
  amount: number;
  status: CheckoutStatus;
  paymentUrl?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  items?: CheckoutItem[];
}

// src/domain/entities/Payment.ts
export type PaymentStatus = 'pending' | 'approved' | 'refused' | 'refunded' | 'cancelled';

export interface Payment {
  id: string;
  checkoutId: string;
  externalId?: string | null;
  status: PaymentStatus;
  amount: number;
  paidAt?: Date | null;
  createdAt: Date;
}

// src/domain/entities/WebhookEvent.ts
export type WebhookEventType =
  | 'payment_pending'
  | 'payment_approved'
  | 'payment_refused'
  | 'payment_refunded'
  | 'payment_cancelled'
  | 'subscription_created'
  | 'subscription_active'
  | 'subscription_cancelled'
  | 'subscription_past_due'
  | 'invoice_paid'
  | 'invoice_overdue';

export interface WebhookEvent {
  id: string;
  paymentId?: string | null;
  eventType: WebhookEventType;
  payload: Record<string, unknown>;
  processed: boolean;
  createdAt: Date;
}

export type BillingInterval = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type RecurrencePlanStatus = 'active' | 'inactive';
export type SubscriptionStatus = 'pending' | 'active' | 'past_due' | 'cancelled' | 'expired';
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refused';

export interface RecurrencePlan {
  id: string;
  externalId?: string | null;
  name: string;
  description?: string | null;
  amount: number;
  interval: BillingInterval;
  status: RecurrencePlanStatus;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  externalId?: string | null;
  planId: string;
  customerId: string;
  status: SubscriptionStatus;
  startedAt: Date;
  nextDueDate: Date;
  cancelledAt?: Date | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  plan?: RecurrencePlan;
  customer?: Customer;
  invoices?: SubscriptionInvoice[];
}

export interface SubscriptionInvoice {
  id: string;
  externalId?: string | null;
  subscriptionId: string;
  paymentId?: string | null;
  amount: number;
  status: InvoiceStatus;
  dueDate: Date;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  subscription?: Subscription;
}

// src/domain/entities/GatewayConfig.ts
export interface GatewayConfig {
  id: string;
  apiKey: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  updatedAt: Date;
  createdAt: Date;
}
