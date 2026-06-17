import { Input as ShadInput } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type InputProps = React.ComponentProps<typeof ShadInput>

const Input = ({ ref, className, ...props }: InputProps) => (
  <ShadInput ref={ref} className={cn("rounded-xs", className)} {...props} />
)

Input.displayName = "Input"

export { Input }
export default Input
