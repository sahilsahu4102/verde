import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/supabase-admin';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const { planId, userId, email } = await req.json();

        if (!planId || !userId || !email) {
            return NextResponse.json({ error: 'Missing planId, userId, or email' }, { status: 400 });
        }

        // Create or retrieve Razorpay customer
        let customerId: string | undefined;
        const { data: existingSub } = await supabaseAdmin
            .from('subscriptions')
            .select('razorpay_customer_id')
            .eq('user_id', userId)
            .single();

        if (existingSub?.razorpay_customer_id) {
            customerId = existingSub.razorpay_customer_id;
        }

        // Create subscription
        const subscriptionOptions: any = {
            plan_id: planId,
            total_count: 12,                // 12 billing cycles (1 year)
            customer_notify: 1,
        };

        if (customerId) {
            subscriptionOptions.customer_id = customerId;
        }

        const subscription = await razorpay.subscriptions.create(subscriptionOptions);

        return NextResponse.json({
            subscriptionId: subscription.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            planId,
            userId,
        });
    } catch (error: any) {
        console.error('[Razorpay] Error creating subscription:', error);
        return NextResponse.json({ error: error.message || 'Failed to create subscription' }, { status: 500 });
    }
}
