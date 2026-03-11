import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function verifyAuth(req: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: req.headers,
        },
    });

    // Create a supabase client configured for SSR in Next.js middleware
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    req.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: req.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    req.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: req.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    );

    // Check if there is an active session
    // Using getUser() instead of getSession() is more secure as it validates 
    // the token with the Supabase Auth server, rather than just decoding it.
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return {
            isValid: false,
            response
        };
    }

    return {
        isValid: true,
        user,
        response
    };
}
