import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { IGatewayConfigRepository } from '../../../domain/repositories/index';
import { InfinitePayClient } from '../../../infrastructure/http/clients/InfinitePayClient';

const updateSettingsSchema = z.object({
  apiKey: z.string().min(1),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  webhookSecret: z.string().min(1),
});

export class SettingsController {
  constructor(
    private readonly gatewayConfigRepo: IGatewayConfigRepository,
    private readonly ipClient: InfinitePayClient
  ) {}

  async get(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const config = await this.gatewayConfigRepo.get();
    if (!config) {
      reply.send({ configured: false });
      return;
    }
    reply.send({
      configured: true,
      clientId: config.clientId,
    });
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = updateSettingsSchema.parse(request.body);
    const config = await this.gatewayConfigRepo.upsert({
      apiKey: body.apiKey,
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      webhookSecret: body.webhookSecret,
    });
    this.ipClient.setCredentials(body.apiKey, body.clientId, body.clientSecret);
    reply.send({ configured: true });
  }
}
