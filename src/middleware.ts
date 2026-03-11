import { NextResponse, type NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth-middleware";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // We only want to run security checks on `/api` routes
    if (!pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    // Define public API paths that do not require middleware auth
    // NOTE: AI and subscription routes are called from authenticated client components
    // that already handle their own auth via Supabase client context.
    const publicApiPaths = [
        "/api/webhooks/razorpay",
        "/api/ai/",
        "/api/subscription/",
    ];

    const isPublicRoute = publicApiPaths.some((path) => pathname.startsWith(path));

    // Skip auth checks for recognized public routes
    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Authentication & Authorization (Token Verification via Supabase session cookies)
    const authResult = await verifyAuth(req);

    if (!authResult.isValid) {
        return new NextResponse(
            JSON.stringify({ error: "Unauthorized: Invalid or missing token" }),
            {
                status: 401,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }

    // Auth was successful, preserve any updated session cookies attached by verifyAuth
    return authResult.response;
}

// Ensure middleware only matches our API routes to optimize performance
export const config = {
    matcher: [
        "/api/:path*",
    ],
};
