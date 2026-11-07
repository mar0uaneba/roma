import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative isolate inline-flex items-center justify-center gap-2 overflow-hidden rounded-sm text-sm font-medium tracking-wide",
    "transition-[color,background-color,border-color,box-shadow,transform] duration-300 active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    // Light sweep on hover.
    "before:pointer-events-none before:absolute before:inset-y-0 before:-start-1/2 before:-z-10 before:w-1/2 before:-skew-x-12",
    "before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:opacity-0",
    "motion-safe:before:transition-[inset-inline-start,opacity] motion-safe:before:duration-700 hover:before:start-[120%] hover:before:opacity-100",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-foreground shadow-[0_12px_30px_-12px_rgba(197,22,29,0.6)] hover:bg-[#9d1016] hover:shadow-[0_18px_40px_-14px_rgba(197,22,29,0.75)]",
        ink: "bg-ink text-background hover:bg-black hover:shadow-[0_18px_40px_-18px_rgba(14,13,12,0.7)]",
        outline: "border border-ink/20 bg-transparent hover:border-ink hover:bg-ink hover:text-background",
        light: "border border-background/50 bg-transparent text-background hover:bg-background hover:text-ink",
        ghost: "hover:bg-ink/5",
      },
      size: {
        default: "h-11 px-5",
        lg: "h-12 px-6",
        sm: "h-9 px-3.5 text-xs tracking-wide",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
