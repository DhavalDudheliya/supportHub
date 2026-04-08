# SupportHub

A modern, multi-tenant customer support platform that converts inbound emails into actionable tickets — automatically. Connect a Gmail or Outlook account with a single click and let SupportHub handle the rest: real-time notifications, intelligent thread detection, automatic customer identification, and a live dashboard for your support team.

## Features

- **Multi-Tenant Workspaces** — Isolated workspaces per organization with subdomain-based routing
- **Email-to-Ticket Pipeline** — Gmail & Outlook OAuth integration that silently converts inbound emails into support tickets
- **Real-Time Dashboard** — WebSocket-powered live updates; new tickets and replies appear instantly
- **Intelligent Threading** — Replies are automatically matched to existing tickets using RFC 2822 Message-ID headers
- **Background Job Processing** — BullMQ + Redis queue for reliable, fault-tolerant email processing
- **Role-Based Access Control** — Admin and Agent roles with scoped permissions
- **Team Management** — Invite agents via email with tokenized invitation links
- **Customer Management** — Automatic customer creation from inbound emails with full CRM views
- **Ticket Lifecycle** — Status tracking (Open → Pending → Solved → Closed), priority levels, tags, and assignment
- **Internal Notes & Comments** — Public replies and private internal notes on tickets
- **Token Auto-Refresh** — OAuth tokens are refreshed silently; users never need to reconnect
- **Watch/Subscription Renewal** — Automated cron jobs keep Gmail watches and Outlook subscriptions alive indefinitely

## Tech Stack

| Layer            | Technology                                                 |
| ---------------- | ---------------------------------------------------------- |
| **Frontend**     | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui           |
| **Backend**      | Express 5, TypeScript, Socket.IO                           |
| **Database**     | PostgreSQL, Prisma ORM (v7)                                |
| **Job Queue**    | BullMQ, Redis (via Docker)                                 |
| **Auth**         | JWT (access + refresh tokens), bcrypt                      |
| **Email**        | Gmail API (Google Pub/Sub), Microsoft Graph API (Webhooks) |
| **Validation**   | Zod (shared across frontend & backend)                     |
| **Monorepo**     | Turborepo, pnpm workspaces                                 |
| **Code Quality** | ESLint, Prettier, Husky, lint-staged                       |
| **Logging**      | Pino (with pino-pretty for dev)                            |

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 10.4
- **Docker** (for Redis)
- **PostgreSQL** database
- **Google Cloud** project (for Gmail integration) — [setup guide](./SETUP_EMAIL_SERVICES.md#1-google-cloud-gmail-api)
- **Microsoft Azure** app registration (for Outlook integration) — [setup guide](./SETUP_EMAIL_SERVICES.md#2-microsoft-azure-outlook--microsoft-graph)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/DhavalDudheliya/supportHub.git
cd supportHub
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start Redis

```bash
docker compose up -d
```

### 4. Configure environment variables

Create `apps/api/.env` with the following:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/supporthub"

# Auth
JWT_ACCESS_SECRET=<your-access-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>

# Encryption (for OAuth tokens at rest)
ENCRYPTION_KEY=<32-byte-hex-key>

# Gmail OAuth
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/email/gmail/callback
GOOGLE_PUBSUB_TOPIC=projects/<your-gcp-project>/topics/gmail-notifications

# Outlook OAuth
MICROSOFT_CLIENT_ID=<your-client-id>
MICROSOFT_CLIENT_SECRET=<your-client-secret>
MICROSOFT_REDIRECT_URI=http://localhost:5000/api/v1/email/outlook/callback
MICROSOFT_TENANT_ID=common

# App
PORT=5000
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379

# Email (for sending verification/invitation emails)
SMTP_HOST=<your-smtp-host>
SMTP_PORT=587
SMTP_USER=<your-smtp-user>
SMTP_PASS=<your-smtp-password>
```

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

> **Tip:** Generate a secure encryption key with:
>
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

For detailed OAuth setup instructions, see [**SETUP_EMAIL_SERVICES.md**](./SETUP_EMAIL_SERVICES.md).

### 5. Set up the database

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

### 6. Start the development servers

```bash
pnpm dev
```

This launches both apps simultaneously via Turborepo:

| App     | URL                   |
| ------- | --------------------- |
| **Web** | http://localhost:3000 |
| **API** | http://localhost:5000 |

You can also start them individually:

```bash
pnpm dev:web    # Frontend only
pnpm dev:api    # Backend only
```

## Available Scripts

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `pnpm dev`             | Start all apps in development mode               |
| `pnpm dev:web`         | Start frontend only                              |
| `pnpm dev:api`         | Start backend only                               |
| `pnpm build`           | Build all apps                                   |
| `pnpm lint`            | Run ESLint across all packages                   |
| `pnpm format`          | Format all files with Prettier                   |
| `pnpm prisma:generate` | Generate Prisma client                           |
| `pnpm prisma:migrate`  | Run database migrations                          |
| `pnpm prisma:studio`   | Open Prisma Studio (visual DB browser)           |
| `pnpm db:push`         | Push schema changes directly (no migration file) |

## Architecture Overview

```
┌─────────────┐     WebSocket      ┌──────────────────────────────────┐
│  Next.js    │◄───────────────────►│         Express API              │
│  Frontend   │     REST API       │                                  │
│  (React 19) │───────────────────►│  ┌──────────┐  ┌─────────────┐  │
└─────────────┘                    │  │  Modules  │  │  Socket.IO  │  │
                                   │  │  (CRUD)   │  │  (Live)     │  │
                                   │  └────┬──────┘  └──────┬──────┘  │
                                   │       │                │         │
                                   │  ┌────▼────────────────▼──────┐  │
                                   │  │        Prisma ORM          │  │
                                   │  └────────────┬───────────────┘  │
                                   │               │                  │
                                   └───────────────┼──────────────────┘
                                                   │
┌──────────────┐  Pub/Sub / Webhook │         ┌────▼─────┐
│  Gmail API   │───────────────────►│ Webhook  │PostgreSQL│
│  Graph API   │                    │ Handler  └──────────┘
└──────────────┘                    │    │
                                    │    ▼
                                    │ ┌──────┐    ┌────────────┐
                                    │ │BullMQ│───►│Email Worker │
                                    │ └──┬───┘    └────────────┘
                                    │    │
                                    │ ┌──▼──┐
                                    └─│Redis│
                                      └─────┘
```

## Email-to-Ticket Flow

1. **Connect** — User authenticates Gmail/Outlook via OAuth (one-click)
2. **Watch** — Backend registers a Gmail Pub/Sub watch or Outlook Graph subscription
3. **Notify** — Google/Microsoft pushes a lightweight notification to the webhook
4. **Queue** — Webhook acknowledges instantly and enqueues a BullMQ job
5. **Fetch** — Background worker retrieves the full email via Gmail/Graph API
6. **Deduplicate** — Message-ID is checked to prevent duplicate ticket creation
7. **Thread** — References headers are matched to existing tickets for reply detection
8. **Create** — A new ticket is created (or a reply is appended to an existing one)
9. **Notify** — WebSocket event is emitted to the live dashboard

## License

This project is private and not licensed for public use.
