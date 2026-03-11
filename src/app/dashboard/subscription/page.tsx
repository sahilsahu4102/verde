"use client";

import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowUpRight, Zap, CreditCard } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/subscription";
import type { PlanName, FeatureKey } from "@/lib/subscription";

const PLAN_DISPLAY: Record<PlanName, { label: string; price: string; color: string }> = {
    free: { label: "Free", price: "₹0", color: "text-muted-foreground" },
    starter: { label: "Starter", price: "₹499/mo", color: "text-blue-500" },
    growth: { label: "Growth", price: "₹999/mo", color: "text-primary" },
    pro: { label: "Pro", price: "₹2,499/mo", color: "text-amber-500" },
};

const FEATURE_LABELS: Record<FeatureKey, string> = {
    dish_analyses: "Dish Analyses",
    procurement_plans: "Procurement Plans",
    marketing_generations: "Marketing Content",
    video_reels: "Video Reels",
};

function UsageBar({ feature, used, limit }: { feature: string; used: number; limit: number }) {
    const isUnlimited = limit === -1;
    const isUnavailable = limit === 0;
    const pct = isUnlimited ? 100 : isUnavailable ? 0 : Math.min(100, (used / limit) * 100);

    let barColor = "bg-green-500";
    if (!isUnlimited && !isUnavailable) {
        const remaining = limit - used;
        const ratio = remaining / limit;
        if (ratio <= 0) barColor = "bg-red-500";
        else if (ratio <= 0.5) barColor = "bg-yellow-500";
    }

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{feature}</span>
                <span className="text-muted-foreground text-xs">
                    {isUnavailable ? "Not available" : isUnlimited ? `${used} used · Unlimited` : `${used} / ${limit} used`}
                </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isUnavailable ? 'bg-muted-foreground/20' : isUnlimited ? 'bg-green-500' : barColor}`}
                    style={{ width: `${isUnavailable ? 100 : isUnlimited ? 100 : pct}%`, opacity: isUnavailable ? 0.3 : 1 }}
                />
            </div>
        </div>
    );
}

export default function SubscriptionPage() {
    const { user } = useAuth();
    const { plan, usage, remaining } = useSubscription();
    const router = useRouter();

    const planInfo = PLAN_DISPLAY[plan];
    const limits = PLAN_LIMITS[plan];

    const handleUpgrade = () => {
        router.push("/subscribe?upgrade=true");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <CreditCard className="h-7 w-7 text-primary" />
                    Subscription
                </h1>
                <p className="text-muted-foreground">Manage your plan, usage, and billing.</p>
            </div>

            {/* Current Plan Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                Current Plan
                                <span className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full bg-primary/10 ${planInfo.color}`}>
                                    <Zap className="h-3.5 w-3.5" />
                                    {planInfo.label}
                                </span>
                            </CardTitle>
                            <CardDescription className="mt-1">
                                {planInfo.price} · Billed monthly
                            </CardDescription>
                        </div>
                        {plan !== 'pro' && (
                            <Button onClick={handleUpgrade} className="gap-2">
                                <ArrowUpRight className="h-4 w-4" />
                                Upgrade Plan
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Plan Features */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        {(Object.keys(FEATURE_LABELS) as FeatureKey[]).map((key) => {
                            const limit = limits[key];
                            const rem = remaining[key];
                            return (
                                <div key={key} className="rounded-lg border p-3 text-center">
                                    <p className="text-2xl font-bold">
                                        {limit === -1 ? "∞" : limit === 0 ? "—" : rem}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {FEATURE_LABELS[key]}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {limit === -1 ? "unlimited" : limit === 0 ? "not available" : `of ${limit} remaining`}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Usage Bars */}
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            This Month&apos;s Usage
                        </p>
                        {(Object.keys(FEATURE_LABELS) as FeatureKey[]).map((key) => (
                            <UsageBar
                                key={key}
                                feature={FEATURE_LABELS[key]}
                                used={usage[key]}
                                limit={limits[key]}
                            />
                        ))}
                    </div>

                    {/* Extra info */}
                    <div className="mt-4 p-3 rounded-lg bg-muted/40 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {limits.live_scraping ? (
                                <><Check className="h-4 w-4 text-green-500" /> Live price scraping enabled</>
                            ) : (
                                <><span className="h-4 w-4 text-red-400">✕</span> Live price scraping not available</>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Plan Comparison */}
            {plan !== 'pro' && (
                <Card className="border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-base">Upgrade for more</CardTitle>
                        <CardDescription>Get unlimited access and premium features</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {(['starter', 'growth', 'pro'] as PlanName[]).map((p) => {
                                const info = PLAN_DISPLAY[p];
                                const isCurrentPlan = plan === p;
                                return (
                                    <div
                                        key={p}
                                        className={`rounded-lg border p-4 ${isCurrentPlan ? 'border-primary bg-primary/5' : 'hover:border-primary/50 transition-colors'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`font-bold ${info.color}`}>{info.label}</span>
                                            <span className="text-sm font-semibold">{info.price}</span>
                                        </div>
                                        <ul className="space-y-1 text-xs text-muted-foreground">
                                            <li className="flex items-center gap-1.5">
                                                <Check className="h-3 w-3 text-primary flex-shrink-0" />
                                                {PLAN_LIMITS[p].dish_analyses === -1 ? 'Unlimited' : PLAN_LIMITS[p].dish_analyses} dish analyses
                                            </li>
                                            <li className="flex items-center gap-1.5">
                                                <Check className="h-3 w-3 text-primary flex-shrink-0" />
                                                {PLAN_LIMITS[p].procurement_plans === -1 ? 'Unlimited' : PLAN_LIMITS[p].procurement_plans} procurement plans
                                            </li>
                                            <li className="flex items-center gap-1.5">
                                                <Check className="h-3 w-3 text-primary flex-shrink-0" />
                                                {PLAN_LIMITS[p].marketing_generations === -1 ? 'Unlimited' : PLAN_LIMITS[p].marketing_generations} marketing
                                            </li>
                                            <li className="flex items-center gap-1.5">
                                                <Check className="h-3 w-3 text-primary flex-shrink-0" />
                                                {PLAN_LIMITS[p].video_reels === 0 ? 'No' : PLAN_LIMITS[p].video_reels} video reels
                                            </li>
                                        </ul>
                                        {isCurrentPlan ? (
                                            <div className="mt-3 text-center text-xs font-semibold text-primary">Current Plan</div>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full mt-3 text-xs"
                                                onClick={handleUpgrade}
                                            >
                                                {(plan === 'starter' && (p === 'growth' || p === 'pro')) || (plan === 'growth' && p === 'pro') ? 'Upgrade' : 'Switch'}
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
