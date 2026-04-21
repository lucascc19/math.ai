"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);

  if (!context) {
    throw new Error("DropdownMenu components must be used inside DropdownMenu");
  }

  return context;
}

function DropdownMenu({
  open: controlledOpen,
  onOpenChange,
  children
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange]
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={rootRef} className="relative inline-flex">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({
  asChild = false,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  children: React.ReactNode;
}) {
  const { open, setOpen } = useDropdownMenu();

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      className?: string;
      onClick?: React.MouseEventHandler;
      "aria-expanded"?: boolean;
    }>;

    return React.cloneElement(child, {
      "aria-expanded": open,
      className: cn(child.props.className, className),
      onClick: (event: React.MouseEvent) => {
        child.props.onClick?.(event);
        setOpen(!open);
      }
    });
  }

  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      className={className}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({
  align = "center",
  className,
  children
}: {
  align?: "start" | "center" | "end";
  className?: string;
  children: React.ReactNode;
}) {
  const { open } = useDropdownMenu();

  if (!open) {
    return null;
  }

  return (
    <div
      role="menu"
      className={cn(
        "absolute top-full z-50 mt-2 grid min-w-[180px] gap-1 rounded-2xl border border-black/10 bg-white p-2 shadow-soft dark:border-white/10 dark:bg-neutral-20",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && "right-0",
        className
      )}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({
  asChild = false,
  className,
  disabled,
  children,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  children: React.ReactNode;
}) {
  const { setOpen } = useDropdownMenu();

  const itemClassName = cn(
    "focus-ring inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-10 hover:bg-neutral-95 disabled:opacity-50 dark:text-neutral-95 dark:hover:bg-neutral-30/60",
    className
  );

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      className?: string;
      onClick?: React.MouseEventHandler;
      role?: string;
    }>;

    return React.cloneElement(child, {
      role: "menuitem",
      className: cn(itemClassName, child.props.className),
      onClick: (event: React.MouseEvent) => {
        child.props.onClick?.(event);
        setOpen(false);
      }
    });
  }

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={itemClassName}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          setOpen(false);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger };
