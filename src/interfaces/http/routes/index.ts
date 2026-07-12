// src/interfaces/http/routes/index.ts
import { FastifyInstance } from 'fastify';
import { CheckoutController } from '../controllers/CheckoutController';
import { WebhookController } from '../controllers/WebhookController';
import { PaymentController } from '../controllers/PaymentController';
import { RecurrenceController } from '../controllers/RecurrenceController';
import { SettingsController } from '../controllers/SettingsController';

export function registerRoutes(
  app: FastifyInstance,
  {
    checkoutController,
    webhookController,
    paymentController,
    recurrenceController,
    settingsController,
  }: {
    checkoutController: CheckoutController;
    webhookController: WebhookController;
    paymentController: PaymentController;
    recurrenceController: RecurrenceController;
    settingsController: SettingsController;
  }
): void {
  // Health check (unauthenticated)
  app.get('/health', async (_req, reply) => {
    reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Authenticated routes
  app.register(
    async (api) => {
      api.addHook('onRequest', async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch {
          reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        }
      });

      // Checkouts
      api.get('/index', (req, reply) => recurrenceController.index(req, reply));

      api.post('/checkouts', (req, reply) => checkoutController.create(req, reply));
      api.get('/checkouts', (req, reply) => checkoutController.list(req, reply));
      api.get('/checkouts/:id', (req, reply) => checkoutController.getById(req, reply));

      // Payments
      api.get('/payments', (req, reply) => paymentController.list(req, reply));
      api.get('/payments/:id', (req, reply) => paymentController.getById(req, reply));

      // Recurrence
      api.post('/recurrence/plans', (req, reply) => recurrenceController.createPlan(req, reply));
      api.get('/recurrence/plans', (req, reply) => recurrenceController.listPlans(req, reply));
      api.post('/recurrence/subscriptions', (req, reply) =>
        recurrenceController.createSubscription(req, reply)
      );
      api.get('/recurrence/subscriptions', (req, reply) =>
        recurrenceController.listSubscriptions(req, reply)
      );
      api.get('/recurrence/subscriptions/:id', (req, reply) =>
        recurrenceController.getSubscriptionById(req, reply)
      );
      api.post('/recurrence/invoices', (req, reply) => recurrenceController.createInvoice(req, reply));
      api.get('/recurrence/invoices', (req, reply) => recurrenceController.listInvoices(req, reply));

      // Settings
      api.get('/settings', (req, reply) => settingsController.get(req, reply));
      api.put('/settings', (req, reply) => settingsController.update(req, reply));
    },
    { prefix: '/api/v1' }
  );

  // Webhook (unauthenticated, but signature-validated)
  app.register(
    async (api) => {
      api.post('/infinitepay', (req, reply) => webhookController.handle(req, reply));
    },
    { prefix: '/api/v1/webhooks' }
  );
}
