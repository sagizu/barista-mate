import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#2a1d18] text-[#EAE0D5]",
        secondary:
          "border border-[#3E2C22] bg-[#15100d]/80 text-[#E6D2B5]",
        success:
          "border border-emerald-800/50 bg-emerald-900/30 text-emerald-200",
        warning:
          "border border-amber-700/50 bg-amber-900/30 text-amber-200",
        destructive:
          "border border-red-800/50 bg-red-900/30 text-red-200",
        outline: "border border-[#3E2C22] text-[#EAE0D5]",
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
