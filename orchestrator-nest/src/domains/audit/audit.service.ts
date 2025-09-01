import { Injectable, Logger } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface AuditEntry {
  action: string;
  resourceType: string;
  resourceId: string;
  tenantId: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async log(logEntry: AuditEntry): Promise<void> {
    try {
      // Log to database via AuditLogService
      await this.auditLogService.log(logEntry);

      // Emit event for real-time notifications
      this.eventEmitter.emit('audit.logged', {
        ...logEntry,
        timestamp: new Date().toISOString(),
      });

      this.logger.debug(`Audit log created: ${logEntry.action}`, {
        resourceType: logEntry.resourceType,
        resourceId: logEntry.resourceId,
        userId: logEntry.userId,
        tenantId: logEntry.tenantId,
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error);
      // Don't throw - audit logging shouldn't break business logic
    }
  }

  async logUserAction(
    userId: string,
    tenantId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata?: any,
  ): Promise<void> {
    await this.log({
      action,
      resourceType,
      resourceId,
      tenantId,
      userId,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      metadata,
    });
  }

  async logSystemEvent(
    action: string,
    resourceType: string,
    resourceId: string,
    tenantId: string,
    metadata?: any,
  ): Promise<void> {
    await this.log({
      action,
      resourceType,
      resourceId,
      tenantId,
      userId: 'system',
      metadata,
    });
  }

  async logSecurityEvent(
    userId: string,
    tenantId: string,
    action: string,
    details: any,
    metadata?: any,
  ): Promise<void> {
    await this.log({
      action: `security.${action}`,
      resourceType: 'security',
      resourceId: userId,
      tenantId,
      userId,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      newValues: details,
      metadata,
    });

    // Security events should also trigger alerts
    this.eventEmitter.emit('security.event', {
      userId,
      tenantId,
      action,
      details,
      timestamp: new Date().toISOString(),
      severity: this.getSecuritySeverity(action),
    });
  }

  private getSecuritySeverity(action: string): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverityActions = [
      'login_failed_multiple',
      'privilege_escalation',
      'data_breach',
      'unauthorized_access',
    ];
    
    const mediumSeverityActions = [
      'login_failed',
      'password_reset',
      'permission_denied',
    ];

    if (highSeverityActions.includes(action)) return 'high';
    if (mediumSeverityActions.includes(action)) return 'medium';
    return 'low';
  }
}
