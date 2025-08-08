/**
 * API Security Middleware
 * Production-ready security utilities for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from './server-auth';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security headers for API responses
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

/**
 * Rate limiting middleware
 */
export function rateLimit(
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
) {
  return async (request: NextRequest) => {
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    const now = Date.now();
    const userLimit = rateLimitStore.get(ip);
    
    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= maxRequests) {
          return NextResponse.json(
            { error: 'Too many requests, please try again later' },
            { 
              status: 429,
              headers: {
                'Retry-After': String(Math.ceil((userLimit.resetTime - now) / 1000)),
                ...securityHeaders
              }
            }
          );
        }
        userLimit.count++;
      } else {
        // Reset the window
        userLimit.count = 1;
        userLimit.resetTime = now + windowMs;
      }
    } else {
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + windowMs
      });
    }
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) {
          rateLimitStore.delete(key);
        }
      }
    }
    
    return null; // Continue to next middleware
  };
}

/**
 * Authentication middleware for API routes
 */
export async function requireApiAuth(
  request: NextRequest,
  options: {
    allowedRoles?: string[];
    requireWorkspace?: boolean;
  } = {}
) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: securityHeaders }
      );
    }
    
    // Check role permissions
    if (options.allowedRoles && options.allowedRoles.length > 0) {
      const userRole = (user as any).role || 'user';
      if (!options.allowedRoles.includes(userRole)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403, headers: securityHeaders }
        );
      }
    }
    
    // Check workspace requirement
    if (options.requireWorkspace) {
      const workspaceId = (user as any).workspaceId || (user as any).workspace_id;
      if (!workspaceId) {
        return NextResponse.json(
          { error: 'Workspace membership required' },
          { status: 403, headers: securityHeaders }
        );
      }
    }
    
    return { user }; // Authentication successful
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401, headers: securityHeaders }
    );
  }
}

/**
 * Input validation helper
 */
export function validateInput<T extends Record<string, any>>(
  data: any,
  schema: {
    [K in keyof T]: {
      type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'date';
      required?: boolean;
      min?: number;
      max?: number;
      pattern?: RegExp;
      enum?: any[];
    };
  }
): { valid: boolean; errors: string[]; data?: T } {
  const errors: string[] = [];
  const validated: any = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    
    if (value === undefined || value === null) {
      continue; // Skip optional empty fields
    }
    
    // Type validation
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        } else {
          if (rules.min && value.length < rules.min) {
            errors.push(`${field} must be at least ${rules.min} characters`);
          }
          if (rules.max && value.length > rules.max) {
            errors.push(`${field} must be at most ${rules.max} characters`);
          }
          if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(`${field} has invalid format`);
          }
        }
        break;
        
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`${field} must be a number`);
        } else {
          if (rules.min !== undefined && num < rules.min) {
            errors.push(`${field} must be at least ${rules.min}`);
          }
          if (rules.max !== undefined && num > rules.max) {
            errors.push(`${field} must be at most ${rules.max}`);
          }
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${field} must be a boolean`);
        }
        break;
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field} must be a valid email address`);
        }
        break;
        
      case 'url':
        try {
          new URL(value);
        } catch {
          errors.push(`${field} must be a valid URL`);
        }
        break;
        
      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push(`${field} must be a valid date`);
        }
        break;
    }
    
    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }
    
    if (errors.length === 0 || !errors.find(e => e.includes(field))) {
      validated[field] = value;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? validated as T : undefined
  };
}

/**
 * Sanitize HTML input to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Create secure API response
 */
export function secureResponse(
  data: any,
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
) {
  return NextResponse.json(data, {
    status,
    headers: {
      ...securityHeaders,
      ...additionalHeaders
    }
  });
}

/**
 * Log security events (in production, send to monitoring service)
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, any>
) {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${event}:`, details);
  
  // In production, send to monitoring service like Sentry
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureMessage(event, { extra: details });
  // }
}

/**
 * CORS configuration for API routes
 */
export function corsHeaders(origin?: string) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  const requestOrigin = origin || 'http://localhost:3000';
  
  if (allowedOrigins.includes('*') || allowedOrigins.includes(requestOrigin)) {
    return {
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
  }
  
  return {};
}