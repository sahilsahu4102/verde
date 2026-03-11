import { cn } from "@/lib/utils";
import {
    Leaf,
    MessageSquareText,
    Sparkles,
    FileText,
    Video,
    BarChart3,
    Globe,
    Users,
} from "lucide-react";

export function FeaturesSectionWithHoverEffects() {
    const features = [
        {
            title: "AI Dish Analysis",
            description:
                "Describe any dish and get instant AI-powered ingredient breakdown and nutritional insights.",
            icon: <MessageSquareText />,
        },
        {
            title: "Plant-Based Alternatives",
            description:
                "Get smart, validated plant-based substitutes that preserve the original taste and texture.",
            icon: <Leaf />,
        },
        {
            title: "Nutritional Validation",
            description:
                "Every alternative comes with detailed macro and micro nutrient comparisons.",
            icon: <BarChart3 />,
        },
        {
            title: "Marketing Content",
            description:
                "Auto-generate captions, descriptions, and social media posts for your transformed dishes.",
            icon: <FileText />,
        },
        {
            title: "Video Reel Generation",
            description:
                "Create stunning, cinematic video reels of your dishes with one click — ready for Instagram.",
            icon: <Video />,
        },
        {
            title: "About Consumer",
            description:
                "Sprout — our consumer app where users discover your plant-based café, browse menus, place orders, and leave reviews.",
            icon: <Users />,
        },
        {
            title: "Sustainability Metrics",
            description:
                "Track your environmental impact with carbon footprint and water usage comparisons.",
            icon: <Globe />,
        },
        {
            title: "AI-Powered Everything",
            description:
                "Powered by cutting-edge AI models for dish recognition, nutrition, and content generation.",
            icon: <Sparkles />,
        },
    ];
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
            {features.map((feature, index) => (
                <Feature key={feature.title} {...feature} index={index} />
            ))}
        </div>
    );
}

const Feature = ({
    title,
    description,
    icon,
    index,
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
    index: number;
}) => {
    return (
        <div
            className={cn(
                "flex flex-col lg:border-r py-10 relative group/feature dark:border-neutral-800",
                (index === 0 || index === 4) && "lg:border-l dark:border-neutral-800",
                index < 4 && "lg:border-b dark:border-neutral-800"
            )}
        >
            {index < 4 && (
                <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
            )}
            {index >= 4 && (
                <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
            )}
            <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
                {icon}
            </div>
            <div className="text-lg font-bold mb-2 relative z-10 px-10">
                <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-primary transition-all duration-200 origin-center" />
                <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
                    {title}
                </span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
                {description}
            </p>
        </div>
    );
};
