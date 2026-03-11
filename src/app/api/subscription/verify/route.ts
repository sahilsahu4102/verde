import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PLAN_TO_RAZORPAY } from '@/lib/subscription-server';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, userId } = await req.json();

        if (!razorpay_payment_id || !razorpay_subscription_id || !userId) {
            return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
        }

        // Verify payment by fetching subscription from Razorpay
        const subscription: any = await razorpay.subscriptions.fetch(razorpay_subscription_id);

        // In test mode, subscriptions may be 'authenticated' rather than 'active' right after payment
        const validStatuses = ['active', 'authenticated'];
        if (!subscription || !validStatuses.includes(subscription.status)) {
            return NextResponse.json({ error: `Subscription not active (status: ${subscription?.status})` }, { status: 400 });
        }

        const planName = PLAN_TO_RAZORPAY[subscription.plan_id] || 'free';

        // Upsert subscription in Supabase
        const now = new Date().toISOString();
        const periodEnd = subscription.current_end
            ? new Date(subscription.current_end * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await supabaseAdmin.from('subscriptions').upsert(
            {
                user_id: userId,
                razorpay_customer_id: subscription.customer_id || null,
                razorpay_subscription_id: razorpay_subscription_id,
                plan: planName,
                status: 'active',
                current_period_start: now,
                current_period_end: periodEnd,
                updated_at: now,
            },
            { onConflict: 'user_id' }
        );

        return NextResponse.json({ success: true, plan: planName });
    } catch (error: any) {
        console.error('[Razorpay] Verification error:', error);
        return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
    }
}
