import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1 px-2 rounded-xs text-xs font-medium  whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground hover:bg-muted/80",
        primary: "bg-primary text-primary-foreground hover:bg-primary/80",
        ghost: "text-foreground hover:bg-muted hover:text-foreground",
        outline: "border border-border hover:bg-input/50 hover:text-foreground",
        accent: "bg-accent text-accent-foreground hover:bg-accent/80",
        row: "text-foreground hover:bg-muted rounded-none",
      },
      size: {
        default: "py-[5px]",
        none: "px-1",
        sm: "h-9",
        lg: "h-11",
        icon: "size-7 [&_svg:not([class*='size-'])]:size-4 [&_svg]:stroke-[1.5]",
        "icon-xs": "size-5 rounded-xs [&_svg:not([class*='size-'])]:size-3 [&_svg]:stroke-[1.5]",
        "icon-sm": "size-6 rounded-xs [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:stroke-[1.5]",
        "icon-lg": "size-7 [&_svg:not([class*='size-'])]:size-4.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonProps = React.ComponentProps<typeof ButtonPrimitive> &
  VariantProps<typeof buttonVariants>

function Button({ ref, className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

Button.displayName = "Button"

export default Button
