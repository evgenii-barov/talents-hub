import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white",
        className,
      )}
    >
      <Sparkles size={16} />
    </span>
  );
}
