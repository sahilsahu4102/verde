"use client";

import { cn } from "@/lib/utils";
import { MessageSquareText, Leaf, Sparkles } from "lucide-react";
import type React from "react";

interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> { }

interface StepCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    benefits: string[];
}

const StepCard: React.FC<StepCardProps> = ({
    icon,
    title,
    description,
    benefits,
}) => (
    <div
        className={cn(
            "relative rounded-2xl border bg-card p-6 text-card-foreground transition-all duration-300 ease-in-out",
            "hover:scale-105 hover:shadow-lg hover:border-primary/50 hover:bg-muted"
        )}
    >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-primary">
            {icon}
        </div>
        <h3 className="mb-2 text-xl font-semibold">{title}</h3>
        <p className="mb-6 text-muted-foreground">{description}</p>
        <ul className="space-y-3">
            {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                    <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                    </div>
                    <span className="text-muted-foreground">{benefit}</span>
                </li>
            ))}
        </ul>
    </div>
);

export const HowItWorks: React.FC<HowItWorksProps> = ({
    className,
    ...props
}) => {
    const stepsData = [
        {
            icon: <MessageSquareText className="h-6 w-6" />,
            title: "Describe Your Dish",
            description:
                "Simply describe any dish on your menu — ingredients, style, or cuisine. Our AI instantly understands and analyzes it.",
            benefits: [
                "Works with any dish or cuisine",
                "Natural language input",
                "No photos or uploads needed",
            ],
        },
        {
            icon: <Leaf className="h-6 w-6" />,
            title: "Get Plant-Based Alternatives",
            description:
                "Verde generates validated plant-based substitutes that preserve the original taste, texture, and presentation.",
            benefits: [
                "Taste-matched replacements",
                "Full nutritional comparison",
                "Sustainability impact metrics",
            ],
        },
        {
            icon: <Sparkles className="h-6 w-6" />,
            title: "Launch & Market",
            description:
                "Auto-generate marketing copy, social media captions, and cinematic video reels — ready to post in seconds.",
            benefits: [
                "Instagram-ready video reels",
                "AI-written captions & descriptions",
                "One-click export to social media",
            ],
        },
    ];

    return (
        <section
            id="how-it-works"
            className={cn("w-full py-16 sm:py-24", className)}
            {...props}
        >
            <div className="container mx-auto px-4">
                <div className="mx-auto mb-16 max-w-4xl text-center">
                    <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        How it works
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        From description to plant-based menu in three simple steps — powered by cutting-edge AI
                    </p>
                </div>

                <div className="relative mx-auto mb-8 w-full max-w-4xl">
                    <div
                        aria-hidden="true"
                        className="absolute left-[16.6667%] top-1/2 h-0.5 w-[66.6667%] -translate-y-1/2 bg-border/50"
                    ></div>
                    <div className="relative grid grid-cols-3">
                        {stepsData.map((_, index) => (
                            <div
                                key={index}
                                className="flex h-8 w-8 items-center justify-center justify-self-center rounded-full bg-muted/50 backdrop-blur-sm font-semibold text-foreground ring-4 ring-background/10"
                            >
                                {index + 1}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
                    {stepsData.map((step, index) => (
                        <StepCard
                            key={index}
                            icon={step.icon}
                            title={step.title}
                            description={step.description}
                            benefits={step.benefits}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
