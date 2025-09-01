# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ src/

# Build the application
RUN npm run build

# Development stage
FROM node:18-alpine AS development

ARG PORT=3002

# Install dumb-init, curl, and Python for node-gyp
RUN apk add --no-cache dumb-init curl python3 py3-pip build-base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm install && npm cache clean --force

# Expose port
EXPOSE ${PORT}

# Start in development mode with hot reload
CMD ["npm", "run", "start:dev"]

# Production stage
FROM node:18-alpine AS production

ARG PORT=3002

# Install dumb-init and Python for signal handling and native modules
RUN apk add --no-cache dumb-init python3 py3-pip build-base

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy built application and node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Copy additional runtime files
COPY --from=builder --chown=nestjs:nodejs /app/src/nodes ./dist/nodes

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE ${PORT}

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
