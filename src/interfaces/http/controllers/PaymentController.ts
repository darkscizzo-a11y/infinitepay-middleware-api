// src/interfaces/http/controllers/PaymentController.ts
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
    reply.send(result);
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    const payment = await this.paymentRepository.findById(id);
    if (!payment) throw new NotFoundError('Payment');
    reply.send(payment);
  }
}
