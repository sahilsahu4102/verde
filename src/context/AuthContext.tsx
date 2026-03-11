'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { createCafeProfileAction } from '@/app/actions/cafe-profile';
import { uploadCafeImageAction } from '@/app/actions/upload-cafe-image';
import { useRouter, usePathname } from 'next/navigation';

type AuthContextType = {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string, metadata: { cafeName?: string; fullName?: string; phone?: string; description?: string; address?: string; imageFile?: File | null; latitude?: number; longitude?: number; openingHours?: string; closingHours?: string }) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    updateUserMetadata: (data: any) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setIsLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Redirect logic
    useEffect(() => {
        if (isLoading) return;

        const isOnDashboard = pathname?.startsWith('/dashboard');
        const isOnSubscribe = pathname === '/subscribe';
        const isOnLogin = pathname === '/';

        if (!user && (isOnDashboard || isOnSubscribe)) {
            router.push('/');
        } else if (user && isOnLogin) {
            router.push('/dashboard');
        }
    }, [user, isLoading, pathname, router]);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            return { error: error.message };
        }
        return { error: null };
    };

    const signUp = async (email: string, password: string, metadata: { cafeName?: string; fullName?: string; phone?: string; description?: string; address?: string; imageFile?: File | null; latitude?: number; longitude?: number; openingHours?: string; closingHours?: string }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    cafe_name: metadata.cafeName || '',
                    full_name: metadata.fullName || '',
                    phone: metadata.phone || '',
                },
            },
        });
        if (error) {
            return { error: error.message };
        }

        // Upload cafe image if provided, then create cafe_profiles row
        if (data?.user?.id) {
            let imageUrl: string | null = null;

            if (metadata.imageFile) {
                const formData = new FormData();
                formData.append('file', metadata.imageFile);
                formData.append('userId', data.user.id);
                const uploadResult = await uploadCafeImageAction(formData);
                if (uploadResult.url) {
                    imageUrl = uploadResult.url;
                }
            }

            await createCafeProfileAction({
                userId: data.user.id,
                restaurant_name: metadata.cafeName || '',
                description: metadata.description || '',
                address: metadata.address || '',
                image_url: imageUrl,
                phone: metadata.phone || '',
                opening_hours: metadata.openingHours || '09:00',
                closing_hours: metadata.closingHours || '22:00',
                latitude: metadata.latitude,
                longitude: metadata.longitude,
            });
        }

        return { error: null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const updateUserMetadata = async (data: any) => {
        const { data: updatedData, error } = await supabase.auth.updateUser({
            data: data
        });

        if (error) {
            return { error: error.message };
        }

        setUser(updatedData.user);
        return { error: null };
    };

    return (
        <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut, updateUserMetadata }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
