import { cn } from "@/lib/utils";

export function Card({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={cn("h-fit soft-card p-5 md:p-6", className)}>{children}</section>;
}
