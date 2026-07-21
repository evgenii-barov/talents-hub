import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function AuthField({ className, id, label, ...props }: AuthFieldProps) {
  return (
    <label htmlFor={id} className="block font-inter text-[13px] font-semibold text-[var(--color-ink)]">
      {label}
      <input id={id} className={cn("mt-2 h-[42px] w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm font-normal text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100", className)} {...props} />
    </label>
  );
}
