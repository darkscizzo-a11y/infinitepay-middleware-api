// src/interfaces/http/controllers/CheckoutController.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createCheckoutSchema, listCheckoutsSchema, idParamSchema } from '../schemas/checkout.schema';
import { CreateCheckoutUseCase } from '../../../application/use-cases/CreateCheckoutUseCase';
import { GetCheckoutUseCase } from '../../../application/use-cases/other-use-cases';
import { ListCheckoutsUseCase } from '../../../application/use-cases/other-use-cases';

export class CheckoutController {
  constructor(
    private readonly createCheckoutUseCase: CreateCheckoutUseCase,
    private readonly getCheckoutUseCase: GetCheckoutUseCase,
    private readonly listCheckoutsUseCase: ListCheckoutsUseCase
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = createCheckoutSchema.parse(request.body);
    const result = await this.createCheckoutUseCase.execute(body);
    reply.status(201).send(result);
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = idParamSchema.parse(request.params);
    const result = await this.getCheckoutUseCase.execute(id);
    reply.send(result);
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = listCheckoutsSchema.parse(request.query);
    const result = await this.listCheckoutsUseCase.execute(query);
    reply.send(result);
  }
}
