import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "focus-ring h-14 w-full rounded-2xl border border-black/10 bg-white/90 px-4 text-neutral-10 placeholder:text-neutral-10/50",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
