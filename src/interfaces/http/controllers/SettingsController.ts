import { FastifyReply, FastifyRequest } from 'fastify';
import { IGatewayConfigRepository } from '../../../domain/repositories/index';
import { InfinitePayClient } from '../../../infrastructure/http/clients/InfinitePayClient';

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
      apiKey: config.apiKey,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      webhookSecret: config.webhookSecret,
    });
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as any;
    const config = await this.gatewayConfigRepo.upsert({
      apiKey: body.apiKey,
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      webhookSecret: body.webhookSecret,
    });
    this.ipClient.setCredentials(body.apiKey, body.clientId, body.clientSecret);
    reply.send({
      configured: true,
      apiKey: config.apiKey,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      webhookSecret: config.webhookSecret,
    });
  }
}
