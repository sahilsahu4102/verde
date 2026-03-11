'use client';

import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { Pricing } from '@/components/ui/pricing';
import { Logo } from '@/components/app/logo';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

const verdePlans = [
    {
        name: "STARTER",
        price: "499",
        yearlyPrice: "399",
        period: "per month",
        features: [
            "Unlimited dish analysis",
            "AI reformulation & nutrition",
            "10 procurement plans/month",
            "5 marketing generations/month",
            "Community support",
        ],
        description: "Perfect for small cafés starting their plant-based journey",
        buttonText: "Get Started",
        href: "#",
        isPopular: false,
        planId: process.env.NEXT_PUBLIC_RAZORPAY_STARTER_PLAN_ID || "",
    },
    {
        name: "GROWTH",
        price: "999",
        yearlyPrice: "799",
        period: "per month",
        features: [
            "Everything in Starter",
            "Unlimited procurement plans",
            "Unlimited marketing content",
            "3 AI video reels/month",
            "Live price scraping",
            "Priority email support",
        ],
        description: "Ideal for growing restaurants scaling their plant-based menu",
        buttonText: "Get Started",
        href: "#",
        isPopular: true,
        planId: process.env.NEXT_PUBLIC_RAZORPAY_GROWTH_PLAN_ID || "",
    },
    {
        name: "PRO",
        price: "2499",
        yearlyPrice: "1999",
        period: "per month",
        features: [
            "Everything in Growth",
            "10 AI video reels/month",
            "Dedicated account manager",
            "API access",
            "Custom integrations",
            "Priority support & SLA",
        ],
        description: "For restaurant chains with advanced needs",
        buttonText: "Contact Sales",
        href: "#",
        isPopular: false,
        planId: process.env.NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID || "",
    },
];

function SubscribeContent() {
    const { user, isLoading: authLoading, signOut } = useAuth();
    const { plan, isLoading: subLoading } = useSubscription();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isUpgrade = searchParams.get('upgrade') === 'true';

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!authLoading && !subLoading && user && plan !== 'free' && !isUpgrade) {
            router.push('/dashboard');
        }
    }, [user, plan, authLoading, subLoading, router, isUpgrade]);

    if (authLoading || subLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            <header className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8" />
                    <span className="text-xl font-bold text-primary tracking-wider">VERDE</span>
                </div>
                <div className="flex items-center gap-3">
                    {isUpgrade && (
                        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    )}
                    <span className="text-sm text-muted-foreground hidden sm:block">
                        {user.email}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => signOut()}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 pt-8 pb-20">
                <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                        🌱 Choose a plan to get started
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                        {isUpgrade ? 'Upgrade Your Plan' : 'You\u0027re almost there!'}
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        {isUpgrade
                            ? 'Choose a higher plan to unlock more features and increase your limits.'
                            : 'Select a subscription plan to unlock Verde\u0027s AI-powered plant-based menu transformation tools.'}
                    </p>
                </div>

                <Pricing
                    plans={verdePlans}
                    title=""
                    description=""
                />
            </div>
        </div>
    );
}

export default function SubscribePage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <SubscribeContent />
        </Suspense>
    );
}
