'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { PlanName, FeatureKey, UsageCounts } from '@/lib/subscription';
import { PLAN_LIMITS, getRemaining, canUseFeature } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';

interface SubscriptionContextType {
    plan: PlanName;
    usage: UsageCounts;
    remaining: Record<FeatureKey, number>;
    isLoading: boolean;
    canUse: (feature: FeatureKey) => { allowed: boolean; remaining: number; limit: number };
    trackUsage: (feature: FeatureKey) => Promise<{ allowed: boolean; remaining: number }>;
    refreshSubscription: () => Promise<void>;
    canScrape: boolean;
}

const defaultUsage: UsageCounts = {
    dish_analyses: 0,
    procurement_plans: 0,
    marketing_generations: 0,
    video_reels: 0,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [plan, setPlan] = useState<PlanName>('free');
    const [usage, setUsage] = useState<UsageCounts>(defaultUsage);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSubscription = useCallback(async () => {
        if (!user) {
            setPlan('free');
            setUsage(defaultUsage);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // Fetch subscription
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('plan, status')
                .eq('user_id', user.id)
                .single();

            const currentPlan = (subData?.status === 'active' ? subData?.plan : 'free') as PlanName || 'free';
            setPlan(currentPlan);

            // Fetch usage for current period
            const now = new Date();
            const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const { data: usageData } = await supabase
                .from('usage_tracking')
                .select('dish_analyses, procurement_plans, marketing_generations, video_reels')
                .eq('user_id', user.id)
                .eq('period_start', periodStart)
                .single();

            setUsage(usageData as UsageCounts || defaultUsage);
        } catch (err) {
            console.error('[Subscription] Error fetching:', err);
            setPlan('free');
            setUsage(defaultUsage);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    const remaining = getRemaining(plan, usage);

    const canUse = useCallback(
        (feature: FeatureKey) => canUseFeature(plan, feature, usage),
        [plan, usage]
    );

    const trackUsage = useCallback(
        async (feature: FeatureKey): Promise<{ allowed: boolean; remaining: number }> => {
            if (!user) return { allowed: false, remaining: 0 };

            const res = await fetch('/api/subscription/usage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, feature }),
            });

            const data = await res.json();

            if (res.ok && data.allowed) {
                // Optimistic update
                setUsage(prev => ({
                    ...prev,
                    [feature]: prev[feature] + 1,
                }));
                return { allowed: true, remaining: data.remaining };
            }

            return { allowed: false, remaining: data.remaining ?? 0 };
        },
        [user]
    );

    const canScrape = PLAN_LIMITS[plan].live_scraping;

    return (
        <SubscriptionContext.Provider
            value={{
                plan,
                usage,
                remaining,
                isLoading,
                canUse,
                trackUsage,
                refreshSubscription: fetchSubscription,
                canScrape,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}
