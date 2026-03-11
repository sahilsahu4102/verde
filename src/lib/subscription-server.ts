// Server-only subscription logic — DO NOT import from client components
import { supabaseAdmin } from './supabase-admin';
import { PLAN_LIMITS, getCurrentPeriodStart } from './subscription';
import type { PlanName, FeatureKey, Subscription } from './subscription';

// Map Razorpay plan IDs to our plan names
// Check both server-side and NEXT_PUBLIC env vars, plus hardcoded fallbacks
const starterPlanId = process.env.RAZORPAY_STARTER_PLAN_ID || process.env.NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID || '';
const growthPlanId = process.env.RAZORPAY_GROWTH_PLAN_ID || process.env.NEXT_PUBLIC_RAZORPAY_GROWTH_PLAN_ID || '';
const proPlanId = process.env.RAZORPAY_PRO_PLAN_ID || process.env.NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID || '';

export const PLAN_TO_RAZORPAY: Record<string, PlanName> = {
    [starterPlanId]: 'starter',
    [growthPlanId]: 'growth',
    [proPlanId]: 'pro',
};

// Admin version (bypasses RLS)
export async function getSubscriptionAdmin(userId: string): Promise<Subscription> {
    const { data } = await supabaseAdmin
        .from('subscriptions')
        .select('plan, status, razorpay_subscription_id, current_period_end')
        .eq('user_id', userId)
        .single();

    if (!data) return { plan: 'free', status: 'active', razorpay_subscription_id: null, current_period_end: null };
    return data as Subscription;
}

export async function incrementUsage(userId: string, feature: FeatureKey): Promise<{ allowed: boolean; remaining: number }> {
    const periodStart = getCurrentPeriodStart();

    const sub = await getSubscriptionAdmin(userId);
    const plan = sub.plan;
    const limits = PLAN_LIMITS[plan];
    const limit = limits[feature];

    if (limit === -1) return { allowed: true, remaining: -1 };
    if (limit === 0) return { allowed: false, remaining: 0 };

    // Upsert usage row
    const { data: usageRow } = await supabaseAdmin
        .from('usage_tracking')
        .upsert(
            { user_id: userId, period_start: periodStart },
            { onConflict: 'user_id,period_start' }
        )
        .select()
        .single();

    if (!usageRow) return { allowed: false, remaining: 0 };

    const currentCount = usageRow[feature] || 0;
    if (currentCount >= limit) {
        return { allowed: false, remaining: 0 };
    }

    const { data: updated } = await supabaseAdmin
        .from('usage_tracking')
        .update({ [feature]: currentCount + 1 })
        .eq('id', usageRow.id)
        .select()
        .single();

    const newCount = updated?.[feature] || currentCount + 1;
    return { allowed: true, remaining: Math.max(0, limit - newCount) };
}
