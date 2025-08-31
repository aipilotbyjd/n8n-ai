# WebSocket Implementation

This directory contains the WebSocket implementation for real-time communication in the NestJS application.

## Architecture

The WebSocket implementation follows NestJS best practices and includes:

- **WebSocket Gateway**: Main entry point for WebSocket connections
- **Authentication Guard**: JWT-based authentication for WebSocket connections
- **DTOs**: Data Transfer Objects for message validation
- **Interceptors**: Logging and monitoring
- **Exception Filters**: Error handling
- **Service Layer**: Business logic for WebSocket operations

## Features

- ✅ Real-time bidirectional communication
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ Subscription management
- ✅ Event-driven architecture
- ✅ Comprehensive error handling
- ✅ Logging and monitoring
- ✅ CORS support
- ✅ Multiple transport protocols (WebSocket, polling)

## Connection

### Server Configuration

The WebSocket server is configured with:

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
  },
  namespace: "/workflow",
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6,
})
```

### Client Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/workflow', {
  auth: { token: 'your-jwt-token' },
  transports: ['websocket', 'polling']
});
```

## Authentication

All WebSocket connections require JWT authentication. The token can be provided in:

1. **Auth object**: `socket.auth.token`
2. **Query parameters**: `?token=your-token`
3. **Headers**: `Authorization: Bearer your-token`

## Available Events

### Client to Server

| Event | Description | Payload |
|-------|-------------|---------|
| `subscribe` | Subscribe to real-time updates | `{ type: string, resourceId?: string, filters?: object }` |
| `unsubscribe` | Unsubscribe from updates | `{ subscriptionKey: string }` |
| `ping` | Keep connection alive | `{ timestamp?: string }` |
| `get_status` | Get current status | `{ executionId?: string, workflowId?: string }` |

### Server to Client

| Event | Description | Payload |
|-------|-------------|---------|
| `connected` | Connection confirmed | `{ clientId: string, userId: string, tenantId: string, timestamp: string }` |
| `error` | Error occurred | `{ message: string, type?: string, timestamp: string }` |
| `subscription_confirmed` | Subscription successful | `{ type: string, resourceId?: string, subscriptionKey: string, timestamp: string }` |
| `unsubscription_confirmed` | Unsubscription successful | `{ subscriptionKey: string, timestamp: string }` |
| `update` | Real-time update | `{ type: string, payload: any, timestamp: string }` |
| `initial_data` | Initial data for subscription | `{ type: string, data: any, timestamp: string }` |
| `pong` | Response to ping | `{ timestamp: string }` |
| `status_response` | Status information | `{ status: any, timestamp: string }` |
| `tenant_stats` | Tenant statistics | `{ tenantId: string, stats: any }` |

## Subscription Types

### 1. Workflow
Subscribe to workflow-related events:
```javascript
socket.emit('subscribe', {
  type: 'workflow',
  resourceId: 'workflow-id' // optional
});
```

### 2. Execution
Subscribe to execution-related events:
```javascript
socket.emit('subscribe', {
  type: 'execution',
  resourceId: 'execution-id' // optional
});
```

### 3. Logs
Subscribe to log events:
```javascript
socket.emit('subscribe', {
  type: 'logs',
  resourceId: 'execution-id', // optional
  filters: {
    logLevel: 'error',
    stepId: 'step-id'
  }
});
```

### 4. Metrics
Subscribe to metrics updates:
```javascript
socket.emit('subscribe', {
  type: 'metrics'
});
```

### 5. Tenant Activity
Subscribe to tenant-wide activity:
```javascript
socket.emit('subscribe', {
  type: 'tenant_activity'
});
```

## Event Broadcasting

The system automatically broadcasts events when they occur:

### Workflow Events
- `workflow.created`
- `workflow.updated`
- `workflow.deleted`

### Execution Events
- `execution.started`
- `execution.completed`
- `execution.failed`
- `execution.cancelled`

### Step Events
- `step.started`
- `step.completed`
- `step.failed`

### Log Events
- `log.created`

### Metrics Events
- `metrics.updated`

## Rate Limiting

The WebSocket implementation includes rate limiting:

| Event | Limit | Window |
|-------|-------|--------|
| `subscribe` | 10 requests | 1 minute |
| `unsubscribe` | 20 requests | 1 minute |
| `ping` | 30 requests | 1 minute |
| `get_status` | 10 requests | 1 minute |

## Error Handling

Errors are handled through the `WsExceptionFilter` and include:

- **Authentication errors**: Invalid or missing tokens
- **Validation errors**: Invalid message format
- **Rate limiting errors**: Too many requests
- **Permission errors**: Access denied
- **Internal errors**: Server-side issues

## Monitoring

The WebSocket implementation includes comprehensive monitoring:

### Metrics
- Connection count
- Messages sent/received
- Subscription count
- Error count
- Response times

### Logging
- Connection events
- Message events
- Error events
- Performance metrics

## Testing

Use the provided HTML client example (`websocket-client-example.html`) to test the WebSocket implementation:

1. Open the HTML file in a browser
2. Enter your JWT token
3. Connect to the WebSocket server
4. Test subscriptions and events

## Environment Variables

Configure the WebSocket behavior with these environment variables:

```bash
# CORS origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# JWT secret
JWT_SECRET=your-secret-key

# WebSocket timeouts (optional)
WS_PING_TIMEOUT=60000
WS_PING_INTERVAL=25000
WS_UPGRADE_TIMEOUT=10000
WS_MAX_HTTP_BUFFER_SIZE=1000000
WS_CLEANUP_INTERVAL=300000
WS_METRICS_INTERVAL=60000
```

## Best Practices

1. **Always handle connection errors**: Implement proper error handling for connection failures
2. **Use reconnection logic**: Implement automatic reconnection with exponential backoff
3. **Validate messages**: Always validate incoming messages on the client side
4. **Monitor connections**: Track connection health and performance
5. **Secure tokens**: Never expose JWT tokens in client-side code
6. **Rate limiting**: Respect rate limits and implement client-side throttling
7. **Cleanup subscriptions**: Always unsubscribe when no longer needed

## Troubleshooting

### Common Issues

1. **Connection refused**: Check if the server is running and the port is correct
2. **Authentication failed**: Verify the JWT token is valid and not expired
3. **CORS errors**: Ensure the client origin is included in CORS_ORIGINS
4. **Rate limiting**: Reduce the frequency of requests
5. **Memory leaks**: Ensure proper cleanup of event listeners

### Debug Mode

Enable debug logging by setting the log level:

```typescript
// In your main.ts
const app = await NestFactory.create(AppModule, {
  logger: ['debug', 'error', 'warn', 'log']
});
```