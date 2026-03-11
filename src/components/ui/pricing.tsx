"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface PricingPlan {
    name: string;
    price: string;
    yearlyPrice: string;
    period: string;
    features: string[];
    description: string;
    buttonText: string;
    href: string;
    isPopular: boolean;
    planId?: string;
}

interface PricingProps {
    plans: PricingPlan[];
    title?: string;
    description?: string;
}

export function Pricing({
    plans,
    title = "Simple, Transparent Pricing",
    description = "Choose the plan that works for you\nAll plans include access to our platform, lead generation tools, and dedicated support.",
}: PricingProps) {
    const [isMonthly, setIsMonthly] = useState(true);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const switchRef = useRef<HTMLButtonElement>(null);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [creditInfo, setCreditInfo] = useState<{ credit: number; daysRemaining: number } | null>(null);
    const { user } = useAuth();
    const { plan: currentPlan, refreshSubscription } = useSubscription();

    // Fetch proration credit preview when user has a paid plan
    useEffect(() => {
        if (!user || currentPlan === 'free') {
            setCreditInfo(null);
            return;
        }
        fetch(`/api/subscription/upgrade?userId=${user.id}&targetPlan=growth`)
            .then(r => r.json())
            .then(data => {
                if (data.credit > 0) {
                    setCreditInfo({ credit: data.credit, daysRemaining: data.daysRemaining });
                }
            })
            .catch(() => { });
    }, [user, currentPlan]);

    const handleToggle = (checked: boolean) => {
        setIsMonthly(!checked);
        if (checked && switchRef.current) {
            const rect = switchRef.current.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            confetti({
                particleCount: 50,
                spread: 60,
                origin: {
                    x: x / window.innerWidth,
                    y: y / window.innerHeight,
                },
                colors: [
                    "hsl(var(--primary))",
                    "hsl(var(--accent))",
                    "hsl(var(--secondary))",
                    "hsl(var(--muted))",
                ],
                ticks: 200,
                gravity: 1.2,
                decay: 0.94,
                startVelocity: 30,
                shapes: ["circle"],
            });
        }
    };

    const handleSubscribe = async (plan: PricingPlan) => {
        if (!user) {
            document.getElementById("form")?.scrollIntoView({ behavior: "smooth" });
            return;
        }

        if (!plan.planId) return;

        const planKey = getPlanKey(plan.name);
        const isUpgrade = currentPlan !== 'free' && currentPlan !== planKey;

        setLoadingPlan(plan.name);

        try {
            // Load Razorpay script if not loaded
            if (!window.Razorpay) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement("script");
                    script.src = "https://checkout.razorpay.com/v1/checkout.js";
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error("Failed to load Razorpay"));
                    document.head.appendChild(script);
                });
            }

            let subscriptionId: string;

            if (isUpgrade) {
                // Use upgrade API — cancels old sub, creates new with proration tracking
                const res = await fetch("/api/subscription/upgrade", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user.id,
                        targetPlanId: plan.planId,
                        targetPlan: planKey,
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                subscriptionId = data.subscriptionId;
            } else {
                // New subscription
                const res = await fetch("/api/subscription/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        planId: plan.planId,
                        userId: user.id,
                        email: user.email,
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                subscriptionId = data.subscriptionId;
            }

            // Open Razorpay checkout modal
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                subscription_id: subscriptionId,
                name: "VERDE",
                description: isUpgrade
                    ? `Upgrade to ${plan.name} Plan`
                    : `${plan.name} Plan - Monthly Subscription`,
                handler: async function (response: any) {
                    const verifyRes = await fetch("/api/subscription/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_signature: response.razorpay_signature,
                            userId: user.id,
                        }),
                    });

                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                        await refreshSubscription();
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 },
                        });
                    }
                    setLoadingPlan(null);
                },
                prefill: {
                    email: user.email,
                },
                theme: {
                    color: "#22c55e",
                },
                modal: {
                    ondismiss: () => setLoadingPlan(null),
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error: any) {
            console.error("Subscription error:", error);
            setLoadingPlan(null);
        }
    };

    const getPlanKey = (planName: string) => {
        return planName.toLowerCase() as "starter" | "growth" | "pro";
    };

    return (
        <div className="container py-20">
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    {title}
                </h2>
                <p className="text-muted-foreground text-lg whitespace-pre-line">
                    {description}
                </p>
            </div>

            <div className="flex justify-center mb-10">
                <label className="relative inline-flex items-center cursor-pointer">
                    <Label>
                        <Switch
                            ref={switchRef as any}
                            checked={!isMonthly}
                            onCheckedChange={handleToggle}
                            className="relative"
                        />
                    </Label>
                </label>
                <span className="ml-2 font-semibold">
                    Annual billing <span className="text-primary">(Save 20%)</span>
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 sm:2 gap-4">
                {plans.map((plan, index) => {
                    const planKey = getPlanKey(plan.name);
                    const isCurrentPlan = currentPlan === planKey;

                    const planOrder = { free: 0, starter: 1, growth: 2, pro: 3 } as const;
                    const currentOrder = planOrder[currentPlan as keyof typeof planOrder] || 0;
                    const thisPlanOrder = planOrder[planKey as keyof typeof planOrder] || 0;
                    const isUpgradePlan = currentPlan !== 'free' && thisPlanOrder > currentOrder;
                    const isDowngradePlan = currentPlan !== 'free' && thisPlanOrder < currentOrder;

                    return (
                        <motion.div
                            key={index}
                            initial={{ y: 50, opacity: 1 }}
                            whileInView={
                                isDesktop
                                    ? {
                                        y: plan.isPopular ? -20 : 0,
                                        opacity: 1,
                                        x: index === 2 ? -30 : index === 0 ? 30 : 0,
                                        scale: index === 0 || index === 2 ? 0.94 : 1.0,
                                    }
                                    : {}
                            }
                            viewport={{ once: true }}
                            transition={{
                                duration: 1.6,
                                type: "spring",
                                stiffness: 100,
                                damping: 30,
                                delay: 0.4,
                                opacity: { duration: 0.5 },
                            }}
                            className={cn(
                                `rounded-2xl border-[1px] p-6 bg-background text-center lg:flex lg:flex-col lg:justify-center relative`,
                                plan.isPopular ? "border-primary border-2" : "border-border",
                                "flex flex-col",
                                !plan.isPopular && "mt-5",
                                index === 0 || index === 2
                                    ? "z-0 transform translate-x-0 translate-y-0 -translate-z-[50px] rotate-y-[10deg]"
                                    : "z-10",
                                index === 0 && "origin-right",
                                index === 2 && "origin-left"
                            )}
                        >
                            {plan.isPopular && (
                                <div className="absolute top-0 right-0 bg-primary py-0.5 px-2 rounded-bl-xl rounded-tr-xl flex items-center">
                                    <Star className="text-primary-foreground h-4 w-4 fill-current" />
                                    <span className="text-primary-foreground ml-1 font-sans font-semibold">
                                        Popular
                                    </span>
                                </div>
                            )}
                            {isCurrentPlan && (
                                <div className="absolute top-0 left-0 bg-green-500 py-0.5 px-2 rounded-br-xl rounded-tl-xl flex items-center">
                                    <Check className="text-white h-4 w-4" />
                                    <span className="text-white ml-1 font-sans font-semibold text-xs">
                                        Current Plan
                                    </span>
                                </div>
                            )}
                            <div className="flex-1 flex flex-col">
                                <p className="text-base font-semibold text-muted-foreground">
                                    {plan.name}
                                </p>
                                <div className="mt-6 flex items-center justify-center gap-x-2">
                                    <span className="text-5xl font-bold tracking-tight text-foreground">
                                        <NumberFlow
                                            value={
                                                isMonthly
                                                    ? Number(plan.price)
                                                    : Number(plan.yearlyPrice)
                                            }
                                            format={{
                                                style: "currency",
                                                currency: "INR",
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            }}
                                            transformTiming={{
                                                duration: 500,
                                                easing: "ease-out",
                                            }}
                                            willChange
                                            className="font-variant-numeric: tabular-nums"
                                        />
                                    </span>
                                    {plan.period !== "Next 3 months" && (
                                        <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">
                                            / {plan.period}
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs leading-5 text-muted-foreground">
                                    {isMonthly ? "billed monthly" : "billed annually"}
                                </p>

                                <ul className="mt-5 gap-2 flex flex-col">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                            <span className="text-left">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <hr className="w-full my-4" />

                                <button
                                    onClick={() => handleSubscribe(plan)}
                                    disabled={isCurrentPlan || isDowngradePlan || loadingPlan === plan.name}
                                    className={cn(
                                        buttonVariants({
                                            variant: "outline",
                                        }),
                                        "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                                        "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-1 hover:bg-primary hover:text-primary-foreground",
                                        plan.isPopular
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-background text-foreground",
                                        (isCurrentPlan || isDowngradePlan) && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {loadingPlan === plan.name
                                        ? "Processing..."
                                        : isCurrentPlan
                                            ? "Current Plan"
                                            : isDowngradePlan
                                                ? "Current or lower"
                                                : isUpgradePlan
                                                    ? `Upgrade to ${plan.name}`
                                                    : plan.buttonText}
                                </button>
                                {isUpgradePlan && creditInfo && creditInfo.credit > 0 && (
                                    <p className="mt-2 text-xs text-green-600 dark:text-green-400 bg-green-500/10 rounded-md px-3 py-1.5 text-center">
                                        💰 ₹{creditInfo.credit} credit from your {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan ({creditInfo.daysRemaining} days remaining) will be rolled over
                                    </p>
                                )}
                                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                                    {plan.description}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
