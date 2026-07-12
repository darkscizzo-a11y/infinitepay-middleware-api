import axios, { AxiosInstance, AxiosError } from 'axios';
import { ExternalServiceError } from '../../../shared/errors/AppError';

export interface InfinitePayCheckoutPayload {
  customer: { name: string; email: string; document: string };
  items: Array<{ name: string; quantity: number; unit_price: number }>;
  amount: number;
  description?: string;
}

export interface InfinitePayCheckoutResponse {
  id: string; status: string; payment_url: string; amount: number; created_at: string;
}

export interface InfinitePayPaymentResponse {
  id: string; checkout_id: string; status: string; amount: number; paid_at?: string; created_at: string;
}

export class InfinitePayClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.INFINITEPAY_API_URL ?? 'https://api.infinitepay.io/v2',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INFINITEPAY_API_KEY ?? ''}`,
        'X-Client-ID': process.env.INFINITEPAY_CLIENT_ID ?? '',
      },
      timeout: Number(process.env.INFINITEPAY_TIMEOUT_MS ?? 30000),
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const message = (error.response?.data as any)?.message ?? error.message;
        throw new ExternalServiceError('InfinitePay', message);
      }
    );
  }

  setCredentials(apiKey: string, clientId: string, clientSecret: string): void {
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
    this.client.defaults.headers['X-Client-ID'] = clientId;
  }

  async createCheckout(payload: InfinitePayCheckoutPayload): Promise<InfinitePayCheckoutResponse> {
    const { data } = await this.client.post<InfinitePayCheckoutResponse>('/checkouts', {
      customer: payload.customer,
      items: payload.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      amount: payload.amount,
      description: payload.description,
    });
    return data;
  }

  async getCheckout(externalId: string): Promise<InfinitePayCheckoutResponse> {
    const { data } = await this.client.get<InfinitePayCheckoutResponse>(`/checkouts/${externalId}`);
    return data;
  }

  async getPayment(externalId: string): Promise<InfinitePayPaymentResponse> {
    const { data } = await this.client.get<InfinitePayPaymentResponse>(`/payments/${externalId}`);
    return data;
  }

  async cancelPayment(externalId: string): Promise<void> {
    await this.client.post(`/payments/${externalId}/cancel`);
  }
}
