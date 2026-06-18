import * as React from "react"

import { Textarea as ShadTextarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export type TextareaProps = React.ComponentProps<typeof ShadTextarea>

function Textarea({ ref, className, ...props }: TextareaProps) {
  return (
    <ShadTextarea
      ref={ref}
      className={cn(
        "border-input bg-input/20 text-foreground rounded-xs focus-visible:border-border focus-visible:ring-2 focus-visible:ring-ring/50",
        className
      )}
      {...props}
    />
  )
}

Textarea.displayName = "Textarea"
export { Textarea }
export default Textarea
