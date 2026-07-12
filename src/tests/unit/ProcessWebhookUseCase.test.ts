// src/tests/unit/ProcessWebhookUseCase.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessWebhookUseCase } from '../../application/use-cases/other-use-cases';

const mockCheckoutRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findByExternalId: vi.fn(),
  findAll: vi.fn(),
  updateStatus: vi.fn(),
};
const mockPaymentRepo = { create: vi.fn(), findById: vi.fn(), findByCheckoutId: vi.fn(), findAll: vi.fn(), updateStatus: vi.fn() };
const mockWebhookEventRepo = { create: vi.fn(), markAsProcessed: vi.fn(), findUnprocessed: vi.fn() };

describe('ProcessWebhookUseCase', () => {
  let useCase: ProcessWebhookUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ProcessWebhookUseCase(
      mockCheckoutRepo as any,
      mockPaymentRepo as any,
      mockWebhookEventRepo as any
    );
  });

  it('should register webhook event', async () => {
    const payload = {
      event: 'payment.approved',
      data: { id: 'pay-1', checkout_id: 'co-1', status: 'approved', amount: 100, paid_at: new Date().toISOString() },
    };

    mockWebhookEventRepo.create.mockResolvedValue({ id: 'event-1', processed: false });
    mockWebhookEventRepo.markAsProcessed.mockResolvedValue({ id: 'event-1', processed: true });
    mockCheckoutRepo.findByExternalId.mockResolvedValue({
      id: 'checkout-db-1',
      externalId: 'co-1',
      paymentUrl: 'https://pay.io/co-1',
    });
    mockPaymentRepo.findByCheckoutId.mockResolvedValue([{ id: 'pay-db-1', status: 'pending', amount: 100 }]);
    mockPaymentRepo.updateStatus.mockResolvedValue({ id: 'pay-db-1', status: 'approved' });
    mockCheckoutRepo.updateStatus.mockResolvedValue({ id: 'checkout-db-1', status: 'paid' });

    await useCase.execute(payload);

    expect(mockWebhookEventRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'payment_approved' })
    );
    expect(mockWebhookEventRepo.markAsProcessed).toHaveBeenCalledWith('event-1');
    expect(mockCheckoutRepo.updateStatus).toHaveBeenCalledWith(
      'checkout-db-1',
      'paid',
      'co-1',
      'https://pay.io/co-1'
    );
  });

  it('should persist event even when processing fails', async () => {
    const payload = {
      event: 'payment.approved',
      data: { id: 'pay-fail', checkout_id: 'co-fail', status: 'approved', amount: 50 },
    };

    mockWebhookEventRepo.create.mockResolvedValue({ id: 'event-fail' });
    mockCheckoutRepo.findByExternalId.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(payload)).rejects.toThrow('DB error');
    expect(mockWebhookEventRepo.create).toHaveBeenCalled();
    expect(mockWebhookEventRepo.markAsProcessed).not.toHaveBeenCalled();
  });
});
