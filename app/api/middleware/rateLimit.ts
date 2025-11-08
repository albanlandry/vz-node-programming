/**
 * Rate Limiting Middleware for Next.js API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { defaultRateLimiters } from '../../../src/security/RateLimiter';

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get IP address from headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';

  return ip;
}

/**
 * Rate limit middleware
 */
export function rateLimit(
  limiter: typeof defaultRateLimiters.api,
  request: NextRequest,
): {
  allowed: boolean;
  response?: NextResponse;
  remaining?: number;
  resetTime?: number;
} {
  const clientId = getClientId(request);
  const result = limiter.check(clientId);

  if (!result.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: limiter.getStats().config.message,
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limiter.getStats().config.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': result.retryAfter?.toString() || '60',
          },
        },
      ),
    };
  }

  return {
    allowed: true,
    remaining: result.remaining,
    resetTime: result.resetTime,
  };
}

/**
 * API rate limit middleware
 */
export function apiRateLimit(request: NextRequest) {
  return rateLimit(defaultRateLimiters.api, request);
}

/**
 * Graph execution rate limit middleware
 */
export function graphExecutionRateLimit(request: NextRequest) {
  return rateLimit(defaultRateLimiters.graphExecution, request);
}

/**
 * Custom node creation rate limit middleware
 */
export function customNodeCreationRateLimit(request: NextRequest) {
  return rateLimit(defaultRateLimiters.customNodeCreation, request);
}

