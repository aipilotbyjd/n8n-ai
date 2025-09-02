# N8N-AI: Production-Ready Workflow Automation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-supported-blue)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/kubernetes-ready-green)](https://kubernetes.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0+-red)](https://nestjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green)](https://nodejs.org/)

N8N-AI is a **production-ready**, enterprise-grade workflow automation platform built with modern technologies and best practices. This enhanced version features AI-powered workflow automation, comprehensive error handling, type safety, and ultra-scalability.

## 🚀 Key Improvements

### ✅ **Production-Ready Features**
- **Comprehensive Error Handling**: Structured error responses with correlation IDs
- **Type Safety**: Strict TypeScript configuration with Zod validation
- **Shared Libraries**: Eliminated code duplication with reusable components
- **Base Classes**: Consistent patterns across services
- **Global Exception Filter**: Centralized error management
- **Comprehensive Testing**: Unit, integration, and E2E tests
- **Security Hardening**: Input validation, rate limiting, and authentication

### ✅ **Architecture Improvements**
- **Microservices Architecture**: Scalable service separation
- **Domain-Driven Design**: Clear business logic boundaries
- **Event-Driven Communication**: RabbitMQ message queuing
- **Database Optimization**: Proper indexing and query optimization
- **Caching Strategy**: Redis-based caching for performance
- **Monitoring & Observability**: Comprehensive logging and metrics

### ✅ **Developer Experience**
- **Automated Workflows**: Comprehensive Makefile for common tasks
- **Hot Reloading**: Development mode with file watching
- **Code Quality**: ESLint, Prettier, and automated formatting
- **Documentation**: Comprehensive API documentation
- **Docker Support**: Containerized development environment

### ✅ **AI & Advanced Features**
- **AI Agent Integration**: Intelligent workflow automation
- **WebSocket Support**: Real-time communication and updates
- **Event Streaming**: Comprehensive event-driven architecture
- **Analytics Dashboard**: ClickHouse-powered analytics
- **Object Storage**: MinIO integration for file handling
- **Monitoring Stack**: Prometheus, Grafana, and Jaeger tracing
- **Load Balancing**: Nginx-based API gateway

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Orchestrator  │    │     Engine      │    │  Node Runner    │
│   (NestJS)      │◄──►│   (NestJS)      │◄──►│   (Node.js)     │
│                 │    │                 │    │                 │
│ • API Gateway   │    │ • DAG Execution │    │ • Node Execution│
│ • Workflow Mgmt │    │ • State Mgmt    │    │ • Sandboxing    │
│ • Auth & Auth   │    │ • Scheduling    │    │ • Isolation     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   RabbitMQ      │
                    │   (Message Q)   │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   (Database)    │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   (Cache)       │
                    └─────────────────┘
```

## 📋 Prerequisites

- **Node.js 22+** with npm or yarn
- **Docker & Docker Compose** for containerized development
- **PostgreSQL 15+** (or use Docker)
- **Redis 7+** (or use Docker)
- **RabbitMQ 3+** (or use Docker)
- **ClickHouse** for analytics (optional, or use Docker)
- **MinIO** for object storage (optional, or use Docker)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/jaydeep-work/n8n-ai.git
cd n8n-ai

# Run initial setup
make setup
```

### 2. Start Development Environment

```bash
# Start all services
make dev

# Or start individual services
make dev-orchestrator
make dev-engine
make dev-node-runner
```

### 3. Verify Installation

```bash
# Check service health
make health

# View logs
make logs

# Access the API
curl http://localhost:3003/api/v1/health

# Check running services
docker-compose ps
```

### Service URLs

When running in development mode, services are available at:

- **Orchestrator API**: http://localhost:3003 (Main API Gateway)
- **Engine API**: http://localhost:3001 (Workflow Engine)
- **Node Runner**: http://localhost:3002 (Node Execution)
- **PostgreSQL**: localhost:5432 (Database)
- **Redis**: localhost:6379 (Cache)
- **RabbitMQ Management**: http://localhost:15672 (Message Queue UI)
- **ClickHouse**: http://localhost:8123 (Analytics DB)
- **MinIO Console**: http://localhost:9001 (Object Storage UI)
- **Prometheus**: http://localhost:9090 (Metrics)
- **Grafana**: http://localhost:3002 (Dashboards)
- **Jaeger**: http://localhost:16686 (Tracing)
- **Nginx**: http://localhost:80 (Load Balancer)

## 🛠️ Development Commands

The project includes a comprehensive Makefile with common development tasks:

```bash
# Show all available commands
make help

# Development
make dev                    # Start development environment
make dev-services          # Start services in dev mode
make build                 # Build all services
make test                  # Run all tests
make test-coverage         # Run tests with coverage
make lint                  # Run linting
make format                # Format code

# Database
make db-setup              # Setup database
make db-migrate            # Run migrations
make db-reset              # Reset database

# Docker
make docker-up             # Start Docker services
make docker-down           # Stop Docker services
make docker-logs           # View logs

# Monitoring
make health                # Check service health
make logs                  # View application logs

# Security
make security-audit        # Run security audit
make generate-keys         # Generate security keys

# Cleanup
make clean                 # Clean build artifacts
make clean-all             # Clean everything
```

## 📁 Project Structure

```
n8n-ai/
├── shared/                    # Shared libraries and utilities
│   ├── src/
│   │   ├── types/            # Common TypeScript types
│   │   ├── utils/            # Utility functions
│   │   ├── constants/        # Shared constants
│   │   └── validators/       # Validation schemas
│   └── package.json
├── orchestrator-nest/         # API Gateway & Workflow Management (NestJS)
│   ├── src/
│   │   ├── domains/          # Business logic domains
│   │   ├── common/           # Shared components
│   │   │   ├── filters/      # Exception filters
│   │   │   ├── guards/       # Authentication guards
│   │   │   ├── interceptors/ # Request/response interceptors
│   │   │   └── services/     # Base services
│   │   ├── websocket/        # WebSocket support
│   │   ├── observability/    # Monitoring & metrics
│   │   └── main.ts
│   └── package.json
├── engine-nest/              # Workflow Execution Engine (NestJS)
│   ├── src/
│   │   ├── engine/           # Execution logic
│   │   ├── dag/              # DAG processing
│   │   ├── ai/               # AI integration
│   │   └── main.ts
│   └── package.json
├── node-runner-js/           # Node Execution Service (Node.js)
│   ├── src/
│   │   ├── nodes/            # Node execution logic
│   │   ├── sandbox/          # Code sandboxing
│   │   ├── ai-agents/        # AI agent execution
│   │   └── main.ts
│   └── package.json
├── contracts/                # Shared contracts and DTOs
├── proto-contracts/          # gRPC Protocol Buffers
├── infra/                    # Infrastructure configuration
│   ├── k8s/                  # Kubernetes manifests
│   ├── prometheus/           # Monitoring configuration
│   ├── grafana/              # Dashboard configuration
│   └── nginx/                # Load balancer configuration
├── docs/                     # Documentation
├── docker-compose.yml        # Development environment
├── docker-compose.production.yml # Production environment
├── Makefile                  # Development automation
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
APP_VERSION=1.0.0
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=n8n_ai
DATABASE_USER=n8n_ai
DATABASE_PASSWORD=n8n_ai_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=n8n_ai
RABBITMQ_PASSWORD=n8n_ai_dev

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
ENABLE_TRACING=true
```

### Service Configuration

Each service has its own configuration files:

- `orchestrator-nest/src/config/` - Orchestrator configuration
- `engine-nest/src/config/` - Engine configuration
- `node-runner-js/src/config/` - Node runner configuration

## 🧪 Testing

### Running Tests

```bash
# Run all tests
make test

# Run tests with coverage
make test-coverage

# Run tests in watch mode
make test-watch

# Run end-to-end tests
make test-e2e
```

### Test Structure

```
tests/
├── unit/                    # Unit tests
├── integration/             # Integration tests
├── e2e/                     # End-to-end tests
├── fixtures/                # Test data
└── utils/                   # Test utilities
```

## 🛠️ Troubleshooting

### Common Issues

#### Docker Build Issues

**Problem**: DNS resolution errors when pulling Docker images (especially in WSL2)
```
failed to solve: node:22-alpine: failed to resolve source metadata
```

**Solutions**:
1. **Check Docker Desktop Status**: Ensure Docker Desktop is running and properly integrated with WSL2
2. **Restart Docker Desktop**: Stop and restart Docker Desktop completely
3. **Use Existing Images**: If you have previously built images, use them without rebuilding:
   ```bash
   docker-compose up orchestrator-nest -d
   ```
4. **Alternative Base Images**: Switch from alpine to regular images if DNS issues persist
5. **Network Issues**: Check your internet connection and corporate firewall settings

#### WSL2 Docker Integration Issues

**Problem**: Docker credential errors or WSL socket issues
```
error getting credentials - err: exit status 1
```

**Solutions**:
1. **Restart WSL2**:
   ```bash
   wsl --shutdown
   # Then restart your WSL2 terminal
   ```
2. **Reset Docker Credentials**:
   ```bash
   docker logout
   ```
3. **Check Docker Desktop WSL2 Integration**: Enable WSL2 integration in Docker Desktop settings

#### Service Health Check Failures

**Problem**: Services failing health checks or not starting properly

**Solutions**:
1. **Check Logs**:
   ```bash
   make logs
   # or specific service
   make logs-orchestrator
   ```
2. **Verify Dependencies**: Ensure PostgreSQL, Redis, and RabbitMQ are running:
   ```bash
   docker-compose ps
   ```
3. **Database Connection**: Check database connection and run migrations:
   ```bash
   make db-migrate
   ```

#### Port Conflicts

**Problem**: Ports already in use

**Solutions**:
1. **Check Running Services**:
   ```bash
   netstat -tulpn | grep :3000
   ```
2. **Stop Conflicting Services**:
   ```bash
   docker-compose down
   ```
3. **Change Ports**: Modify port mappings in `docker-compose.yml`

### Getting Help

- **Check Logs**: Always start by checking service logs
- **Verify Environment**: Ensure all prerequisites are installed
- **Health Checks**: Use built-in health check endpoints
- **Community**: Join our community forum for support
- **Issues**: Report bugs on GitHub Issues

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based authentication** with refresh tokens
- **Role-based access control** (RBAC)
- **Multi-tenant support** with tenant isolation
- **API key management** for service-to-service communication

### Input Validation & Sanitization
- **Zod schema validation** for all inputs
- **Input sanitization** to prevent XSS
- **SQL injection prevention** with parameterized queries
- **Rate limiting** to prevent abuse

### Data Protection
- **Encryption at rest** for sensitive data
- **TLS/SSL** for data in transit
- **Audit logging** for compliance
- **Data retention policies**

## 📊 Monitoring & Observability

### Logging
- **Structured JSON logging** with correlation IDs
- **Log levels** (debug, info, warn, error, fatal)
- **Centralized log aggregation**
- **Log rotation and retention**

### Metrics
- **Prometheus metrics** for monitoring
- **Custom business metrics**
- **Performance monitoring**
- **Resource utilization tracking**

### Tracing
- **Distributed tracing** with OpenTelemetry
- **Request correlation** across services
- **Performance profiling**
- **Error tracking and alerting**

## 🚀 Deployment

### Docker Deployment

```bash
# Build production images
make build-prod

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f infra/k8s/

# Check deployment status
kubectl get pods -n n8n-work
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

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass (`make test`)
6. Run linting (`make lint`)
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

- **API Reference**: Available via Swagger UI when running in development mode
- **Architecture Guide**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Deployment Guide**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Development Guide**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- **Troubleshooting**: See troubleshooting section above

## 🔗 Links

- **Repository**: [https://github.com/jaydeep-work/n8n-ai](https://github.com/jaydeep-work/n8n-ai)
- **Issues**: [https://github.com/jaydeep-work/n8n-ai/issues](https://github.com/jaydeep-work/n8n-ai/issues)
- **Original N8N**: [https://n8n.io](https://n8n.io)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **N8N Team**: For the original inspiration and open-source foundation
- **NestJS Team**: For the excellent framework and architecture patterns
- **Docker Team**: For containerization technology
- **Open Source Community**: For the amazing tools and libraries that make this possible

---

**Built with ❤️ for workflow automation and AI integration**

For questions or issues, please use GitHub Issues or contribute to the project.