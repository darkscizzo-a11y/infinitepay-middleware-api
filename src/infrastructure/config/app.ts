// src/infrastructure/config/app.ts
import Fastify, { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { ZodError } from 'zod';
import { AppError } from '../../shared/errors/AppError';
import { registerRoutes } from '../../interfaces/http/routes/index';

// Repositories
import { prisma } from '../database/prisma/client';
import { CheckoutRepository } from '../database/repositories/CheckoutRepository';
import {
  CustomerRepository,
  PaymentRepository,
  RecurrencePlanRepository,
  SubscriptionInvoiceRepository,
  SubscriptionRepository,
  WebhookEventRepository,
  GatewayConfigRepository,
} from '../database/repositories/repositories';

// Clients
import { InfinitePayClient } from '../http/clients/InfinitePayClient';

// Use Cases
import { CreateCheckoutUseCase } from '../../application/use-cases/CreateCheckoutUseCase';
import {
  GetCheckoutUseCase,
  ListCheckoutsUseCase,
  ProcessWebhookUseCase,
} from '../../application/use-cases/other-use-cases';

// Controllers
import { CheckoutController } from '../../interfaces/http/controllers/CheckoutController';
import { WebhookController } from '../../interfaces/http/controllers/WebhookController';
import { PaymentController } from '../../interfaces/http/controllers/PaymentController';
import { RecurrenceController } from '../../interfaces/http/controllers/RecurrenceController';
import { SettingsController } from '../../interfaces/http/controllers/SettingsController';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      serializers: {
        req(req) {
          return { method: req.method, url: req.url };
        },
      },
    },
  });

  // Security
  await app.register(fastifyHelmet, { global: true });
  await app.register(fastifyCors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // Rate Limiting
  await app.register(fastifyRateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX ?? 100),
    timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
  });

  // JWT
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
  });

  // Swagger
  await app.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'InfinitePay Middleware API',
        description: 'API intermediária para integração com a InfinitePay',
        version: '1.0.0',
        contact: { name: 'Suporte', email: 'suporte@seudominio.com.br' },
      },
      servers: [
        { url: 'https://meuinfinitepay.vercel.app', description: 'Produção' },
        { url: `http://localhost:${process.env.PORT ?? 3000}`, description: 'Desenvolvimento' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: 'checkouts', description: 'Gerenciamento de checkouts' },
        { name: 'payments', description: 'Consulta de pagamentos' },
        { name: 'webhooks', description: 'Webhooks da InfinitePay' },
        { name: 'health', description: 'Status da API' },
      ],
    },
  });
  await app.register(fastifySwaggerUi, { routePrefix: '/swagger' });

  // Dependency injection (manual, production would use a DI container)
  const checkoutRepo = new CheckoutRepository(prisma);
  const customerRepo = new CustomerRepository(prisma);
  const paymentRepo = new PaymentRepository(prisma);
  const recurrencePlanRepo = new RecurrencePlanRepository(prisma);
  const subscriptionRepo = new SubscriptionRepository(prisma);
  const subscriptionInvoiceRepo = new SubscriptionInvoiceRepository(prisma);
  const webhookEventRepo = new WebhookEventRepository(prisma);
  const gatewayConfigRepo = new GatewayConfigRepository(prisma);
  const ipClient = new InfinitePayClient();

  // Load saved gateway config
  const savedConfig = await gatewayConfigRepo.get();
  if (savedConfig) {
    ipClient.setCredentials(savedConfig.apiKey, savedConfig.clientId, savedConfig.clientSecret);
  }

  const createCheckoutUC = new CreateCheckoutUseCase(checkoutRepo, customerRepo, paymentRepo, ipClient);
  const getCheckoutUC = new GetCheckoutUseCase(checkoutRepo);
  const listCheckoutsUC = new ListCheckoutsUseCase(checkoutRepo);
  const processWebhookUC = new ProcessWebhookUseCase(checkoutRepo, paymentRepo, webhookEventRepo);

  const checkoutCtrl = new CheckoutController(createCheckoutUC, getCheckoutUC, listCheckoutsUC);
  const webhookCtrl = new WebhookController(processWebhookUC);
  const paymentCtrl = new PaymentController(paymentRepo);
  const recurrenceCtrl = new RecurrenceController(
    recurrencePlanRepo,
    subscriptionRepo,
    subscriptionInvoiceRepo,
    customerRepo
  );
  const settingsCtrl = new SettingsController(gatewayConfigRepo, ipClient);

  // Routes
  registerRoutes(app, {
    checkoutController: checkoutCtrl,
    webhookController: webhookCtrl,
    paymentController: paymentCtrl,
    recurrenceController: recurrenceCtrl,
    settingsController: settingsCtrl,
  });

  // Serve dashboard static files
  app.register(fastifyStatic, {
    root: path.join(__dirname, '..', '..', '..', 'dashboard'),
    prefix: '/dashboard/',
    decorateReply: true,
  });

  // Global error handler
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    if (error instanceof ZodError) {
      return reply.status(422).send({
        error: 'Validation Error',
        code: 'VALIDATION_ERROR',
        details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.message,
        code: error.code,
      });
    }

    return reply.status(500).send({
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
    });
  });

  return app;
}
