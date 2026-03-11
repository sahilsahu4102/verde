'use client';

import { cn } from '@/lib/utils';
import type { FeatureKey } from '@/lib/subscription';
import { useSubscription } from '@/context/SubscriptionContext';

interface UsageBadgeProps {
    feature: FeatureKey;
    className?: string;
}

export function UsageBadge({ feature, className }: UsageBadgeProps) {
    const { canUse, isLoading } = useSubscription();

    if (isLoading) return null;

    const { remaining, limit } = canUse(feature);

    // Feature not available at all for this plan
    if (limit === 0) {
        return (
            <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-500', className)}>
                🔒 Upgrade
            </span>
        );
    }

    // Unlimited
    if (remaining === -1) {
        return (
            <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-500', className)}>
                ∞
            </span>
        );
    }

    // Calculate color based on remaining percentage
    const pct = limit > 0 ? remaining / limit : 0;
    let color = 'bg-green-500/10 text-green-500';
    let icon = '🟢';

    if (remaining === 0) {
        color = 'bg-red-500/10 text-red-500';
        icon = '🔴';
    } else if (pct <= 0.5) {
        color = 'bg-yellow-500/10 text-yellow-500';
        icon = '🟡';
    }

    return (
        <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', color, className)}>
            {icon} {remaining}/{limit} left
        </span>
    );
}
