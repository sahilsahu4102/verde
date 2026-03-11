"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from "@/components/ui/empty";
import { RefreshCw, HomeIcon } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
            <Empty>
                <EmptyHeader>
                    <EmptyTitle className="font-extrabold text-9xl">
                        Error
                    </EmptyTitle>
                    <EmptyDescription className="-mt-8 text-nowrap text-foreground/80">
                        Something went wrong while processing <br />
                        your request.
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <div className="flex gap-2">
                        <Button onClick={() => reset()}>
                            <RefreshCw className="size-4 mr-2" />
                            Try Again
                        </Button>

                        <Button asChild variant="outline">
                            <Link href="/">
                                <HomeIcon className="size-4 mr-2" />
                                Go Home
                            </Link>
                        </Button>
                    </div>
                </EmptyContent>
            </Empty>
        </div>
    );
}
