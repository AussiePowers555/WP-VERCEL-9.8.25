/**
 * Audit logging utilities for tracking all important operations
 */

import { DatabaseService, ensureDatabaseInitialized } from './database';

export type AuditAction = 
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.login'
  | 'user.logout'
  | 'user.password_change'
  | 'user.password_reset'
  | 'workspace.create'
  | 'workspace.update'
  | 'workspace.delete'
  | 'workspace.share'
  | 'case.create'
  | 'case.update'
  | 'case.delete'
  | 'case.assign'
  | 'interaction.create'
  | 'interaction.update'
  | 'interaction.delete'
  | 'bike.create'
  | 'bike.update'
  | 'bike.delete'
  | 'bike.assign'
  | 'bike.return'
  | 'credential.generate'
  | 'credential.distribute'
  | 'credential.view'
  | 'export.data'
  | 'import.data'
  | 'system.error'
  | 'security.alert';

export interface AuditLog {
  id: string;
  action: AuditAction;
  actor_id?: string;
  actor_email?: string;
  actor_role?: string;
  target_type?: string; // 'user', 'workspace', 'case', etc.
  target_id?: string;
  target_name?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failure' | 'warning';
  error_message?: string;
  created_at: Date;
}

export interface AuditLogOptions {
  action: AuditAction;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failure' | 'warning';
  errorMessage?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(options: AuditLogOptions): Promise<void> {
  try {
    await ensureDatabaseInitialized();
    
    const auditLog: Omit<AuditLog, 'id'> = {
      action: options.action,
      actor_id: options.actorId,
      actor_email: options.actorEmail,
      actor_role: options.actorRole,
      target_type: options.targetType,
      target_id: options.targetId,
      target_name: options.targetName,
      details: options.details,
      ip_address: options.ipAddress,
      user_agent: options.userAgent,
      status: options.status || 'success',
      error_message: options.errorMessage,
      created_at: new Date()
    };

    // Store in database - using a generic approach since createAuditLog might not exist
    // In production, this would be stored in an audit_logs table
    console.log('[AUDIT]', {
      action: auditLog.action,
      actor: auditLog.actor_email || auditLog.actor_id,
      target: `${auditLog.target_type}:${auditLog.target_id}`,
      status: auditLog.status,
      details: auditLog.details
    });

    // If it's a security alert or failure, also log to console for immediate visibility
    if (auditLog.status === 'failure' || auditLog.action.startsWith('security.')) {
      console.error('[AUDIT ALERT]', {
        action: auditLog.action,
        actor: auditLog.actor_email || auditLog.actor_id,
        target: `${auditLog.target_type}:${auditLog.target_id}`,
        status: auditLog.status,
        error: auditLog.error_message
      });
    }
  } catch (error) {
    // Audit logging should not break the application
    console.error('[AUDIT ERROR] Failed to log audit event:', error);
  }
}

/**
 * Helper function to extract IP and user agent from request
 */
export function extractRequestMetadata(request: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  const ipAddress = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    undefined;
    
  const userAgent = request.headers.get('user-agent') || undefined;
  
  return { ipAddress, userAgent };
}

/**
 * Log a successful login
 */
export async function logLoginSuccess(
  userId: string,
  email: string,
  role: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action: 'user.login',
    actorId: userId,
    actorEmail: email,
    actorRole: role,
    targetType: 'user',
    targetId: userId,
    targetName: email,
    ipAddress,
    userAgent,
    status: 'success'
  });
}

/**
 * Log a failed login attempt
 */
export async function logLoginFailure(
  email: string,
  reason: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    action: 'user.login',
    actorEmail: email,
    targetType: 'user',
    targetName: email,
    ipAddress,
    userAgent,
    status: 'failure',
    errorMessage: reason,
    details: { reason }
  });
}

/**
 * Log credential generation
 */
export async function logCredentialGeneration(
  actorId: string,
  actorEmail: string,
  actorRole: string,
  targetUserId: string,
  targetEmail: string,
  credentialType: 'temporary' | 'reset' | 'permanent'
): Promise<void> {
  await logAuditEvent({
    action: 'credential.generate',
    actorId,
    actorEmail,
    actorRole,
    targetType: 'user',
    targetId: targetUserId,
    targetName: targetEmail,
    details: { credentialType },
    status: 'success'
  });
}

/**
 * Log data export
 */
export async function logDataExport(
  actorId: string,
  actorEmail: string,
  actorRole: string,
  exportType: string,
  recordCount: number,
  filters?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    action: 'export.data',
    actorId,
    actorEmail,
    actorRole,
    details: {
      exportType,
      recordCount,
      filters
    },
    status: 'success'
  });
}

/**
 * Log security alert
 */
export async function logSecurityAlert(
  alertType: string,
  description: string,
  actorId?: string,
  actorEmail?: string,
  ipAddress?: string,
  details?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    action: 'security.alert',
    actorId,
    actorEmail,
    ipAddress,
    details: {
      alertType,
      description,
      ...details
    },
    status: 'warning'
  });
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters: {
  action?: AuditAction | AuditAction[];
  actorId?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: 'success' | 'failure' | 'warning';
  limit?: number;
  offset?: number;
}): Promise<AuditLog[]> {
  // This would query from the audit_logs table in production
  // For now, return empty array since the table doesn't exist yet
  console.log('[AUDIT] Query audit logs with filters:', filters);
  return [];
}

/**
 * Get user's activity timeline
 */
export async function getUserActivityTimeline(
  userId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  return queryAuditLogs({
    actorId: userId,
    limit
  });
}

/**
 * Get recent security alerts
 */
export async function getRecentSecurityAlerts(
  limit: number = 20
): Promise<AuditLog[]> {
  return queryAuditLogs({
    action: 'security.alert',
    limit
  });
}

/**
 * Generate audit report
 */
export async function generateAuditReport(
  startDate: Date,
  endDate: Date
): Promise<{
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsByStatus: Record<string, number>;
  topActors: Array<{ email: string; count: number }>;
  failureRate: number;
  securityAlerts: number;
}> {
  const logs = await queryAuditLogs({ startDate, endDate });
  
  const eventsByAction: Record<string, number> = {};
  const eventsByStatus: Record<string, number> = {};
  const actorCounts: Map<string, number> = new Map();
  let securityAlerts = 0;
  
  for (const log of logs) {
    // Count by action
    eventsByAction[log.action] = (eventsByAction[log.action] || 0) + 1;
    
    // Count by status
    eventsByStatus[log.status] = (eventsByStatus[log.status] || 0) + 1;
    
    // Count by actor
    if (log.actor_email) {
      actorCounts.set(log.actor_email, (actorCounts.get(log.actor_email) || 0) + 1);
    }
    
    // Count security alerts
    if (log.action === 'security.alert') {
      securityAlerts++;
    }
  }
  
  // Get top actors
  const topActors = Array.from(actorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([email, count]) => ({ email, count }));
  
  // Calculate failure rate
  const totalEvents = logs.length;
  const failures = eventsByStatus['failure'] || 0;
  const failureRate = totalEvents > 0 ? (failures / totalEvents) * 100 : 0;
  
  return {
    totalEvents,
    eventsByAction,
    eventsByStatus,
    topActors,
    failureRate: Math.round(failureRate * 100) / 100,
    securityAlerts
  };
}