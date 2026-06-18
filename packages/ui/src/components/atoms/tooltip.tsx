import {
  Tooltip as ShadTooltip,
  TooltipContent as ShadTooltipContent,
  TooltipProvider as ShadTooltipProvider,
  TooltipTrigger as ShadTooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type TooltipProviderProps = React.ComponentProps<typeof ShadTooltipProvider>

const TooltipProvider = (props: TooltipProviderProps) => <ShadTooltipProvider {...props} />

TooltipProvider.displayName = "TooltipProvider"

export type TooltipProps = React.ComponentProps<typeof ShadTooltip>

const Tooltip = (props: TooltipProps) => <ShadTooltip {...props} />

Tooltip.displayName = "Tooltip"

export type TooltipTriggerProps = React.ComponentProps<typeof ShadTooltipTrigger>

const TooltipTrigger = (props: TooltipTriggerProps) => <ShadTooltipTrigger {...props} />

TooltipTrigger.displayName = "TooltipTrigger"

export type TooltipContentProps = React.ComponentProps<typeof ShadTooltipContent>

const TooltipContent = ({ className, ...props }: TooltipContentProps) => (
  <ShadTooltipContent className={cn("rounded-xs", className)} {...props} />
)

TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
export default Tooltip
