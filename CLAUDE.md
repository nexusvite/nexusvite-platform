# Claude Memory File - NexusVite Platform

This file contains important context and information for Claude to remember about the NexusVite Platform project.

## Project Overview

NexusVite Platform is a comprehensive workflow automation and distributed apps platform built with:
- Next.js 15.5.3+ with App Router
- React 19.x and TypeScript
- PostgreSQL with Drizzle ORM
- Better Auth for authentication
- React Flow for workflow visualization
- Tailwind CSS for styling

## Key Architecture Decisions

### Authentication
- Using Better Auth with Argon2 password hashing
- Passwords stored in `account` table, not `user` table
- OAuth providers: Google and GitHub
- Session-based authentication with 7-day expiry

### Database Schema
- Users: `user` table for basic info, `account` table for auth methods
- Workflows: `workflows`, `workflow_nodes`, `workflow_connections` tables
- Executions: `workflow_executions` table with snake_case columns
- Using Drizzle ORM with PostgreSQL

### Workflow System
- Visual workflow builder using React Flow
- Multiple trigger types: manual, schedule, webhook, event
- Rich action nodes: HTTP, Database, Email, Slack, etc.
- Client-side execution engine in `/src/core/workflow/execution-engine.ts`
- Workbench for monitoring executions at `/workbench`

## Common Issues & Solutions

### Issue: Login Authentication Fails
**Problem**: Direct database insertion of users doesn't work with Better Auth
**Solution**:
1. Use Argon2 for password hashing
2. Insert into both `user` and `account` tables
3. Set `providerId: 'credential'` in account table
4. Or use Better Auth API endpoints for user creation

### Issue: Workflow Executions Not Persisting
**Problem**: Executions happen client-side but don't save to database
**Solution**: The execution engine needs to call API endpoints to persist execution data

### Issue: Database Schema Mismatch
**Problem**: Table has snake_case columns but ORM expects camelCase
**Solution**: Drizzle schema correctly maps (e.g., `startTime` ’ `start_time`)

## Important Files & Scripts

### Database Scripts
- `/scripts/seed-database.ts` - Complete database reset and seed with sample data
- `/scripts/verify-users.ts` - Check users in database
- `/scripts/create-test-executions.ts` - Create sample workflow executions
- `/scripts/trigger-workflow.ts` - Create workflow and executions for testing

### Configuration Files
- `/src/core/auth/config.ts` - Better Auth configuration
- `/src/core/database/index.ts` - Database connection
- `/drizzle.config.ts` - Drizzle ORM configuration

### Key Components
- `/src/components/workflow/` - Workflow editor components
- `/src/components/workbench/` - Execution monitoring components
- `/src/app/(dashboard)/developer/workflows/` - Workflow management UI
- `/src/app/(dashboard)/workbench/` - Execution monitoring UI

## Database Commands

```bash
# Start PostgreSQL with Docker
./scripts/db-start.sh

# Push schema to database
pnpm db:push

# Reset and seed database with sample data
DATABASE_URL="postgresql://dev_user:dev_password@localhost:5433/nexusvite_platform_dev" \
npx tsx scripts/seed-database.ts

# Verify users
DATABASE_URL="postgresql://dev_user:dev_password@localhost:5433/nexusvite_platform_dev" \
npx tsx scripts/verify-users.ts
```

## Default Test Credentials

**Admin User:**
- Email: admin@nexusvite.com
- Password: admin123

**Test Users:**
- john.doe@example.com / test123
- jane.smith@example.com / test123
- test@example.com / test123

## Seeded Workflows

1. **Email Marketing Automation** - Schedule-triggered email campaign workflow
2. **Data Processing Pipeline** - Webhook-triggered ETL pipeline
3. **Error Monitoring & Alerts** - Event-triggered monitoring with multi-channel alerts
4. **Simple Test Workflow** - Manual trigger for testing

## API Endpoints

### Authentication
- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - User login
- `GET /api/auth/session` - Get current session

### Workflows
- `GET /api/developer/workflows` - List workflows
- `POST /api/developer/workflows` - Create workflow
- `GET/PATCH/DELETE /api/developer/workflows/[id]` - Workflow operations
- `POST /api/developer/workflows/[id]/execute` - Execute workflow
- `POST /api/developer/workflows/proxy` - Proxy for HTTP actions

### Workbench
- `GET /api/workbench/executions` - List executions
- `GET /api/workbench/executions/[id]` - Get execution details
- `GET /api/workbench/executions/[id]/logs` - Get logs
- `WS /api/workbench/ws` - WebSocket for real-time updates

## Testing

```bash
# Run tests in headed mode
npx playwright test --headed

# Specific test files
npx playwright test tests/admin-login.spec.ts --headed
npx playwright test tests/workbench-with-auth.spec.ts --headed
```

## Development Workflow

1. **Start Database**: `./scripts/db-start.sh`
2. **Seed Data**: Run seed-database.ts script
3. **Start Dev Server**: `pnpm dev`
4. **Login**: Use admin@nexusvite.com / admin123
5. **Test Features**:
   - Create/edit workflows at /developer/workflows
   - Monitor executions at /workbench
   - Test API endpoints directly

## Recent Fixes

1. **Auth Import Error**: Fixed 25 files importing from '@/core/auth/config' instead of '@/core/auth'
2. **Created /src/core/auth/index.ts**: Exports auth and types from config
3. **Database Seeding**: Created comprehensive seed script with users, workflows, and executions
4. **Test Data**: Added scripts to create test workflow executions for workbench

## Known Limitations

1. **Password Authentication**: Better Auth password verification may not work with direct database insertion
2. **Workflow Execution**: Currently client-side only, needs server-side persistence
3. **Real-time Updates**: WebSocket connection for workbench needs implementation
4. **Email/Slack Actions**: Currently mock implementations, need actual integrations

## Next Steps

1. Implement server-side workflow execution engine
2. Add real-time WebSocket updates for workbench
3. Integrate actual email and Slack services
4. Add workflow versioning and rollback
5. Implement workflow templates marketplace

## Important Notes

- Always run `pnpm lint` and `pnpm typecheck` before commits
- Use the seed-database.ts script for fresh database setup
- Test with headed Playwright for visual debugging
- Check /workbench for execution monitoring
- Workflow definitions stored as JSON in database

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5433/nexusvite_platform_dev
BETTER_AUTH_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Useful Debugging

- Check browser console for workflow execution logs
- Use React DevTools for component state
- Database queries logged in terminal with `pnpm dev`
- Playwright test videos in `test-results/` folder
- Screenshots saved to `tests/screenshots/`