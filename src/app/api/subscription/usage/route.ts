import { NextRequest, NextResponse } from 'next/server';
import { incrementUsage } from '@/lib/subscription-server';
import type { FeatureKey } from '@/lib/subscription';

export async function POST(req: NextRequest) {
    try {
        const { userId, feature } = await req.json();

        if (!userId || !feature) {
            return NextResponse.json({ error: 'Missing userId or feature' }, { status: 400 });
        }

        const validFeatures: FeatureKey[] = ['dish_analyses', 'procurement_plans', 'marketing_generations', 'video_reels'];
        if (!validFeatures.includes(feature as FeatureKey)) {
            return NextResponse.json({ error: 'Invalid feature' }, { status: 400 });
        }

        const result = await incrementUsage(userId, feature as FeatureKey);

        if (!result.allowed) {
            return NextResponse.json({ error: 'Usage limit reached', remaining: 0 }, { status: 403 });
        }

        return NextResponse.json({ allowed: true, remaining: result.remaining });
    } catch (error: any) {
        console.error('[Usage] Error:', error);
        return NextResponse.json({ error: error.message || 'Usage tracking failed' }, { status: 500 });
    }
}
