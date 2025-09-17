# NexusVite Platform

A modern distributed apps platform built with Next.js 15.5.3+, React 19.x, TypeScript, and PostgreSQL. This platform provides OAuth 2.0 provider functionality, API gateway, and App Store capabilities for hosting standalone applications.

## Tech Stack

- **Framework:** Next.js 15.5.3+ with App Router and Turbopack
- **Frontend:** React 19.x, TypeScript (latest), Tailwind CSS 4.x
- **UI Components:** shadcn/ui 3.3.1+ with Radix UI primitives
- **Database:** PostgreSQL 17.x with Drizzle ORM
- **Authentication:** Better Auth with OAuth 2.0 providers
- **Package Manager:** pnpm

## Features

- 🔐 OAuth 2.0 provider with Google & GitHub integration
- 🏪 App Store for distributing applications
- 🚀 API Gateway for routing app requests
- 📱 Standalone app support with manifest files
- 🎨 Modern UI with dark/light theme support
- 🛡️ Type-safe database operations with Drizzle ORM
- ⚡ Performance optimized with Turbopack

## Project Structure

```
src/
├── core/                    # Core platform functionality
│   ├── auth/               # Authentication configuration
│   ├── api/                # API gateway and routes
│   ├── apps/               # App store, registry, and SDK
│   ├── database/           # Database schemas and migrations
│   ├── ui/                 # Core UI components and layouts
│   ├── types/              # TypeScript type definitions
│   ├── config/             # Application configuration
│   └── utils/              # Utility functions
├── components/             # shadcn/ui components
├── app/                    # Next.js app router pages
└── lib/                    # Utility libraries
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 17.x
- pnpm (recommended)

### Installation

1. **Clone and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your actual values.

3. **Set up PostgreSQL database:**
   ```bash
   # Create database
   createdb nexusvite_platform

   # Generate and run migrations
   pnpm db:generate
   pnpm db:push

   # Seed initial data
   pnpm db:seed
   ```

4. **Start development server:**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Commands

```bash
# Generate migrations from schema changes
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Run migrations
pnpm db:migrate

# Open Drizzle Studio
pnpm db:studio

# Seed database with initial data
pnpm db:seed
```

## Environment Variables

Key environment variables (see `.env.example` for complete list):

- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Secret key for authentication
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Google OAuth
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET` - GitHub OAuth

## Development

The platform is designed as a distributed apps ecosystem:

- **Core Platform:** Provides OAuth, API gateway, and App Store
- **Standalone Apps:** Independent applications with manifest files
- **API Gateway:** Routes and manages requests to apps
- **OAuth Provider:** Centralized authentication for all apps

## Architecture

This platform follows enterprise-grade architecture patterns:

- **Type Safety:** Full TypeScript coverage with strict mode
- **Database:** Drizzle ORM with PostgreSQL for reliability
- **Authentication:** Better Auth for modern OAuth flows
- **UI:** shadcn/ui for consistent, accessible components
- **Performance:** Turbopack for fast development builds

## Contributing

1. Follow the established patterns in `src/core/`
2. Use TypeScript strictly - no `any` types
3. Follow the component patterns from shadcn/ui
4. Write database schemas with proper relations
5. Test OAuth flows thoroughly

## Deployment

This platform is ready for production deployment on:

- **Vercel** (recommended for Next.js)
- **AWS** with RDS PostgreSQL
- **Google Cloud** with Cloud SQL
- **Docker** containers

Remember to:
- Set production environment variables
- Configure OAuth redirect URLs
- Set up SSL certificates
- Configure database connection pooling

## License

MIT License - see LICENSE file for details.
