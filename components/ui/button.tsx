"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "pop";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900/30",
          size === "sm" && "h-8 px-4 text-xs",
          size === "md" && "h-10 px-5 text-sm",
          size === "lg" && "h-12 px-7 text-base",
          variant === "primary" && "bg-stone-900 text-white hover:bg-stone-800 shadow-sm",
          variant === "pop"     && "bg-amber-800 text-white hover:bg-amber-900 shadow-sm",
          variant === "outline" && "border border-stone-300 bg-white hover:border-stone-700 text-stone-900",
          variant === "ghost"   && "text-stone-600 hover:bg-stone-100",
          className,
        )}
        {...rest}
      />
    );
  },
);
Button.displayName = "Button";
