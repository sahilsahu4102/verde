import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PLAN_TO_RAZORPAY } from '@/lib/subscription-server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

        // Verify signature
        if (signature && secret) {
            const expected = crypto
                .createHmac('sha256', secret)
                .update(body)
                .digest('hex');

            if (expected !== signature) {
                console.warn('[Razorpay Webhook] Invalid signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const event = JSON.parse(body);
        const eventType = event.event;
        const payload = event.payload;

        console.log(`[Razorpay Webhook] Event: ${eventType}`);

        switch (eventType) {
            case 'subscription.activated':
            case 'subscription.charged': {
                const sub = payload.subscription?.entity;
                if (!sub) break;

                const planName = PLAN_TO_RAZORPAY[sub.plan_id] || 'free';
                const now = new Date().toISOString();
                const periodEnd = sub.current_end
                    ? new Date(sub.current_end * 1000).toISOString()
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

                // Find user by razorpay_subscription_id
                const { data: existingSub } = await supabaseAdmin
                    .from('subscriptions')
                    .select('user_id')
                    .eq('razorpay_subscription_id', sub.id)
                    .single();

                if (existingSub) {
                    await supabaseAdmin.from('subscriptions').update({
                        plan: planName,
                        status: 'active',
                        current_period_start: now,
                        current_period_end: periodEnd,
                        updated_at: now,
                    }).eq('razorpay_subscription_id', sub.id);
                }
                break;
            }

            case 'subscription.cancelled':
            case 'subscription.completed': {
                const sub = payload.subscription?.entity;
                if (!sub) break;

                await supabaseAdmin.from('subscriptions').update({
                    plan: 'free',
                    status: 'cancelled',
                    updated_at: new Date().toISOString(),
                }).eq('razorpay_subscription_id', sub.id);
                break;
            }

            case 'payment.failed': {
                const payment = payload.payment?.entity;
                if (!payment) break;

                // If subscription payment fails, mark as past_due
                if (payment.subscription_id) {
                    await supabaseAdmin.from('subscriptions').update({
                        status: 'past_due',
                        updated_at: new Date().toISOString(),
                    }).eq('razorpay_subscription_id', payment.subscription_id);
                }
                break;
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('[Razorpay Webhook] Error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
