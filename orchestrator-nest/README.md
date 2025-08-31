# N8N-Work Orchestrator Service

[![NestJS](https://img.shields.io/badge/NestJS-11.0+-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The N8N-Work Orchestrator Service is the central control plane for the workflow automation platform. It manages workflows, executions, authentication, and coordinates with other services in the ecosystem.

## 🏗️ Architecture

The orchestrator service follows NestJS best practices and implements a clean architecture pattern:

```
src/
├── domains/              # Business logic domains
│   ├── auth/            # Authentication & authorization
│   ├── workflows/       # Workflow management
│   ├── executions/      # Execution tracking
│   ├── credentials/     # Credential management
│   ├── nodes/           # Node management
│   ├── scheduling/      # Workflow scheduling
│   ├── webhooks/        # Webhook management
│   ├── tenants/         # Multi-tenancy
│   ├── audit/           # Audit logging
│   ├── marketplace/     # Plugin marketplace
│   ├── ai-agents/       # AI agent management
│   ├── monitoring/      # System monitoring
│   ├── billing/         # Billing & usage
│   └── policies/        # Policy management
├── common/              # Shared components
│   ├── filters/         # Exception filters
│   ├── guards/          # Authentication guards
│   ├── interceptors/    # Request/response interceptors
│   ├── decorators/      # Custom decorators
│   └── services/        # Base services
├── config/              # Configuration
├── health/              # Health checks
├── observability/       # Monitoring & metrics
├── event-streaming/     # Event streaming
├── websocket/           # WebSocket support
└── mq/                  # Message queue handling
```

## 🚀 Features

### Core Functionality
- **Workflow Management**: Create, update, delete, and version workflows
- **Execution Orchestration**: Coordinate workflow executions across services
- **Authentication & Authorization**: JWT-based auth with RBAC
- **Multi-tenancy**: Tenant isolation and management
- **Credential Management**: Secure storage and management of credentials
- **Node Management**: Node registration and metadata management

### Advanced Features
- **Scheduling**: Cron-based workflow scheduling
- **Webhooks**: Incoming webhook management
- **Audit Logging**: Comprehensive audit trail
- **Monitoring**: Real-time system monitoring
- **Event Streaming**: Real-time event distribution
- **Plugin Marketplace**: Node and integration marketplace

### Production Features
- **Health Checks**: Comprehensive health monitoring
- **Rate Limiting**: API rate limiting and throttling
- **Caching**: Redis-based caching
- **Security**: Input validation, CORS, helmet
- **Logging**: Structured logging with correlation IDs
- **Metrics**: Prometheus metrics collection

## 📋 Prerequisites

- **Node.js 18+** with npm or yarn
- **PostgreSQL 15+** database
- **Redis 7+** for caching
- **RabbitMQ 3+** for message queuing
- **Docker** (optional, for containerized development)

## 🛠️ Installation

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/n8n-work/platform.git
cd platform

# Install dependencies
cd orchestrator-nest
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Database Setup

```bash
# Run database migrations
npm run migration:run

# Seed initial data (optional)
npm run seed
```

### 4. Start Development Server

```bash
# Start in development mode
npm run start:dev

# Or start in production mode
npm run start:prod
```

## 🔧 Configuration

### Environment Variables

The service uses comprehensive environment configuration. See `.env.example` for all available options:

```env
# Application
NODE_ENV=development
PORT=3000
APP_VERSION=1.0.0

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=n8n_ai
DATABASE_USER=n8n_ai
DATABASE_PASSWORD=n8n_ai_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=n8n_ai
RABBITMQ_PASSWORD=n8n_ai_dev

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
```

### Configuration Files

- `src/config/database.config.ts` - Database configuration
- `src/config/jwt.config.ts` - JWT configuration
- `src/config/rabbitmq.config.ts` - RabbitMQ configuration
- `src/config/cache.config.ts` - Redis cache configuration
- `src/config/validation.schema.ts` - Environment validation schema

## 🏃‍♂️ Development

### Available Scripts

```bash
# Development
npm run start:dev          # Start in development mode
npm run start:debug        # Start in debug mode
npm run start:prod         # Start in production mode

# Building
npm run build              # Build the application
npm run build:prod         # Build for production

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests

# Database
npm run migration:create   # Create a new migration
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
npm run seed               # Seed database with initial data

# Linting & Formatting
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues
npm run format             # Format code with Prettier
```

### Code Structure

#### Domain Modules

Each domain follows the same structure:

```
domains/workflows/
├── workflows.controller.ts    # HTTP endpoints
├── workflows.service.ts       # Business logic
├── workflows.module.ts        # Module definition
├── dto/                       # Data transfer objects
│   ├── create-workflow.dto.ts
│   ├── update-workflow.dto.ts
│   └── list-workflows.dto.ts
└── entities/                  # Database entities
    └── workflow.entity.ts
```

#### Common Components

- **Filters**: Global exception handling
- **Guards**: Authentication and authorization
- **Interceptors**: Request/response transformation
- **Decorators**: Custom decorators for common patterns
- **Services**: Base service classes

## 🔌 API Documentation

### Swagger Documentation

When running in development mode, API documentation is available at:
- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json

### API Endpoints

#### Health Checks
- `GET /health` - Comprehensive health check
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check
- `GET /health/info` - Service information

#### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - User logout

#### Workflows
- `GET /api/v1/workflows` - List workflows
- `POST /api/v1/workflows` - Create workflow
- `GET /api/v1/workflows/:id` - Get workflow
- `PUT /api/v1/workflows/:id` - Update workflow
- `DELETE /api/v1/workflows/:id` - Delete workflow
- `POST /api/v1/workflows/:id/execute` - Execute workflow

#### Executions
- `GET /api/v1/executions` - List executions
- `GET /api/v1/executions/:id` - Get execution
- `POST /api/v1/executions/:id/cancel` - Cancel execution
- `POST /api/v1/executions/:id/retry` - Retry execution

## 🔒 Security

### Authentication

The service uses JWT-based authentication with the following features:

- **Access Tokens**: Short-lived tokens for API access
- **Refresh Tokens**: Long-lived tokens for token renewal
- **Token Blacklisting**: Secure token invalidation
- **Rate Limiting**: Protection against brute force attacks

### Authorization

Role-based access control (RBAC) with the following roles:

- **Owner**: Full access to tenant resources
- **Admin**: Administrative access
- **Editor**: Create and modify workflows
- **Viewer**: Read-only access
- **Executor**: Execute workflows only

### Input Validation

- **Zod Schemas**: Runtime type validation
- **Input Sanitization**: XSS protection
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: API abuse prevention

## 📊 Monitoring & Observability

### Health Checks

The service provides comprehensive health checks:

```bash
# Health check
curl http://localhost:3000/health

# Readiness check
curl http://localhost:3000/health/ready

# Liveness check
curl http://localhost:3000/health/live
```

### Logging

Structured JSON logging with correlation IDs:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "message": "Request completed",
  "correlationId": "corr_1704067200000_abc123",
  "method": "GET",
  "url": "/api/v1/workflows",
  "statusCode": 200,
  "duration": 150
}
```

### Metrics

Prometheus metrics are available at `/metrics`:

- **HTTP Metrics**: Request count, duration, status codes
- **Business Metrics**: Workflow executions, active users
- **System Metrics**: Memory usage, CPU usage, database connections

## 🧪 Testing

### Test Structure

```
test/
├── unit/                    # Unit tests
├── integration/             # Integration tests
├── e2e/                     # End-to-end tests
├── fixtures/                # Test data
└── utils/                   # Test utilities
```

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Coverage report
npm run test:cov
```

### Test Coverage

The service maintains high test coverage:
- **Unit Tests**: 90%+ coverage
- **Integration Tests**: Service interaction testing
- **E2E Tests**: Full workflow testing

## 🚀 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t n8n-work-orchestrator .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URI=postgresql://user:pass@host:5432/db \
  -e REDIS_URI=redis://host:6379 \
  -e RABBITMQ_URI=amqp://user:pass@host:5672 \
  n8n-work-orchestrator
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: n8n-work-orchestrator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: n8n-work-orchestrator
  template:
    metadata:
      labels:
        app: n8n-work-orchestrator
    spec:
      containers:
      - name: orchestrator
        image: n8n-work/orchestrator:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URI
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: uri
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Documentation updated

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass (`npm test`)
6. Run linting (`npm run lint`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **NestJS**: Follow NestJS best practices
- **Testing**: Minimum 90% code coverage
- **Documentation**: Comprehensive JSDoc comments
- **Commits**: Conventional Commits format

## 📚 Documentation

- **API Reference**: [https://docs.n8n-work.com/api](https://docs.n8n-work.com/api)
- **Architecture Guide**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Deployment Guide**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Development Guide**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

## 🔗 Links

- **Website**: [https://n8n-work.com](https://n8n-work.com)
- **Documentation**: [https://docs.n8n-work.com](https://docs.n8n-work.com)
- **Issues**: [https://github.com/n8n-work/platform/issues](https://github.com/n8n-work/platform/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

---

**Built with ❤️ using NestJS**
