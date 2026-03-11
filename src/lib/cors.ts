import { NextResponse } from "next/server";

export function handleCors(origin: string | null) {
    // Read allowed origins from env variable, default to empty array
    // Example: ALLOWED_ORIGINS=https://my-frontend.com,https://dashboard.com
    const allowedOriginsStr = process.env.ALLOWED_ORIGINS || "";
    const allowedOriginsList = allowedOriginsStr.split(",").map(o => o.trim()).filter(Boolean);

    // For local development, allow all localhost origins regardless of port
    if (process.env.NODE_ENV === 'development') {
        allowedOriginsList.push("http://localhost:3000");
        allowedOriginsList.push("http://localhost:9002");
    }

    // Determine if the current origin is allowed
    // If origins list is empty (not configured), we reject by default for security, 
    // or you could choose to allow all in development if preferred. Here we enforce strictness.
    let isAllowed = false;

    // In development, allow any localhost origin (any port)
    const isLocalhostOrigin = origin && /^https?:\/\/localhost(:\d+)?$/.test(origin);

    if (origin && (allowedOriginsList.includes(origin) || (process.env.NODE_ENV === 'development' && isLocalhostOrigin))) {
        isAllowed = true;
    } else if (!origin) {
        // Requests without an origin header (like server-to-server or direct curl)
        // Usually allowed, but we can set headers strictly
        isAllowed = true;
    }

    // Preflight response
    const headers = new Headers();

    if (isAllowed) {
        headers.set("Access-Control-Allow-Origin", origin || "*");
        headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        headers.set("Access-Control-Allow-Credentials", "true");
    }

    return {
        isAllowed,
        corsHeaders: headers,
    };
}
