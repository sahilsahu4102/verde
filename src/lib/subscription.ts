import { supabase } from './supabase';

// ─── Plan Limits (client-safe) ───

export type PlanName = 'free' | 'starter' | 'growth' | 'pro';

export type FeatureKey = 'dish_analyses' | 'procurement_plans' | 'marketing_generations' | 'video_reels';

interface PlanLimits {
    dish_analyses: number;       // -1 = unlimited
    procurement_plans: number;
    marketing_generations: number;
    video_reels: number;
    live_scraping: boolean;
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
    free: {
        dish_analyses: 2,
        procurement_plans: 1,
        marketing_generations: 1,
        video_reels: 0,
        live_scraping: false,
    },
    starter: {
        dish_analyses: -1,
        procurement_plans: 10,
        marketing_generations: 5,
        video_reels: 0,
        live_scraping: false,
    },
    growth: {
        dish_analyses: -1,
        procurement_plans: -1,
        marketing_generations: -1,
        video_reels: 3,
        live_scraping: true,
    },
    pro: {
        dish_analyses: -1,
        procurement_plans: -1,
        marketing_generations: -1,
        video_reels: 10,
        live_scraping: true,
    },
};

// ─── Subscription Queries (client-safe, uses anon key) ───

export interface Subscription {
    plan: PlanName;
    status: string;
    razorpay_subscription_id: string | null;
    current_period_end: string | null;
}

export interface UsageCounts {
    dish_analyses: number;
    procurement_plans: number;
    marketing_generations: number;
    video_reels: number;
}

export async function getSubscription(userId: string): Promise<Subscription> {
    const { data } = await supabase
        .from('subscriptions')
        .select('plan, status, razorpay_subscription_id, current_period_end')
        .eq('user_id', userId)
        .single();

    if (!data) {
        return { plan: 'free', status: 'active', razorpay_subscription_id: null, current_period_end: null };
    }

    return data as Subscription;
}

export function getCurrentPeriodStart(): string {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export async function getUsage(userId: string): Promise<UsageCounts> {
    const periodStart = getCurrentPeriodStart();

    const { data } = await supabase
        .from('usage_tracking')
        .select('dish_analyses, procurement_plans, marketing_generations, video_reels')
        .eq('user_id', userId)
        .eq('period_start', periodStart)
        .single();

    if (!data) {
        return { dish_analyses: 0, procurement_plans: 0, marketing_generations: 0, video_reels: 0 };
    }

    return data as UsageCounts;
}

export function getRemaining(plan: PlanName, usage: UsageCounts): Record<FeatureKey, number> {
    const limits = PLAN_LIMITS[plan];
    return {
        dish_analyses: limits.dish_analyses === -1 ? -1 : Math.max(0, limits.dish_analyses - usage.dish_analyses),
        procurement_plans: limits.procurement_plans === -1 ? -1 : Math.max(0, limits.procurement_plans - usage.procurement_plans),
        marketing_generations: limits.marketing_generations === -1 ? -1 : Math.max(0, limits.marketing_generations - usage.marketing_generations),
        video_reels: limits.video_reels === -1 ? -1 : Math.max(0, limits.video_reels - usage.video_reels),
    };
}

export function canUseFeature(plan: PlanName, feature: FeatureKey, usage: UsageCounts): { allowed: boolean; remaining: number; limit: number } {
    const limits = PLAN_LIMITS[plan];
    const limit = limits[feature];
    const used = usage[feature];

    if (limit === -1) return { allowed: true, remaining: -1, limit: -1 };
    if (limit === 0) return { allowed: false, remaining: 0, limit: 0 };

    const remaining = Math.max(0, limit - used);
    return { allowed: remaining > 0, remaining, limit };
}

export function canUseScraping(plan: PlanName): boolean {
    return PLAN_LIMITS[plan].live_scraping;
}
