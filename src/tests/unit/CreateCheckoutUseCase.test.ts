// src/tests/unit/CreateCheckoutUseCase.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateCheckoutUseCase } from '../../application/use-cases/CreateCheckoutUseCase';

const mockCheckoutRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findByExternalId: vi.fn(),
  findAll: vi.fn(),
  updateStatus: vi.fn(),
};

const mockCustomerRepo = {
  findOrCreate: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
};

const mockIpClient = {
  createCheckout: vi.fn(),
  getCheckout: vi.fn(),
  getPayment: vi.fn(),
  cancelPayment: vi.fn(),
};

const mockPaymentRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findByCheckoutId: vi.fn(),
  findAll: vi.fn(),
  updateStatus: vi.fn(),
};

describe('CreateCheckoutUseCase', () => {
  let useCase: CreateCheckoutUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new CreateCheckoutUseCase(
      mockCheckoutRepo as any,
      mockCustomerRepo as any,
      mockPaymentRepo as any,
      mockIpClient as any
    );
  });

  it('should create a checkout successfully', async () => {
    const dto = {
      customer: { name: 'João Silva', email: 'joao@email.com', document: '12345678900' },
      items: [{ name: 'Produto Teste', quantity: 1, price: 100 }],
      amount: 100,
      description: 'Pedido #123',
    };

    mockCustomerRepo.findOrCreate.mockResolvedValue({ id: 'customer-1', ...dto.customer });
    mockCheckoutRepo.create.mockResolvedValue({
      id: 'checkout-1',
      customerId: 'customer-1',
      amount: 100,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockIpClient.createCheckout.mockResolvedValue({
      id: 'ip-checkout-1',
      status: 'pending',
      payment_url: 'https://pay.infinitepay.io/checkout/ip-checkout-1',
      amount: 100,
      created_at: new Date().toISOString(),
    });
    mockCheckoutRepo.updateStatus.mockResolvedValue({
      id: 'checkout-1',
      customerId: 'customer-1',
      externalId: 'ip-checkout-1',
      amount: 100,
      status: 'pending',
      paymentUrl: 'https://pay.infinitepay.io/checkout/ip-checkout-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPaymentRepo.create.mockResolvedValue({
      id: 'payment-1',
      checkoutId: 'checkout-1',
      amount: 100,
      status: 'pending',
      createdAt: new Date(),
    });

    const result = await useCase.execute(dto);

    expect(result.id).toBe('checkout-1');
    expect(result.status).toBe('pending');
    expect(result.payment_url).toBe('https://pay.infinitepay.io/checkout/ip-checkout-1');
    expect(mockCustomerRepo.findOrCreate).toHaveBeenCalledWith(dto.customer);
    expect(mockIpClient.createCheckout).toHaveBeenCalledOnce();
    expect(mockPaymentRepo.create).toHaveBeenCalledWith({
      checkoutId: 'checkout-1',
      amount: 100,
    });
  });

  it('should reuse existing customer', async () => {
    const dto = {
      customer: { name: 'Maria', email: 'maria@email.com', document: '98765432100' },
      items: [{ name: 'Item', quantity: 2, price: 50 }],
      amount: 100,
    };

    mockCustomerRepo.findOrCreate.mockResolvedValue({ id: 'existing-customer', ...dto.customer });
    mockCheckoutRepo.create.mockResolvedValue({ id: 'co-2', customerId: 'existing-customer', amount: 100, status: 'pending', createdAt: new Date(), updatedAt: new Date() });
    mockIpClient.createCheckout.mockResolvedValue({ id: 'ip-2', status: 'pending', payment_url: 'https://pay.io/2', amount: 100, created_at: new Date().toISOString() });
    mockCheckoutRepo.updateStatus.mockResolvedValue({ id: 'co-2', customerId: 'existing-customer', amount: 100, status: 'pending', paymentUrl: 'https://pay.io/2', createdAt: new Date(), updatedAt: new Date() });
    mockPaymentRepo.create.mockResolvedValue({ id: 'pay-2' });

    await useCase.execute(dto);

    expect(mockCheckoutRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'existing-customer' })
    );
  });

  it('should throw if InfinitePay call fails', async () => {
    const dto = {
      customer: { name: 'Test', email: 'test@email.com', document: '11111111111' },
      items: [{ name: 'P', quantity: 1, price: 10 }],
      amount: 10,
    };

    mockCustomerRepo.findOrCreate.mockResolvedValue({ id: 'c-1', ...dto.customer });
    mockCheckoutRepo.create.mockResolvedValue({ id: 'co-1', customerId: 'c-1', amount: 10, status: 'pending', createdAt: new Date(), updatedAt: new Date() });
    mockIpClient.createCheckout.mockRejectedValue(new Error('InfinitePay error: timeout'));

    await expect(useCase.execute(dto)).rejects.toThrow('InfinitePay error: timeout');
  });
});
