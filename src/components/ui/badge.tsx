import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-tech-bg)] text-[var(--color-tech)]",
        secondary:
          "border-transparent bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]",
        outline:
          "border-[var(--color-border)] text-[var(--color-text-secondary)]",
        tech: "border-transparent bg-[var(--color-tech-bg)] text-[var(--color-tech)]",
        life: "border-transparent bg-[var(--color-life-bg)] text-[var(--color-life)]",
        interest: "border-transparent bg-[var(--color-interest-bg)] text-[var(--color-interest)]",
        gradient: "border-transparent text-white bg-gradient-to-r from-[var(--color-tech)] to-[var(--color-interest)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
