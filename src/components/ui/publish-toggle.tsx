"use client"

import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

export function PublishToggle({
    published,
    onChange,
    className
}: {
    published: boolean
    onChange: (v: boolean) => void
    className?: string
}) {
    return (
        <div
            className={cn(
                "flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300 shadow-sm backdrop-blur-md",
                published
                    ? "bg-emerald-500/90 border border-emerald-400/50"
                    : "bg-black/60 border border-white/10",
                className
            )}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onChange(!published)
            }}
            role="button"
            tabIndex={0}
            title={published ? "Published" : "Draft"}
        >
            <div className="relative flex items-center justify-between w-full h-full px-1">
                {/* Background icons */}
                <EyeOff className={cn("w-3.5 h-3.5 transition-colors z-0", published ? "text-emerald-100" : "opacity-0")} />
                <Eye className={cn("w-3.5 h-3.5 transition-colors z-0", published ? "opacity-0" : "text-white/50")} />

                {/* Sliding thumb */}
                <div
                    className={cn(
                        "absolute left-0 flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300 z-10",
                        published
                            ? "transform translate-x-[32px] bg-white shadow-sm"
                            : "transform translate-x-0 bg-zinc-600 shadow-sm"
                    )}
                >
                    {published ? (
                        <Eye className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                    ) : (
                        <EyeOff className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    )}
                </div>
            </div>
        </div>
    )
}
