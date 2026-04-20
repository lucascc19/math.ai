import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-primary-95 text-primary-30",
  secondary: "bg-secondary-95 text-secondary-40",
  tertiary: "bg-tertiary-90 text-tertiary-30"
} as const;

export function Badge({
  children,
  variant = "primary",
  className
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-fit w-fit rounded-full px-3 py-1 text-xs font-bold tracking-[0.08em]",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
