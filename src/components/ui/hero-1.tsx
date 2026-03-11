import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Leaf, ArrowRightIcon } from "lucide-react";
import { LogoCloud } from "@/components/ui/logo-cloud-3";

interface HeroSectionProps {
    onGetStarted?: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
    return (
        <section className="mx-auto w-full min-h-[calc(100vh-3.5rem)]">
            {/* Top radial gradient shade */}
            <div
                aria-hidden="true"
                className="absolute inset-0 isolate hidden overflow-hidden lg:block pointer-events-none"
            >
                <div
                    className="absolute inset-0 -top-14 isolate -z-10"
                    style={{
                        background: 'radial-gradient(35% 80% at 49% 0%, rgba(47, 93, 70, 0.08), transparent)',
                    }}
                />
            </div>

            {/* Vertical faded borders */}
            <div
                aria-hidden="true"
                className="absolute inset-0 mx-auto hidden w-full lg:block pointer-events-none"
            >
                <div
                    className="absolute inset-y-0 left-0 z-10 h-full w-px bg-foreground/15"
                    style={{
                        maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                    }}
                />
                <div
                    className="absolute inset-y-0 right-0 z-10 h-full w-px bg-foreground/15"
                    style={{
                        maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                    }}
                />
            </div>

            {/* Main content */}
            <div className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-5 px-4">
                {/* Inner vertical faded borders */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 w-full h-full overflow-hidden pointer-events-none"
                >
                    <div
                        className="absolute inset-y-0 left-4 w-px md:left-8"
                        style={{
                            background: 'linear-gradient(to bottom, transparent, var(--border), var(--border))',
                        }}
                    />
                    <div
                        className="absolute inset-y-0 right-4 w-px md:right-8"
                        style={{
                            background: 'linear-gradient(to bottom, transparent, var(--border), var(--border))',
                        }}
                    />
                    <div
                        className="absolute inset-y-0 left-8 w-px md:left-12 opacity-50"
                        style={{
                            background: 'linear-gradient(to bottom, transparent, var(--border), var(--border))',
                        }}
                    />
                    <div
                        className="absolute inset-y-0 right-8 w-px md:right-12 opacity-50"
                        style={{
                            background: 'linear-gradient(to bottom, transparent, var(--border), var(--border))',
                        }}
                    />
                </div>

                <a
                    className={cn(
                        "group mx-auto flex w-fit items-center gap-3 rounded-full border bg-card px-3 py-1 shadow",
                        "animate-in fade-in slide-in-from-bottom-10 fill-mode-backwards transition-all delay-500 duration-500 ease-out"
                    )}
                    href="#form"
                >
                    <Leaf className="h-3 w-3 text-primary" />
                    <span className="text-xs">AI-powered menu transformation!</span>
                    <span className="block h-5 border-l" />
                    <ArrowRightIcon className="h-3 w-3 duration-150 ease-out group-hover:translate-x-1" />
                </a>

                <h1
                    className={cn(
                        "animate-in fade-in slide-in-from-bottom-10 text-center text-4xl tracking-tight fill-mode-backwards delay-100 duration-500 ease-out md:text-5xl lg:text-6xl",
                    )}
                    style={{ textWrap: 'balance' }}
                >
                    Transform Your Menu. <br /> Preserve the Taste.
                </h1>

                <p
                    className="animate-in fade-in slide-in-from-bottom-10 mx-auto max-w-md text-center text-base text-foreground/80 tracking-wider fill-mode-backwards delay-200 duration-500 ease-out sm:text-lg md:text-xl"
                >
                    AI-powered plant-based alternatives <br /> with validated nutrition & marketing
                </p>

                <div className="animate-in fade-in slide-in-from-bottom-10 flex flex-row flex-wrap items-center justify-center gap-3 fill-mode-backwards pt-2 delay-300 duration-500 ease-out">
                    <Button className="rounded-full" size="lg" variant="secondary" asChild>
                        <a href="#how-it-works">
                            <Leaf className="h-4 w-4 mr-2" />
                            Learn More
                        </a>
                    </Button>
                    <Button className="rounded-full" size="lg" onClick={onGetStarted}>
                        Get Started
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </div>
        </section>
    );
}

export function LogosSection() {
    return (
        <section className="relative space-y-4 border-t pt-6 pb-10">
            <h2 className="text-center font-medium text-lg text-muted-foreground tracking-tight md:text-xl">
                Trusted by <span className="text-foreground">200+ cafés</span> worldwide
            </h2>
            <div className="relative z-10 mx-auto max-w-4xl">
                <LogoCloud logos={logos} />
            </div>
        </section>
    );
}

const logos = [
    {
        src: "https://storage.efferd.com/logo/vercel-wordmark.svg",
        alt: "Vercel",
    },
    {
        src: "https://storage.efferd.com/logo/supabase-wordmark.svg",
        alt: "Supabase",
    },
    {
        src: "https://storage.efferd.com/logo/openai-wordmark.svg",
        alt: "OpenAI",
    },
    {
        src: "https://storage.efferd.com/logo/github-wordmark.svg",
        alt: "GitHub",
    },
    {
        src: "https://storage.efferd.com/logo/nvidia-wordmark.svg",
        alt: "Nvidia",
    },
    {
        src: "https://storage.efferd.com/logo/clerk-wordmark.svg",
        alt: "Clerk",
    },
];
