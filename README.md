# InfinitePay Middleware API

API intermediária para integração com o checkout da InfinitePay. Abstrai completamente as regras do gateway e expõe uma interface padronizada para ERPs, CRMs, E-commerces, SaaS e sistemas legados.

---

## Stack

| Tecnologia | Versão |
|-----------|--------|
| Node.js | 20+ |
| TypeScript | 5.5+ |
| Fastify | 4.x |
| PostgreSQL | 16 |
| Prisma ORM | 5.x |
| Zod | 3.x |
| Vitest | 1.x |

---

## Arquitetura

```
src/
├── application/
│   ├── dtos/              # Data Transfer Objects
│   └── use-cases/         # Casos de uso da aplicação
├── domain/
│   ├── entities/          # Entidades de domínio
│   └── repositories/      # Interfaces dos repositórios
├── infrastructure/
│   ├── config/            # Bootstrap da aplicação (Fastify)
│   ├── database/
│   │   ├── prisma/        # Cliente Prisma
│   │   └── repositories/  # Implementações dos repositórios
│   └── http/
│       └── clients/       # InfinitePayClient
├── interfaces/
│   └── http/
│       ├── controllers/   # Controllers
│       ├── routes/        # Registro de rotas
│       └── schemas/       # Schemas Zod
├── shared/
│   ├── errors/            # Classes de erro
│   └── types/             # Tipos compartilhados
├── docs/
│   └── openapi.yaml       # Especificação OpenAPI 3.1
└── tests/
    ├── unit/
    └── integration/
```

---

## Início Rápido

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose

### 1. Clonar e configurar
```bash
git clone <repo>
cd infinitepay-middleware-api
cp .env.example .env
# Edite .env com suas credenciais
```

### 2. Subir com Docker
```bash
docker compose up -d
```

### 3. Rodar localmente (dev)
```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

A API estará disponível em `http://localhost:3000`.
Swagger em `http://localhost:3000/swagger`.

---

## Deploy em Produção

### Variáveis obrigatórias
```env
NODE_ENV=production
JWT_SECRET=<string aleatória de 64 chars>
DATABASE_URL=postgresql://user:pass@host:5432/db
INFINITEPAY_API_URL=https://api.infinitepay.io/v2
INFINITEPAY_API_KEY=<sua chave>
INFINITEPAY_WEBHOOK_SECRET=<seu segredo para validação HMAC>
```

### Build
```bash
npm run build
npm run db:migrate:prod
npm start
```

### Docker
```bash
docker build -t infinitepay-api .
docker run -p 3000:3000 --env-file .env infinitepay-api
```

---

## Autenticação

Todos os endpoints (exceto `/health` e `/api/v1/webhooks/infinitepay`) exigem JWT.

```http
Authorization: Bearer <seu_token_jwt>
```

Para gerar um token de teste:
```bash
node -e "
const jwt = require('jsonwebtoken');
console.log(jwt.sign({ sub: 'api-client', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' }));
"
```

---

## Endpoints

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| POST | `/api/v1/checkouts` | Criar checkout |
| GET | `/api/v1/checkouts` | Listar checkouts |
| GET | `/api/v1/checkouts/:id` | Buscar checkout |
| GET | `/api/v1/payments` | Listar pagamentos |
| GET | `/api/v1/payments/:id` | Buscar pagamento |
| GET | `/api/v1/index` | Dashboard de recorrência, pagamentos e inadimplência |
| POST | `/api/v1/recurrence/plans` | Criar plano recorrente |
| GET | `/api/v1/recurrence/plans` | Listar planos recorrentes |
| POST | `/api/v1/recurrence/subscriptions` | Criar assinatura recorrente |
| GET | `/api/v1/recurrence/subscriptions` | Listar assinaturas |
| GET | `/api/v1/recurrence/subscriptions/:id` | Buscar assinatura |
| POST | `/api/v1/recurrence/invoices` | Criar fatura recorrente |
| GET | `/api/v1/recurrence/invoices` | Listar faturas recorrentes |
| POST | `/api/v1/webhooks/infinitepay` | Receber webhook |

---

## Integração por Terceiros

### Exemplo: Criar um Checkout

```bash
curl -X POST http://localhost:3000/api/v1/checkouts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "João Silva",
      "email": "joao@email.com",
      "document": "12345678900"
    },
    "items": [
      { "name": "Produto X", "quantity": 2, "price": 49.90 }
    ],
    "amount": 99.80,
    "description": "Pedido #456"
  }'
```

**Resposta:**
```json
{
  "id": "uuid-do-checkout",
  "status": "pending",
  "payment_url": "https://pay.infinitepay.io/checkout/...",
  "amount": 99.80,
  "created_at": "2026-01-01T12:00:00.000Z"
}
```

### Exemplo: Criar um Plano Recorrente

```bash
curl -X POST http://localhost:3000/api/v1/recurrence/plans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Plano Pro Mensal",
    "description": "Assinatura mensal do sistema",
    "amount": 99.90,
    "interval": "monthly"
  }'
```

### Exemplo: Criar uma Assinatura

```bash
curl -X POST http://localhost:3000/api/v1/recurrence/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "uuid-do-plano",
    "customer": {
      "name": "Maria Souza",
      "email": "maria@email.com",
      "document": "12345678900"
    },
    "nextDueDate": "2026-08-10T00:00:00.000Z",
    "createFirstInvoice": true
  }'
```

### Exemplo: Consultar o Index/Dashboard

```bash
curl http://localhost:3000/api/v1/index \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta resumida:**
```json
{
  "generatedAt": "2026-07-11T00:00:00.000Z",
  "plans": { "active": 1, "inactive": 0 },
  "subscriptions": {
    "active": 8,
    "pending": 0,
    "pastDue": 2,
    "cancelled": 1,
    "expired": 0
  },
  "invoices": {
    "paid": 20,
    "pending": 5,
    "overdue": 2,
    "refused": 1,
    "cancelled": 0,
    "paidAmount": 1998,
    "overdueAmount": 199.8,
    "pendingAmount": 499.5
  },
  "delinquentCustomers": [
    {
      "customerId": "uuid-do-cliente",
      "name": "Maria Souza",
      "email": "maria@email.com",
      "document": "12345678900",
      "subscriptionId": "uuid-da-assinatura",
      "invoiceId": "uuid-da-fatura",
      "amount": 99.9,
      "dueDate": "2026-07-01T00:00:00.000Z",
      "daysLate": 10
    }
  ]
}
```

Os status de recorrência são mantidos localmente pelo middleware:

- Planos: `active`, `inactive`
- Assinaturas: `pending`, `active`, `past_due`, `cancelled`, `expired`
- Faturas: `pending`, `paid`, `overdue`, `cancelled`, `refused`

Ao consultar `/api/v1/index`, faturas `pending` com vencimento anterior à data atual são marcadas como `overdue`, e assinaturas vinculadas entram em `past_due`.

### Exemplo: Configurar Webhook

Configure na InfinitePay o endpoint:
```
POST https://sua-api.com.br/api/v1/webhooks/infinitepay
```

A assinatura HMAC-SHA256 será validada automaticamente usando `INFINITEPAY_WEBHOOK_SECRET`.

---

## Testes

```bash
npm test                # Todos os testes
npm run test:coverage   # Com relatório de cobertura (mínimo 90%)
```

---

## Estratégia para Múltiplos Gateways

A arquitetura está preparada para suportar múltiplos gateways sem alterar o domínio ou os use cases.

### Como adicionar um novo gateway (ex: Stripe)

1. **Criar o client** em `src/infrastructure/http/clients/StripeClient.ts`
2. **Implementar a mesma interface** que `InfinitePayClient` (métodos `createCheckout`, `getCheckout`, `getPayment`, `cancelPayment`)
3. **Registrar no DI** em `src/infrastructure/config/app.ts` por variável de ambiente:

```typescript
const gatewayClient = process.env.PAYMENT_GATEWAY === 'stripe'
  ? new StripeClient()
  : new InfinitePayClient();
```

4. Adicionar rota de webhook específica: `POST /api/v1/webhooks/stripe`

Gateways suportados no roadmap: Mercado Pago, Stripe, Asaas, Pagar.me.

---

## Segurança

- JWT em todos os endpoints autenticados
- Rate limiting: 100 req/min por IP
- Helmet (headers de segurança)
- CORS configurável
- Validação HMAC-SHA256 nos webhooks
- Validação de entrada com Zod em todos os endpoints

---

## Observabilidade

Logs estruturados via Pino:
```json
{
  "level": "info",
  "time": "2026-01-01T12:00:00.000Z",
  "req": { "method": "POST", "url": "/api/v1/checkouts" },
  "res": { "statusCode": 201 },
  "responseTime": 142
}
```
