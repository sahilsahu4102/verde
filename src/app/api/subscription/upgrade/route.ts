import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PLAN_TO_RAZORPAY } from '@/lib/subscription-server';
import type { PlanName } from '@/lib/subscription';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Plan prices in paise (INR * 100)
const PLAN_PRICES: Record<string, number> = {
    free: 0,
    starter: 49900,   // ₹499
    growth: 99900,    // ₹999
    pro: 249900,      // ₹2499
};

// GET: Calculate proration preview
export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get('userId');
        const targetPlan = req.nextUrl.searchParams.get('targetPlan') as PlanName;

        if (!userId || !targetPlan) {
            return NextResponse.json({ error: 'Missing userId or targetPlan' }, { status: 400 });
        }

        const { data: sub } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (!sub || sub.plan === 'free' || sub.status !== 'active') {
            return NextResponse.json({
                credit: 0,
                newPrice: PLAN_PRICES[targetPlan] / 100,
                amountDue: PLAN_PRICES[targetPlan] / 100,
                daysRemaining: 0,
                totalDays: 30,
                currentPlan: sub?.plan || 'free',
                targetPlan,
            });
        }

        // Calculate proration
        const periodStart = new Date(sub.current_period_start);
        const periodEnd = new Date(sub.current_period_end);
        const now = new Date();

        const totalMs = periodEnd.getTime() - periodStart.getTime();
        const usedMs = now.getTime() - periodStart.getTime();
        const remainingMs = Math.max(0, periodEnd.getTime() - now.getTime());

        const totalDays = Math.max(1, Math.round(totalMs / (1000 * 60 * 60 * 24)));
        const daysRemaining = Math.max(0, Math.round(remainingMs / (1000 * 60 * 60 * 24)));
        const usageRatio = Math.min(1, usedMs / totalMs);

        const currentPrice = PLAN_PRICES[sub.plan] || 0;
        const newPrice = PLAN_PRICES[targetPlan] || 0;

        // Credit = unused portion of current plan
        const credit = Math.round((1 - usageRatio) * currentPrice) / 100;
        // Amount due = new plan price - credit
        const amountDue = Math.max(0, Math.round(newPrice / 100 - credit));

        return NextResponse.json({
            credit: Math.round(credit),
            newPrice: newPrice / 100,
            amountDue,
            daysRemaining,
            totalDays,
            currentPlan: sub.plan,
            targetPlan,
        });
    } catch (error: any) {
        console.error('[Upgrade] Preview error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Execute the upgrade
export async function POST(req: NextRequest) {
    try {
        const { userId, targetPlanId, targetPlan } = await req.json();

        if (!userId || !targetPlanId || !targetPlan) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Get current subscription
        const { data: sub } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();

        // Cancel old Razorpay subscription if exists
        if (sub?.razorpay_subscription_id) {
            try {
                await razorpay.subscriptions.cancel(sub.razorpay_subscription_id, false);
            } catch (e: any) {
                console.warn('[Upgrade] Could not cancel old subscription:', e.message);
            }
        }

        // Calculate proration credit
        let credit = 0;
        if (sub && sub.plan !== 'free' && sub.status === 'active' && sub.current_period_start && sub.current_period_end) {
            const periodStart = new Date(sub.current_period_start);
            const periodEnd = new Date(sub.current_period_end);
            const now = new Date();

            const totalMs = periodEnd.getTime() - periodStart.getTime();
            const usedMs = now.getTime() - periodStart.getTime();
            const usageRatio = Math.min(1, usedMs / totalMs);

            const currentPrice = PLAN_PRICES[sub.plan] || 0;
            credit = Math.round((1 - usageRatio) * currentPrice);
        }

        // Create new subscription
        const subscription = await razorpay.subscriptions.create({
            plan_id: targetPlanId,
            total_count: 12,
            customer_notify: 1,
        });

        // Store credit in Supabase for tracking
        await supabaseAdmin.from('subscriptions').update({
            upgrade_credit: credit,
            pending_upgrade_plan: targetPlan,
            pending_razorpay_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
        }).eq('user_id', userId);

        return NextResponse.json({
            subscriptionId: subscription.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            credit: credit / 100,
            targetPlan,
        });
    } catch (error: any) {
        console.error('[Upgrade] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
