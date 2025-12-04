# TixPeer Documentation

This directory contains all technical documentation for the TixPeer project.

## Documentation Index

| Document | Description | Audience |
|----------|-------------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, tech stack, data flows, database schema, API structure | All engineers |
| [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md) | Code patterns, best practices, when/why to use specific approaches | All engineers |
| [CACHING.md](./CACHING.md) | HTTP caching strategy, cache headers, future Redis plans | Backend engineers |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Deployment instructions, environment setup, production configuration | DevOps / Deployment |
| [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) | Comprehensive testing strategy, coverage goals, test types | All engineers |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Testing approach, test structure, running tests | All engineers |
| [DATABASE_SEEDING_STRATEGY.md](./DATABASE_SEEDING_STRATEGY.md) | Database seeding approach and strategy | Backend engineers |
| [SEEDING_IMPLEMENTATION_SUMMARY.md](./SEEDING_IMPLEMENTATION_SUMMARY.md) | Seeding implementation details and summary | Backend engineers |
| [EMAIL_SETUP.md](./EMAIL_SETUP.md) | Email service configuration (SendGrid) | DevOps / Email setup |
| [SENDGRID_DOMAIN_AUTHENTICATION.md](./SENDGRID_DOMAIN_AUTHENTICATION.md) | SendGrid domain authentication setup | DevOps / Email setup |

## Quick Start for New Engineers

1. **Start here:** Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the overall system
2. **Understand patterns:** Review [IMPLEMENTATION_PATTERNS.md](./IMPLEMENTATION_PATTERNS.md) to learn our coding conventions
3. **Set up environment:** Follow the main [README.md](../README.md) for local development setup

## Document Purposes

### ARCHITECTURE.md
- High-level system overview
- Technology choices and rationale
- Database schema and relationships
- API endpoint reference
- Data flow diagrams

### IMPLEMENTATION_PATTERNS.md
- Frontend patterns (React Context, Optimistic Updates, etc.)
- Backend patterns (NestJS modules, DTOs, Guards, etc.)
- WebSocket patterns (connection management, reconnection)
- Database patterns (repositories, query builders, eager loading)
- Security patterns (authentication, validation)

### CACHING.md
- HTTP cache header strategy
- `stale-while-revalidate` implementation
- When to add Redis (and when not to)
- Cache verification commands

### DEPLOYMENT_GUIDE.md
- Production environment setup
- Environment variables
- Build and deployment process
- Health checks and monitoring

### TESTING_STRATEGY.md
- Why 80% coverage target (not 100%)
- Test types: unit, integration, WebSocket, frontend, e2e
- Implementation phases and priorities
- Test infrastructure and directory structure
- Writing tests guidelines

### TESTING_GUIDE.md
- Test structure and organization
- Running unit and e2e tests
- Mocking strategies
- Test coverage goals

## Keeping Documentation Updated

- Update documentation when making architectural changes
- Ask for approval before modifying existing docs (per CLAUDE.md rules)
- Keep "Last Updated" dates current
- Link between documents where relevant

## Related Files

- [../CLAUDE.md](../CLAUDE.md) - Development rules for AI assistants
- [../README.md](../README.md) - Project overview and quick start
