// src/interfaces/http/controllers/WebhookController.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { ProcessWebhookUseCase } from '../../../application/use-cases/other-use-cases';
import { UnauthorizedError } from '../../../shared/errors/AppError';

export class WebhookController {
  constructor(private readonly processWebhookUseCase: ProcessWebhookUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    this.validateSignature(request);
    await this.processWebhookUseCase.execute(request.body as any);
    reply.send({ received: true });
  }

  private validateSignature(request: FastifyRequest): void {
    const secret = process.env.INFINITEPAY_WEBHOOK_SECRET;
    if (!secret) {
      const env = process.env.NODE_ENV ?? 'development';
      if (env === 'production') throw new UnauthorizedError('INFINITEPAY_WEBHOOK_SECRET not configured');
      return;
    }

    const signature = request.headers['x-infinitepay-signature'] as string;
    if (!signature) throw new UnauthorizedError('Missing webhook signature');
    if (!request.body) throw new UnauthorizedError('Empty webhook body');

    const payload = JSON.stringify(request.body);
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const trusted = `sha256=${expected}`;

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(trusted))) {
      throw new UnauthorizedError('Invalid webhook signature');
    }
  }
}
