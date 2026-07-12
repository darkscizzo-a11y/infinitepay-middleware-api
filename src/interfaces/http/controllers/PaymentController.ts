import { FastifyRequest, FastifyReply } from 'fastify';
import { IPaymentRepository } from '../../../domain/repositories/index';
import { NotFoundError } from '../../../shared/errors/AppError';
import { idParamSchema } from '../schemas/checkout.schema';
import { listPaymentsSchema } from '../schemas/checkout.schema';

export class PaymentController {
  constructor(private readonly paymentRepository: IPaymentRepository) {}

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = listPaymentsSchema.parse(request.query);
    const result = await this.paymentRepository.findAll(query);
    reply.send({
      ...result,
      data: result.data.map((pm) => ({
        id: pm.id,
        external_id: pm.externalId,
        checkout_id: pm.checkoutId,
        amount: pm.amount / 100,
        status: pm.status,
        paid_at: pm.paidAt?.toISOString() ?? null,
        created_at: pm.createdAt.toISOString(),
      })),
    });
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    const pm = await this.paymentRepository.findById(id);
    if (!pm) throw new NotFoundError('Payment');
    reply.send({
      id: pm.id,
      external_id: pm.externalId,
      checkout_id: pm.checkoutId,
      amount: pm.amount / 100,
      status: pm.status,
      paid_at: pm.paidAt?.toISOString() ?? null,
      created_at: pm.createdAt.toISOString(),
    });
  }
}
