"use client";

import { cn } from "@/lib/utils";

interface RadialGlowBackgroundProps {
    children?: React.ReactNode;
    className?: string;
    containerClassName?: string;
}

export function RadialGlowBackground({
    children,
    className,
    containerClassName,
}: RadialGlowBackgroundProps) {
    return (
        <div className={cn("min-h-screen w-full bg-white dark:bg-[#020617] relative", containerClassName)}>
            {/* Background container - Fixed and ignores interactions */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Light Mode: Emerald Glow Background */}
                <div
                    className="absolute inset-0 dark:hidden"
                    style={{
                        backgroundImage: `radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #10b981 100%)`,
                        backgroundSize: "100% 100%",
                    }}
                />

                {/* Dark Mode: Lime Radial Glow Background */}
                <div
                    className="absolute inset-0 hidden dark:block"
                    style={{
                        backgroundImage: `radial-gradient(circle 800px at 50% -100px, rgba(132,204,22,0.15), transparent), radial-gradient(circle 600px at 50% 200px, rgba(132,204,22,0.05), transparent)`,
                    }}
                />

                {/* Grid Pattern Overlay (Subtle) */}
                <div
                    className="absolute inset-0 opacity-[0.02] dark:hidden"
                    style={{
                        backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />
                <div
                    className="absolute inset-0 opacity-[0.03] hidden dark:block"
                    style={{
                        backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            {/* Content layer */}
            <div className={cn("relative z-10 w-full", className)}>
                {children}
            </div>
        </div>
    );
}


