// src/application/use-cases/CreateCheckoutUseCase.ts
import { ICheckoutRepository } from '../../domain/repositories/index';
import { ICustomerRepository } from '../../domain/repositories/index';
import { IPaymentRepository } from '../../domain/repositories/index';
import { InfinitePayClient } from '../../infrastructure/http/clients/InfinitePayClient';
import { CreateCheckoutDTO, CheckoutResponseDTO } from '../dtos/checkout.dto';

export class CreateCheckoutUseCase {
  constructor(
    private readonly checkoutRepository: ICheckoutRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly paymentRepository: IPaymentRepository,
    private readonly infinitePayClient: InfinitePayClient
  ) {}

  async execute(dto: CreateCheckoutDTO): Promise<CheckoutResponseDTO> {
    // 1. Upsert customer
    const customer = await this.customerRepository.findOrCreate(dto.customer);

    // 2. Create local checkout record
    const checkout = await this.checkoutRepository.create({
      customerId: customer.id,
      amount: dto.amount,
      description: dto.description,
      items: dto.items,
    });

    // 3. Call InfinitePay
    const ipCheckout = await this.infinitePayClient.createCheckout({
      customer: dto.customer,
      items: dto.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
      })),
      amount: dto.amount,
      description: dto.description,
    });

    // 4. Update checkout with external data
    const updated = await this.checkoutRepository.updateStatus(
      checkout.id,
      'pending',
      ipCheckout.id,
      ipCheckout.payment_url
    );

    await this.paymentRepository.create({
      checkoutId: updated.id,
      amount: updated.amount,
    });

    return {
      id: updated.id,
      status: updated.status,
      payment_url: updated.paymentUrl,
      amount: updated.amount,
      created_at: updated.createdAt.toISOString(),
    };
  }
}
