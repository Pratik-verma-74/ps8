import React from "react";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function NeonButton({ children, className, variant = "primary", ...props }: NeonButtonProps) {
  const baseStyles = "px-6 py-3 rounded-lg font-primary uppercase tracking-widest text-sm transition-all duration-300 relative overflow-hidden";
  
  const variants = {
    primary: "bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/50 hover:bg-[#00D9FF]/20 hover:shadow-[0_0_20px_rgba(0,217,255,0.4)]",
    secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/30",
    danger: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/50 hover:bg-[#EF4444]/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], className)}
      {...(props as any)}
    >
      <span className="relative z-10 font-bold">{children}</span>
    </motion.button>
  );
}
