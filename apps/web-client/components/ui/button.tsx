import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-emerald-500 text-white hover:bg-emerald-600 border border-transparent": variant === "default",
            "bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-500": variant === "outline",
            "bg-transparent border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50": variant === "ghost",
            "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20": variant === "destructive",
          },
          {
            "text-xs px-2.5 py-1": size === "sm",
            "text-sm px-3 py-1.5": size === "md",
            "text-base px-4 py-2": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
