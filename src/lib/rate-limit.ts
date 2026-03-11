import { NextResponse } from "next/server";

export interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
}

// In-memory store for rate limiting
// Note: In a multi-region serverless environment (Edge), this memory is isolated per
// Edge location/isolate. For true global rate limiting, a distributed store like Redis (e.g., Upstash) is needed.
// However, this provides a solid foundational layer of protection from abuse per region.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(ip: string, options: RateLimitOptions) {
    const now = Date.now();
    const windowMs = options.windowMs;
    const maxRequests = options.maxRequests;

    let requestData = rateLimitMap.get(ip);

    // If there's no data for the IP, or the window has passed, reset the count
    if (!requestData || requestData.resetTime < now) {
        requestData = {
            count: 1,
            resetTime: now + windowMs,
        };
        rateLimitMap.set(ip, requestData);
    } else {
        // Increment the request count
        requestData.count++;
    }

    const remaining = Math.max(0, maxRequests - requestData.count);
    const isRateLimited = requestData.count > maxRequests;

    return {
        isRateLimited,
        remaining,
        resetTime: requestData.resetTime,
        limit: maxRequests,
    };
}

// Clean up the map periodically to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimitMap.entries()) {
        if (data.resetTime < now) {
            rateLimitMap.delete(ip);
        }
    }
}, 60000); // Clean up every minute
