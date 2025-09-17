# NexusVite - Distributed Apps Platform Architecture Plan

## Executive Summary
NexusVite is a distributed SaaS platform following Shopify/Saleor.io architecture pattern where each app is a completely standalone application with its own repository, deployment, and infrastructure. The Core App acts as the central hub that discovers, authenticates, and orchestrates these distributed apps through manifest files and OAuth-based app installations.

## 1. System Architecture Overview

### 1.1 Core Platform Stack
- **Core Framework**: Next.js 15.5.3+ (App Router with Turbopack)
- **UI Components**: Shadcn/UI v3.3.1+ with Radix UI
- **Authentication**: Better Auth (OAuth 2.0 Provider & SSO Hub)
- **Database**: PostgreSQL 17.x (Core DB only)
- **App Communication**: REST APIs + Webhooks + GraphQL Federation
- **App Discovery**: Manifest-based registration (like Shopify/Saleor)
- **Package Manager**: pnpm 9.x

### 1.2 Distributed Architecture Pattern

```
┌────────────────────────────────────────────────────────────┐
│                      Public App Store                        │
│                  (Browse & Install Apps)                     │
└────────────────────────────────────────────────────────────┘
                              │
┌────────────────────────────────────────────────────────────┐
│                   NexusVite Core Platform                    │
│                  ┌───────────────────────┐                  │
│                  │    App Registry DB     │                  │
│                  │  (Manifest Storage)    │                  │
│                  └───────────────────────┘                  │
│                              │                               │
│   ┌──────────────────────────┴──────────────────────────┐  │
│   │                   Core Services                      │  │
│   │  • OAuth Provider  • Webhook Hub  • API Gateway     │  │
│   │  • SSO Service    • Event Bus    • Admin Dashboard  │  │
│   └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
    [External Repo]    [External Repo]   [External Repo]
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Analytics App  │ │  Billing App     │ │   Custom CRM     │
│   -----------    │ │  ------------    │ │   -----------    │
│ • Own Database   │ │ • Stripe/Paddle  │ │ • Customer DB    │
│ • Own Backend    │ │ • Own Database   │ │ • Own API        │
│ • Own Frontend   │ │ • Subscription   │ │ • React/Vue/etc  │
│ • OAuth Client   │ │ • OAuth Client   │ │ • OAuth Client   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
     Deployed at:        Deployed at:        Deployed at:
 analytics.app.com    billing.app.com     crm.customer.com
```

## 2. Repository Structure

### 2.1 Core Platform Repository (nexusvite-core)

```
nexusvite-core/                        # Main Platform Repository
├── .claude/
│   └── core/
│       ├── architecture-plan.md
│       └── manifest-schema.md
│
├── src/
│   └── core/                          # Core Platform Only
│       ├── app/
│       │   ├── (public)/
│       │   │   ├── apps/              # App Store
│       │   │   │   ├── page.tsx       # Browse apps
│       │   │   │   └── [id]/          # App details
│       │   │   ├── developers/        # Developer Portal
│       │   │   └── docs/              # API Documentation
│       │   │
│       │   ├── (auth)/
│       │   │   ├── login/
│       │   │   ├── register/
│       │   │   ├── oauth/
│       │   │   │   ├── authorize/     # OAuth authorization
│       │   │   │   ├── token/         # Token endpoint
│       │   │   │   └── callback/      # OAuth callbacks
│       │   │   └── sso/
│       │   │
│       │   ├── (dashboard)/
│       │   │   ├── overview/
│       │   │   ├── installed-apps/    # Manage installed apps
│       │   │   ├── users/
│       │   │   ├── organizations/
│       │   │   ├── settings/
│       │   │   ├── api-keys/
│       │   │   └── webhooks/
│       │   │
│       │   ├── api/
│       │   │   ├── v1/
│       │   │   │   ├── apps/
│       │   │   │   │   ├── install/   # App installation
│       │   │   │   │   ├── uninstall/ # App removal
│       │   │   │   │   ├── manifest/  # Manifest validation
│       │   │   │   │   └── webhook/   # App webhooks
│       │   │   │   ├── auth/[...all]/ # Better Auth
│       │   │   │   ├── oauth/         # OAuth 2.0 endpoints
│       │   │   │   ├── graphql/       # GraphQL endpoint
│       │   │   │   └── rest/          # REST endpoints
│       │   │   └── webhooks/          # Webhook receivers
│       │   │
│       │   └── app-frame/              # IFrame container for apps
│       │       └── [appId]/
│       │
│       ├── components/
│       ├── lib/
│       │   ├── auth/                  # OAuth provider setup
│       │   ├── apps/                  # App management logic
│       │   ├── manifest/              # Manifest parser
│       │   └── webhooks/              # Webhook dispatcher
│       ├── database/
│       │   ├── schema.sql
│       │   └── migrations/
│       └── types/
│
├── docker-compose.yml                 # Core services only
├── next.config.mjs
├── package.json
└── README.md
```

### 2.2 Standalone App Repositories (Separate Git Repos)

```
# Example: Analytics App Repository (nexusvite-app-analytics)
nexusvite-app-analytics/
├── manifest.json                      # App manifest file
├── src/
│   ├── app/                          # Next.js or any framework
│   ├── api/
│   ├── components/
│   └── lib/
│       └── nexusvite/                # NexusVite SDK
├── database/                         # Own database
├── docker-compose.yml                # Own infrastructure
├── package.json
└── README.md

# Example: Billing App Repository (nexusvite-app-billing)
nexusvite-app-billing/
├── manifest.json
├── src/
│   ├── pages/                       # Can use any framework
│   ├── api/
│   └── lib/
│       └── nexusvite-sdk/
├── database/
├── package.json
└── README.md

# Example: Custom CRM App (customer-crm-app)
customer-crm-app/
├── manifest.json
├── src/                             # Any tech stack (Vue, Angular, etc)
├── backend/                         # Any backend (Node, Python, Go, etc)
├── database/                        # Any database
└── deployment/
```

## 3. App Manifest Specification

### 3.1 Manifest Structure (manifest.json)

```json
{
  "id": "com.example.analytics",
  "name": "Advanced Analytics",
  "version": "2.1.0",
  "description": "Comprehensive analytics and reporting for your platform",
  "author": {
    "name": "Analytics Corp",
    "email": "support@analytics.com",
    "website": "https://analytics.com"
  },
  "category": "analytics",
  "type": "standard",
  "pricing": {
    "model": "subscription",
    "plans": [
      {
        "name": "basic",
        "price": 29.99,
        "currency": "USD",
        "interval": "monthly"
      },
      {
        "name": "pro",
        "price": 99.99,
        "currency": "USD",
        "interval": "monthly"
      }
    ]
  },
  "urls": {
    "app": "https://analytics.example.com",
    "setup": "https://analytics.example.com/setup",
    "admin": "https://analytics.example.com/admin",
    "documentation": "https://docs.analytics.example.com",
    "support": "https://support.analytics.example.com"
  },
  "authentication": {
    "type": "oauth2",
    "scopes": [
      "read:users",
      "read:organizations",
      "write:analytics",
      "read:billing"
    ],
    "callback_url": "https://analytics.example.com/auth/callback"
  },
  "webhooks": {
    "endpoint": "https://analytics.example.com/webhooks",
    "events": [
      "user.created",
      "user.deleted",
      "organization.created",
      "organization.updated",
      "app.installed",
      "app.uninstalled"
    ],
    "secret_header": "X-Webhook-Secret"
  },
  "permissions": {
    "required": [
      "users:read",
      "organizations:read"
    ],
    "optional": [
      "billing:read",
      "api_keys:manage"
    ]
  },
  "embedding": {
    "type": "iframe",
    "locations": [
      {
        "id": "dashboard.analytics",
        "label": "Analytics",
        "icon": "chart-bar",
        "path": "/dashboard/analytics"
      },
      {
        "id": "settings.analytics",
        "label": "Analytics Settings",
        "path": "/settings/analytics"
      }
    ],
    "height": "100%",
    "sandbox": [
      "allow-forms",
      "allow-scripts",
      "allow-same-origin"
    ]
  },
  "api": {
    "graphql": {
      "endpoint": "https://api.analytics.example.com/graphql",
      "schema_url": "https://api.analytics.example.com/schema.graphql"
    },
    "rest": {
      "base_url": "https://api.analytics.example.com/v1",
      "openapi_spec": "https://api.analytics.example.com/openapi.json"
    }
  },
  "requirements": {
    "nexusvite_version": ">=1.0.0",
    "features": [
      "webhooks",
      "oauth2",
      "graphql_federation"
    ]
  },
  "health_check": {
    "endpoint": "https://analytics.example.com/health",
    "interval": 60,
    "timeout": 10
  },
  "metadata": {
    "screenshots": [
      "https://cdn.example.com/screenshot1.png",
      "https://cdn.example.com/screenshot2.png"
    ],
    "video_url": "https://youtube.com/watch?v=xxx",
    "tags": ["analytics", "reporting", "dashboards", "metrics"],
    "license": "MIT",
    "privacy_policy": "https://analytics.example.com/privacy",
    "terms_of_service": "https://analytics.example.com/terms"
  }
}
```

## 4. Core Platform Database Schema

### 4.1 Core Tables (PostgreSQL 17.x)

```sql
-- Core platform database only stores app registry and user data
-- Each app maintains its own separate database

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) DEFAULT 'client',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  password_hash VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registered Apps (App Store)
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id VARCHAR(255) UNIQUE NOT NULL, -- From manifest
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  manifest JSONB NOT NULL, -- Full manifest data
  status VARCHAR(50) DEFAULT 'pending_review',
  developer_id UUID REFERENCES users(id),
  category VARCHAR(100),
  type VARCHAR(50), -- standard, user, custom
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  last_health_check TIMESTAMPTZ,
  health_status VARCHAR(50) DEFAULT 'unknown'
);

-- App Installations (Per Organization)
CREATE TABLE app_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  installed_by UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  access_token TEXT, -- OAuth token for app
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  permissions JSONB DEFAULT '[]',
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(app_id, organization_id)
);

-- OAuth Clients (For Apps)
CREATE TABLE oauth_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  client_id VARCHAR(255) UNIQUE NOT NULL,
  client_secret_hash VARCHAR(255) NOT NULL,
  redirect_uris TEXT[] NOT NULL,
  allowed_scopes TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth Authorization Codes
CREATE TABLE oauth_authorization_codes (
  code VARCHAR(255) PRIMARY KEY,
  client_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  scopes TEXT[],
  redirect_uri TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth Access Tokens
CREATE TABLE oauth_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  scopes TEXT[],
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Subscriptions
CREATE TABLE webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_installation_id UUID REFERENCES app_installations(id) ON DELETE CASCADE,
  events TEXT[] NOT NULL,
  endpoint_url TEXT NOT NULL,
  secret VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Delivery Logs
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_type VARCHAR(100),
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0
);

-- API Keys (For direct API access)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255),
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  permissions JSONB DEFAULT '[]',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App Reviews & Ratings
CREATE TABLE app_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 5. OAuth 2.0 Flow for Apps

### 5.1 App Installation Flow

```
1. User browses App Store in NexusVite Core
2. User clicks "Install App"
3. Core redirects to OAuth authorization:
   → GET /oauth/authorize?
       client_id=XXXX&
       redirect_uri=https://app.com/callback&
       scope=users:read,billing:write&
       state=XXXX

4. User approves permissions
5. Core redirects back to app with authorization code:
   → https://app.com/callback?code=XXXX&state=XXXX

6. App exchanges code for access token:
   → POST /oauth/token
     {
       "grant_type": "authorization_code",
       "code": "XXXX",
       "client_id": "XXXX",
       "client_secret": "XXXX"
     }

7. Core returns access & refresh tokens
8. App registers webhooks
9. Installation complete
```

### 5.2 API Authentication

```typescript
// Apps authenticate API requests using Bearer tokens
GET https://api.nexusvite.com/v1/users
Authorization: Bearer <access_token>

// Or using API Keys for server-to-server
GET https://api.nexusvite.com/v1/organizations
X-API-Key: <api_key>
```

## 6. Core Platform API

### 6.1 REST API Endpoints

```yaml
# App Management
GET    /api/v1/apps                    # List available apps
GET    /api/v1/apps/{id}              # Get app details
POST   /api/v1/apps                    # Submit new app (developers)
PUT    /api/v1/apps/{id}              # Update app
DELETE /api/v1/apps/{id}              # Remove app

# App Installation
GET    /api/v1/installations          # List installed apps
POST   /api/v1/installations          # Install an app
DELETE /api/v1/installations/{id}     # Uninstall app
PUT    /api/v1/installations/{id}     # Update app settings

# OAuth Endpoints
GET    /oauth/authorize               # Authorization endpoint
POST   /oauth/token                   # Token endpoint
POST   /oauth/revoke                  # Revoke tokens
GET    /oauth/userinfo                # User information

# Webhooks
POST   /api/v1/webhooks/subscribe     # Subscribe to events
DELETE /api/v1/webhooks/{id}          # Unsubscribe
GET    /api/v1/webhooks/events        # List available events

# Core Resources (accessible to apps)
GET    /api/v1/users                  # List users
GET    /api/v1/users/{id}            # Get user
GET    /api/v1/organizations         # List organizations
GET    /api/v1/organizations/{id}    # Get organization
```

### 6.2 GraphQL Federation

```graphql
# Core Platform Schema (Federated)
type User @key(fields: "id") {
  id: ID!
  email: String!
  name: String
  organization: Organization
}

type Organization @key(fields: "id") {
  id: ID!
  name: String!
  slug: String!
  users: [User!]!
  installedApps: [AppInstallation!]!
}

type App @key(fields: "id") {
  id: ID!
  appId: String!
  name: String!
  version: String!
  category: String!
  installations: [AppInstallation!]!
}

# Apps can extend these types in their schemas
extend type User @key(fields: "id") {
  id: ID! @external
  analyticsProfile: AnalyticsProfile # Added by Analytics App
}
```

## 7. Webhook System

### 7.1 Core Events

```typescript
// Events emitted by Core Platform
interface WebhookEvents {
  // User events
  'user.created': UserPayload
  'user.updated': UserPayload
  'user.deleted': { id: string }

  // Organization events
  'organization.created': OrgPayload
  'organization.updated': OrgPayload
  'organization.deleted': { id: string }

  // App events
  'app.installed': InstallationPayload
  'app.uninstalled': { appId: string, orgId: string }
  'app.settings_updated': SettingsPayload

  // Billing events
  'subscription.created': SubscriptionPayload
  'subscription.updated': SubscriptionPayload
  'subscription.cancelled': SubscriptionPayload
}
```

### 7.2 Webhook Delivery

```typescript
// Webhook payload structure
{
  "id": "evt_1234567890",
  "type": "user.created",
  "created": 1234567890,
  "data": {
    // Event-specific data
  },
  "organization_id": "org_123",
  "app_id": "app_456"
}

// Webhook signature verification
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');

headers['X-Webhook-Signature'] = signature;
```

## 8. App Development SDK

### 8.1 NexusVite SDK for Apps

```typescript
// @nexusvite/sdk package
import { NexusVite } from '@nexusvite/sdk';

const nexus = new NexusVite({
  clientId: process.env.NEXUS_CLIENT_ID,
  clientSecret: process.env.NEXUS_CLIENT_SECRET,
  redirectUri: process.env.NEXUS_REDIRECT_URI,
});

// OAuth flow
const authUrl = nexus.auth.getAuthorizationUrl({
  scopes: ['users:read', 'billing:write'],
  state: 'random-state',
});

// Exchange code for token
const tokens = await nexus.auth.exchangeCode(code);

// API calls
const users = await nexus.users.list({
  organizationId: 'org_123',
});

// Webhook handling
nexus.webhooks.on('user.created', async (event) => {
  // Handle user creation
});

// GraphQL client
const result = await nexus.graphql({
  query: `
    query GetOrganization($id: ID!) {
      organization(id: $id) {
        name
        users {
          email
        }
      }
    }
  `,
  variables: { id: 'org_123' },
});
```

## 9. App Embedding & UI Integration

### 9.1 IFrame Embedding

```typescript
// Core platform renders apps in iframes
<iframe
  src={`${app.url}?token=${sessionToken}&org=${orgId}`}
  sandbox="allow-scripts allow-forms allow-same-origin"
  style={{ width: '100%', height: '100%' }}
/>

// Apps receive context via postMessage
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://nexusvite.com') return;

  const { type, data } = event.data;

  switch (type) {
    case 'context':
      // Update app with user/org context
      break;
    case 'theme':
      // Apply theme changes
      break;
  }
});
```

### 9.2 App Bridge for Communication

```typescript
// App-side bridge
import { createAppBridge } from '@nexusvite/app-bridge';

const app = createAppBridge({
  apiKey: process.env.NEXUS_API_KEY,
});

// Navigation
app.navigate('/users/123');

// Modals
app.modal.open({
  title: 'User Details',
  url: '/users/123',
});

// Notifications
app.toast.show({
  message: 'Settings saved',
  type: 'success',
});

// Context
const context = await app.getContext();
// { user, organization, permissions, theme }
```

## 10. Development Workflow

### 10.1 Core Platform Development

```bash
# Clone core repository
git clone https://github.com/nexusvite/core.git
cd nexusvite-core

# Install dependencies
pnpm install

# Setup PostgreSQL 17
docker-compose up -d postgres

# Run migrations
pnpm db:migrate

# Start development server
pnpm dev

# Access at http://localhost:3000
```

### 10.2 App Development

```bash
# Create new app from template
npx create-nexusvite-app my-app
cd my-app

# Configure manifest.json
{
  "id": "com.mycompany.myapp",
  "name": "My App",
  ...
}

# Install SDK
pnpm add @nexusvite/sdk

# Develop locally
pnpm dev

# Test with Core Platform
# 1. Register app in Core Platform developer portal
# 2. Get OAuth credentials
# 3. Configure .env
# 4. Test OAuth flow

# Deploy to your infrastructure
pnpm build
docker build -t my-app .
docker push my-registry/my-app

# Submit to App Store
nexus-cli app submit
```

## 11. App Categories & Types

### 11.1 Standard Apps (Enhance Core)
- **Analytics & Reporting**: Metrics, dashboards, insights
- **Communication**: Email, SMS, notifications
- **Security**: 2FA, audit logs, compliance
- **Developer Tools**: CI/CD, monitoring, logging
- **Workflow**: Automation, approval flows
- **Data Management**: Import/export, backup

### 11.2 User Apps (End-User Features)
- **E-commerce**: Shopping cart, checkout
- **Content**: CMS, blog, documentation
- **Community**: Forums, chat, social
- **Learning**: Courses, tutorials, certifications
- **Productivity**: Calendar, tasks, notes

### 11.3 Custom Apps (Client-Specific)
- **Industry-Specific**: Healthcare, finance, education
- **Integrations**: CRM, ERP, third-party services
- **White-Label**: Branded solutions
- **Legacy**: Migration tools, compatibility layers

## 12. Security Model

### 12.1 App Isolation
- Each app runs on separate infrastructure
- Apps cannot access other apps' data
- Communication only through Core Platform APIs
- OAuth tokens scoped per organization

### 12.2 Permission System
```typescript
// Granular permissions
const permissions = {
  'users:read': 'View user information',
  'users:write': 'Modify user data',
  'billing:read': 'View billing information',
  'billing:write': 'Manage subscriptions',
  'api_keys:manage': 'Create/delete API keys',
  'webhooks:manage': 'Configure webhooks',
  'apps:install': 'Install new apps',
  'apps:uninstall': 'Remove apps',
};
```

### 12.3 Security Requirements
- HTTPS required for all apps
- Webhook signature verification
- OAuth 2.0 with PKCE
- Rate limiting on all endpoints
- Regular security audits for published apps

## 13. Monetization

### 13.1 App Pricing Models
- **Free**: Basic features, limited usage
- **Freemium**: Free tier + paid upgrades
- **Subscription**: Monthly/yearly billing
- **Usage-Based**: Pay per API call/resource
- **One-Time**: Single purchase
- **Enterprise**: Custom pricing

### 13.2 Revenue Sharing
- Platform fee: 20% of app revenue
- Payment processing: Via platform (Stripe/Paddle)
- Payout schedule: Monthly
- Tax handling: Per jurisdiction

## 14. Implementation Roadmap

### Phase 1: Core Platform Foundation (Week 1-2)
- [ ] Setup Next.js 15.5.3 project structure
- [ ] Configure PostgreSQL 17 database
- [ ] Implement Better Auth as OAuth provider
- [ ] Create admin dashboard with Shadcn/UI
- [ ] Build app registry database schema

### Phase 2: OAuth & API Gateway (Week 3-4)
- [ ] Implement OAuth 2.0 server
- [ ] Create API endpoints for apps
- [ ] Build webhook system
- [ ] Implement rate limiting
- [ ] Create API documentation

### Phase 3: App Store & Developer Portal (Week 5-6)
- [ ] Build app store UI
- [ ] Create developer registration
- [ ] Implement manifest parser
- [ ] Build app submission flow
- [ ] Create app review system

### Phase 4: App Installation & Management (Week 7-8)
- [ ] Build installation flow
- [ ] Implement permission management
- [ ] Create app settings UI
- [ ] Build uninstall process
- [ ] Implement health checks

### Phase 5: SDK & Developer Tools (Week 9-10)
- [ ] Create @nexusvite/sdk package
- [ ] Build CLI tools
- [ ] Create app templates
- [ ] Write developer documentation
- [ ] Build example apps

### Phase 6: Production Features (Week 11-12)
- [ ] Implement billing system
- [ ] Add monitoring/analytics
- [ ] Security hardening
- [ ] Performance optimization
- [ ] Launch preparation

## 15. Example App Implementations

### 15.1 Analytics App (Separate Repository)
```
Repository: https://github.com/analytics-corp/nexusvite-analytics
Tech Stack: Next.js + PostgreSQL + Redis
Deployment: Vercel/AWS
Features:
- Real-time dashboards
- Custom reports
- Data export
- Scheduled reports
```

### 15.2 Billing App (Separate Repository)
```
Repository: https://github.com/billing-solutions/nexusvite-billing
Tech Stack: Node.js + Express + MongoDB
Deployment: Google Cloud
Features:
- Stripe/Paddle integration
- Invoice generation
- Subscription management
- Usage tracking
```

### 15.3 CRM App (Customer Repository)
```
Repository: Private customer repository
Tech Stack: Vue.js + Python/Django + PostgreSQL
Deployment: On-premise/Private cloud
Features:
- Contact management
- Deal pipeline
- Email integration
- Custom fields
```

## Next Steps

1. **Review this distributed architecture plan**
2. **Confirm the app marketplace approach**
3. Once approved, I will:
   - Initialize the Core Platform in `/src/core`
   - Create manifest schema specification
   - Build OAuth 2.0 provider
   - Implement app registry
   - Create developer portal

**Note**: This architecture ensures:
- Each app is completely independent
- Apps can use any technology stack
- Apps can be in separate repositories
- Apps are discovered via manifest files
- Similar to Shopify Apps or Saleor.io plugins
- Core platform only orchestrates, doesn't host apps