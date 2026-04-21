import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "focus-ring min-h-32 w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm leading-6 text-neutral-10 placeholder:text-neutral-10/50",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
