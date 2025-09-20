import { Injectable } from '@nestjs/common';
import { ILoggerService } from '../interfaces/logger.interface';
import { SecuritySeverity } from '../enums';

export interface SecurityEvent {
  event: string;
  severity: SecuritySeverity;
  userId?: string;
  ip?: string;
  userAgent?: string;
  context?: Record<string, any>;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
}

@Injectable()
export class SecurityService {
  private readonly rateLimitStore = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private readonly suspiciousIPs = new Set<string>();
  private readonly blockedIPs = new Set<string>();

  constructor(private readonly logger: ILoggerService) {}

  /**
   * Log security event
   */
  logSecurityEvent(event: SecurityEvent): void {
    this.logger.securityEvent(event.event, event.severity, {
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      ...event.context,
    });

    // Auto-block critical security events
    if (event.severity === SecuritySeverity.CRITICAL && event.ip) {
      this.blockIP(event.ip, 'Critical security event');
    }
  }

  /**
   * Check rate limit
   */
  checkRateLimit(
    key: string,
    config: RateLimitConfig,
    context?: Record<string, any>,
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      // New window or expired entry
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      };
    }

    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      this.logSecurityEvent({
        event: 'Rate limit exceeded',
        severity: SecuritySeverity.HIGH,
        context: {
          key,
          count: entry.count,
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
          ...context,
        },
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count++;
    this.rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  /**
   * Block IP address
   */
  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    this.logSecurityEvent({
      event: 'IP blocked',
      severity: SecuritySeverity.HIGH,
      context: {
        ip,
        reason,
        blockedIPs: this.blockedIPs.size,
      },
    });
  }

  /**
   * Unblock IP address
   */
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.logger.log(`IP unblocked: ${ip}`, {
      context: {
        ip,
        blockedIPs: this.blockedIPs.size,
      },
    });
  }

  /**
   * Check if IP is suspicious
   */
  isIPSuspicious(ip: string): boolean {
    return this.suspiciousIPs.has(ip);
  }

  /**
   * Mark IP as suspicious
   */
  markIPSuspicious(ip: string, reason: string): void {
    this.suspiciousIPs.add(ip);
    this.logSecurityEvent({
      event: 'IP marked as suspicious',
      severity: SecuritySeverity.MEDIUM,
      context: {
        ip,
        reason,
        suspiciousIPs: this.suspiciousIPs.size,
      },
    });
  }

  /**
   * Validate JWT token format
   */
  validateJWTFormat(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3 && parts.every((part) => part.length > 0);
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Generate secure random string
   */
  generateSecureToken(length = 32): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  /**
   * Hash sensitive data for logging
   */
  hashSensitiveData(data: string): string {
    // Simple hash for logging purposes (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Check for SQL injection patterns
   */
  detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\b(OR|AND)\s+['"]\s*=\s*['"])/i,
      /(\b(OR|AND)\s+['"]\s*LIKE\s*['"])/i,
      /(\b(OR|AND)\s+['"]\s*IN\s*\()/i,
      /(\b(OR|AND)\s+['"]\s*BETWEEN\s+)/i,
      /(\b(OR|AND)\s+['"]\s*EXISTS\s*\()/i,
      /(\b(OR|AND)\s+['"]\s*NOT\s+EXISTS\s*\()/i,
    ];

    return sqlPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Check for XSS patterns
   */
  detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
      /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    blockedIPs: number;
    suspiciousIPs: number;
    rateLimitEntries: number;
  } {
    return {
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size,
      rateLimitEntries: this.rateLimitStore.size,
    };
  }

  /**
   * Clean expired rate limit entries
   */
  cleanExpiredRateLimits(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        this.rateLimitStore.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned ${cleaned} expired rate limit entries`);
    }

    return cleaned;
  }
}
