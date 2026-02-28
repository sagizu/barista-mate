
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import React from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-xl border-2 border-dashed border-[#3E2C22] bg-[#1F1712]/50",
        className
      )}
    >
      <div className="mb-4">
        <Icon className="h-12 w-12 text-[#EAE0D5]/30" strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-semibold text-[#E6D2B5]">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-[#EAE0D5]/70">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
