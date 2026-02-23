"use client";

import { cn } from "@/lib/utils";

interface RolePillProps {
  label: string;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
  href?: string;
}

export default function RolePill({
  label,
  count,
  selected = false,
  onClick,
}: RolePillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium",
        "transition-all duration-150 ease-out",
        selected
          ? "bg-accent text-white border-accent shadow-sm"
          : "bg-bg-secondary border-border text-text-primary hover:bg-bg-elevated hover:border-border-hover hover:shadow-md hover:-translate-y-px"
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "text-xs tabular-nums",
            selected ? "text-white/70" : "text-text-tertiary"
          )}
        >
          {count.toLocaleString()} roles
        </span>
      )}
    </button>
  );
}
