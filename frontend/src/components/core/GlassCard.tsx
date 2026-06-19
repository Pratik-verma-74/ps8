import React from "react";
import { cn } from "../../utils/cn";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

export function GlassCard({ children, className, active = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-xl p-6 transition-all duration-300",
        active && "glass-panel-active",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
