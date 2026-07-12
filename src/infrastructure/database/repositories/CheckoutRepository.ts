// src/infrastructure/database/repositories/CheckoutRepository.ts
import { PrismaClient } from '@prisma/client';
import { ICheckoutRepository, CreateCheckoutData } from '../../../domain/repositories/index';
import { Checkout, CheckoutStatus } from '../../../domain/entities/index';
import { PaginatedResult, FilterParams } from '../../../shared/types';

export class CheckoutRepository implements ICheckoutRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateCheckoutData): Promise<Checkout> {
    const checkout = await this.prisma.checkout.create({
      data: {
        customerId: data.customerId,
        amount: data.amount,
        description: data.description,
        metadata: data.metadata as any,
        items: {
          create: data.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { customer: true, items: true },
    });
    return this.mapToEntity(checkout);
  }

  async findById(id: string): Promise<Checkout | null> {
    const checkout = await this.prisma.checkout.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });
    return checkout ? this.mapToEntity(checkout) : null;
  }

  async findByExternalId(externalId: string): Promise<Checkout | null> {
    const checkout = await this.prisma.checkout.findUnique({
      where: { externalId },
      include: { customer: true, items: true },
    });
    return checkout ? this.mapToEntity(checkout) : null;
  }

  async findAll(filters: FilterParams): Promise<PaginatedResult<Checkout>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const orderBy: any = {};
    orderBy[filters.orderBy ?? 'createdAt'] = filters.orderDir ?? 'desc';

    const [items, total] = await Promise.all([
      this.prisma.checkout.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { customer: true, items: true },
      }),
      this.prisma.checkout.count({ where }),
    ]);

    return {
      data: items.map(this.mapToEntity),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(
    id: string,
    status: CheckoutStatus,
    externalId?: string,
    paymentUrl?: string
  ): Promise<Checkout> {
    const checkout = await this.prisma.checkout.update({
      where: { id },
      data: { status, externalId, paymentUrl },
      include: { customer: true, items: true },
    });
    return this.mapToEntity(checkout);
  }

  private mapToEntity(raw: any): Checkout {
    return {
      id: raw.id,
      customerId: raw.customerId,
      externalId: raw.externalId,
      amount: raw.amount,
      status: raw.status as CheckoutStatus,
      paymentUrl: raw.paymentUrl,
      description: raw.description,
      metadata: raw.metadata,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      customer: raw.customer,
      items: raw.items,
    };
  }
}
