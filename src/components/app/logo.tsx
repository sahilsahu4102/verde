import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
  [key: string]: any;
}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <div className={cn("relative overflow-hidden flex-shrink-0", className)} {...props}>
      <Image
        src="/logo.png"
        alt="Verde Logo"
        width={96}
        height={96}
        className="absolute inset-[-25%] w-[150%] h-[150%] object-contain"
      />
    </div>
  );
}
