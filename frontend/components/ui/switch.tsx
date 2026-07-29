"use client";

import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type SwitchProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "onClick" | "value"
> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function Switch({
  checked,
  className,
  disabled,
  onCheckedChange,
  ...props
}: SwitchProps) {
  return (
    <button
      data-slot="switch"
      data-checked={checked || undefined}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-neutral-300 p-0.5",
        "transition-colors duration-150 motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
        "data-checked:bg-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    >
      <span
        data-slot="switch-thumb"
        aria-hidden="true"
        className={cn(
          "block size-5 rounded-full bg-white shadow-sm transition-transform duration-150",
          "motion-reduce:transition-none",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

export { Switch };
