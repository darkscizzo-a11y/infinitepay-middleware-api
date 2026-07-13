# Omar Profissional

Sistema completo de gerenciamento para barbearia com agendamento online, pagamentos, WhatsApp integrado e painel administrativo.

**Versão:** 3.1.9 | **Node.js:** 22 | **Licença:** Privado

---

## Visão Geral

O Omar Profissional é um monorepo que integra três serviços:

┌─────────────────────────────────────────────────────────┐
│                      Omar Profissional                   │
├───────────────────┬─────────────────┬───────────────────┤
│     apps/web      │     apps/api    │  apps/pocketbase  │
│    Frontend       │    Backend      │   BaaS / Database │
│  React 18 + Vite  │   Express 5     │    PocketBase     │
│   Porta :3000     │   Porta :3001   │    Porta :8090    │
└───────────────────┴─────────────────┴───────────────────┘

---

## Funcionalidades

### Para o Cliente (Público)
- **Agendamento Online** — Modal de booking com seleção de serviço, profissional, data e horário disponível
- **Página Institucional** — Hero, serviços, produtos, informações de contato e localização

### Para o Administrador (Painel)
- **Dashboard** — KPIs (agendas do dia, receita, pedidos, barbeiros), agenda do dia, pedidos recentes
- **Agendamentos** — Lista e gerenciamento de todos os agendamentos
- **Calendário** — Visualização em calendário dos agendamentos
- **Serviços** — CRUD de serviços (nome, preço, duração, status)
- **Barbeiros** — CRUD de profissionais
- **Produtos** — Gerenciamento de produtos da loja
- **Pedidos** — Controle de pedidos de produtos
- **WhatsApp** — Conexão via QR code, envio manual de mensagens
- **Financeiro** — Dashboard financeiro, geração de cobranças
- **Transações** — Histórico de pagamentos (PIX, cartão, link)
- **Configurações de Pagamento** — Credenciais InfinityPay, sandbox/produção
- **Usuários** — Gestão de usuários do sistema (admin/user)
- **Configurações** — Configurações gerais da barbearia

### Integrações
- **WhatsApp (Baileys)** — Conexão direta via QR code, notificações automáticas de agendamento
- **InfinityPay** — Pagamentos via PIX, cartão de crédito e link de pagamento
- **Email (PocketBase)** — Envio automático de confirmação de agendamento

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) 22+
- npm (vem com o Node.js)
- Conta [InfinityPay](https://infinitypay.io) (para pagamentos)
- Acesso ao [Hostinger](https://hostinger.com) Horizons (para deploy)

---

## Instalação

### 1. Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd "Omar Profissional versão final/Omar Profissional versão final"
2. Instalar dependências
npm install
3. Configurar variáveis de ambiente
Copie e configure o arquivo apps/api/.env:
cd apps/api
cp .env .env.local
Edite apps/api/.env:
PORT=3001
CORS_ORIGIN=*

# Twilio (opcional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# InfinityPay
INFINITYPAY_API_KEY=
INFINITYPAY_API_SECRET=
INFINITYPAY_ENVIRONMENT=sandbox
INFINITYPAY_WEBHOOK_SECRET=
4. Iniciar em desenvolvimento
Na raiz do projeto:
npm run dev
Isso inicia simultaneamente:
- Frontend → http://localhost:3000
- API → http://localhost:3001
- PocketBase → http://localhost:8090
Variáveis de Ambiente
apps/api/.env
Variável	Descrição
PORT	Porta do servidor API (padrão: 3001)
CORS_ORIGIN	Origem permitida para CORS (use * para dev)
TWILIO_ACCOUNT_SID	SID da conta Twilio
TWILIO_AUTH_TOKEN	Token de autenticação Twilio
TWILIO_PHONE_NUMBER	Número de telefone Twilio
INFINITYPAY_API_KEY	Chave de API da InfinityPay
INFINITYPAY_API_SECRET	Segredo de API da InfinityPay
INFINITYPAY_ENVIRONMENT	sandbox ou production
INFINITYPAY_WEBHOOK_SECRET	Segredo para validação de webhooks
ENCRYPTION_KEY	Chave AES-256 para criptografia (auto-gerada se vazio)
*Obrigatório para funcionalidade de pagamentos.
Scripts Disponíveis
Raiz (monorepo)
Comando	Descrição
npm run dev	Inicia todos os serviços em desenvolvimento
npm run build	Build do frontend
npm run start	Inicia API e PocketBase em produção
npm run lint	Lint em todos os apps
apps/web
Comando	Descrição
npm run dev	Vite dev server (porta 3000)
npm run build	Build de produção
npm run lint	ESLint
apps/api
Comando	Descrição
npm run dev	Servidor API com watch
npm run start	Servidor API em produção
npm run lint	ESLint
apps/pocketbase
Comando	Descrição
npm run dev	PocketBase serve (porta 8090)
npm run start	PocketBase em produção
npm run migrations:up	Rodar migrações
npm run migrations:revert	Reverter última migração
npm run migrations:snapshot	Criar snapshot do schema
Estrutura de Pastas
├── apps/
│   ├── web/                          # Frontend React
│   │   ├── src/
│   │   │   ├── components/           # Componentes React
│   │   │   │   ├── ui/               # 55 componentes shadcn/ui
│   │   │   │   ├── AdminLayout.jsx   # Layout do painel admin
│   │   │   │   ├── BookingModal.jsx  # Modal de agendamento
│   │   │   │   ├── WhatsAppConnect.jsx
│   │   │   │   └── ...
│   │   │   ├── contexts/             # AuthContext, ThemeContext
│   │   │   ├── hooks/                # Hooks customizados
│   │   │   ├── lib/                  # Clients (PocketBase, API)
│   │   │   ├── pages/                # 14 páginas
│   │   │   ├── App.jsx               # Router principal
│   │   │   └── main.jsx              # Entry point
│   │   ├── plugins/                  # Plugins Vite (editor visual)
│   │   ├── tools/                    # Scripts utilitários
│   │   ├── vite.config.js            # Configuração Vite
│   │   └── package.json
│   │
│   ├── api/                          # Backend Express
│   │   ├── src/
│   │   │   ├── constants/            # Constantes (body limit, env)
│   │   │   ├── middleware/           # Error, rate-limit, requireAdmin
│   │   │   ├── routes/               # Rotas da API
│   │   │   │   ├── appointments.js   # Agendamentos
│   │   │   │   ├── whatsapp.js       # WhatsApp (connect, send)
│   │   │   │   ├── infinitypay.js    # Pagamentos
│   │   │   │   ├── webhooks.js       # Webhooks InfinityPay
│   │   │   │   ├── users.js          # Gestão de usuários
│   │   │   │   ├── twilio.js         # Twilio SMS/Voice
│   │   │   │   └── health-check.js   # Health check
│   │   │   ├── services/
│   │   │   │   └── whatsappService.js # Lógica WhatsApp (Baileys)
│   │   │   ├── utils/                # Encryption, logger, clients
│   │   │   └── main.js               # Entry point Express
│   │   ├── sessions/                 # Dados de sessão WhatsApp
│   │   └── .env                      # Variáveis de ambiente
│   │
│   └── pocketbase/                   # PocketBase (BaaS)
│       ├── pb_hooks/                 # Hooks server-side
│       │   ├── appointment-email-notification.pb.js
│       │   ├── appointment-whatsapp-notification.pb.js
│       │   ├── builder-mailer.pb.js
│       │   ├── external-dashboard.pb.js
│       │   └── custom-migrations-cmd.pb.js
│       ├── pb_migrations/            # 27 migrações
│       ├── pb_data/                  # Dados do banco (SQLite)
│       └── pocketbase                # Binário do PocketBase
│
├── package.json                      # Configuração monorepo
├── .nvmrc                            # Node.js 22
└── .version                          # 49
API — Endpoints
Agendamentos
Método	Rota	Descrição
GET	/appointments/range?startDate=&endDate=	Buscar agendamentos por período
WhatsApp
Método	Rota	Descrição
POST	/whatsapp/connect	Iniciar conexão, retorna QR code
GET	/whatsapp/qr	Obter QR code atual (polling)
GET	/whatsapp/status	Status da conexão
POST	/whatsapp/disconnect	Desconectar e limpar sessão
POST	/whatsapp/send-message	Enviar mensagem (phoneNumber, message)
InfinityPay (pagamentos)
Método	Rota	Descrição
POST	/infinitypay/config	Salvar credenciais
GET	/infinitypay/config	Obter config (mascarada)
POST	/infinitypay/test-connection	Testar conexão
POST	/infinitypay/charge/pix	Criar cobrança PIX
POST	/infinitypay/charge/card	Criar cobrança cartão
POST	/infinitypay/charge/link	Criar link de pagamento
GET	/infinitypay/transactions	Listar transações (filtros)
GET	/infinitypay/transaction/:id	Detalhes da transação
PUT	/infinitypay/transaction/:id/cancel	Cancelar transação
PUT	/infinitypay/transaction/:id/refund	Reembolsar transação
Webhooks
Método	Rota	Descrição
POST	/webhooks/infinitypay	Receber notificações InfinityPay
Usuários
Método	Rota	Descrição	Acesso
GET	/users/me	Dados do usuário logado	Auth
GET	/users	Listar todos os usuários	Admin
POST	/users/create	Criar usuário	Admin
PUT	/users/:id	Atualizar usuário	Admin
PUT	/users/:id/status	Ativar/desativar usuário	Admin
DELETE	/users/:id	Excluir usuário	Admin
Health Check
Método	Rota	Descrição
GET	/health	Status do servidor
Collections (PocketBase)
Collection	Descrição
users	Usuários do sistema (admin/user)
appointments	Agendamentos
services	Serviços oferecidos
barbers	Barbeiros/profissionais
products	Produtos da loja
orders	Pedidos de produtos
storeSettings	Configurações da loja (horários, dias)
infinitypay_config	Credenciais InfinityPay (criptografadas)
infinitypay_transactions	Transações de pagamento
infinitypay_webhooks	Webhooks recebidos
Deploy
O projeto é hospedado no Hostinger Horizons:
- PocketBase — Serve binário com hooks e migrações
- Frontend — Build estático servido via Hostinger
- API — Servidor Node.js com Express
Fluxo de Deploy
1. PocketBase hooks (external-dashboard.pb.js) redirecionam a raiz para o dashboard do PocketBase
2. Frontend é servido como estático
3. API rota em /hcgi/api/*
4. PocketBase rota em /hcgi/platform/*
Segurança
- Criptografia AES-256-CBC — Credenciais InfinityPay criptografadas no banco
- Rate Limiting — Limitação global de requisições + rate limit específico para webhooks
- Helmet — Headers de segurança HTTP
- CORS — Configurável por ambiente
- Autenticação PocketBase — JWT-based com roles (admin/user)
- Middleware requireAdmin — Proteção de rotas administrativas
- Body Limit — Limite de 20MB para payloads
Tecnologias
Camada	Tecnologias
Frontend	React 18, Vite 7, Tailwind CSS 3, shadcn/ui, Radix UI, Framer Motion, TanStack Query, React Router 7, Zod, React Hook Form
Backend	Express 5, Node.js 22, Pino (logger), Helmet, Morgan, CORS
WhatsApp	@whiskeysockets/baileys, QRCode
Pagamentos	InfinityPay API (PIX, cartão, link)
Banco de Dados	PocketBase (SQLite embutido)
Utilitários	date-fns, Recharts, Sonner (toasts)
Contato
Omar Profissional
- Endereço: QNB 13, Taguatinga Norte, DF
- Telefone: (61) 99462-7541
- Email: contato@omarprofissional.com
- Horário: Terça a Domingo 14h-00h | Sábado 13h-22h | Segunda: Fechado
