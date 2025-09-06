import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-target",
  {
    variants: {
      variant: {
        default: "bg-brand text-white hover:bg-brand-hover focus-visible:ring-brand/50 focus-visible:ring-offset-ui-bg rounded-xl",
        destructive: "bg-danger text-white hover:bg-danger-hover focus-visible:ring-danger/50 focus-visible:ring-offset-ui-bg rounded-xl",
        outline: "border border-ui-line bg-white text-brand hover:bg-brand-subtle focus-visible:ring-brand/50 focus-visible:ring-offset-ui-bg rounded-xl",
        secondary: "bg-ui-surface text-text-primary hover:bg-ui-line/50 focus-visible:ring-ui-line focus-visible:ring-offset-ui-bg rounded-xl",
        ghost: "text-text-primary hover:bg-ui-surface focus-visible:ring-ui-line focus-visible:ring-offset-ui-bg rounded-xl",
        link: "text-brand underline-offset-4 hover:underline focus-visible:ring-brand/50 p-0 h-auto",
      },
      size: {
        default: "h-11 px-5 text-base",
        sm: "h-9 px-4 text-sm rounded-lg",
        lg: "h-12 px-6 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }