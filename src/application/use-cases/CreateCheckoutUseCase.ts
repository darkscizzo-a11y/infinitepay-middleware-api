// src/application/use-cases/CreateCheckoutUseCase.ts
import { PrismaClient } from '@prisma/client';
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
    private readonly infinitePayClient: InfinitePayClient,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(dto: CreateCheckoutDTO): Promise<CheckoutResponseDTO> {
    const amountInCents = Math.round(dto.amount * 100);
    const itemsInCents = dto.items.map((i) => ({
      ...i,
      price: Math.round(i.price * 100),
    }));

    return this.prisma.$transaction(async (tx) => {
      const customer = await this.customerRepository.findOrCreate(dto.customer);

      const checkout = await this.checkoutRepository.create({
        customerId: customer.id,
        amount: amountInCents,
        description: dto.description,
        items: itemsInCents,
      });

      const ipCheckout = await this.infinitePayClient.createCheckout({
        customer: dto.customer,
        items: itemsInCents.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unit_price: i.price,
        })),
        amount: amountInCents,
        description: dto.description,
      });

      const updated = await this.checkoutRepository.updateStatus(
        checkout.id,
        'pending',
        ipCheckout.id,
        ipCheckout.payment_url
      );

      await this.paymentRepository.create({
        checkoutId: updated.id,
        amount: amountInCents,
      });

      return {
        id: updated.id,
        status: updated.status,
        payment_url: updated.paymentUrl,
        amount: amountInCents / 100,
        created_at: updated.createdAt.toISOString(),
      };
    });
  }
}
