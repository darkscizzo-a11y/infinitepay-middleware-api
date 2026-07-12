// src/application/dtos/checkout.dto.ts

export interface CreateCheckoutDTO {
  customer: {
    name: string;
    email: string;
    document: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  amount: number;
  description?: string;
}

export interface CheckoutResponseDTO {
  id: string;
  status: string;
  payment_url?: string | null;
  amount: number;
  created_at: string;
  updated_at?: string;
  paid_at?: string | null;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface ListCheckoutsQueryDTO {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}
