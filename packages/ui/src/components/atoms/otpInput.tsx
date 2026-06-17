import { InputOTP as ShadInputOTP } from "@/components/ui/input-otp"
import { InputOTPGroup as ShadInputOTPGroup } from "@/components/ui/input-otp"
import { InputOTPSlot as ShadInputOTPSlot } from "@/components/ui/input-otp"
import { cn } from "@/lib/utils"

export interface OtpInputProps extends Omit<React.ComponentProps<typeof ShadInputOTP>, "children" | "maxLength" | "onChange" | "render" | "value"> {
  length?: number
  value: string
  onChange: (value: string) => void
}

function OtpInput({ className, containerClassName, length = 6, value, onChange, ref, ...props }: OtpInputProps) {
  const normalizedValue = value.replace(/\D/g, "").slice(0, length)

  return (
    <ShadInputOTP
      ref={ref}
      className={className}
      containerClassName={cn("w-full", containerClassName)}
      maxLength={length}
      value={normalizedValue}
      onChange={(nextValue) => onChange(nextValue.replace(/\D/g, "").slice(0, length))}
      {...props}
    >
      <ShadInputOTPGroup className="flex w-full gap-1.5 rounded-none">
        {Array.from({ length }, (_, index) => (
          <ShadInputOTPSlot
            className="h-8 flex-1 rounded-xs border border-input bg-input/20 font-mono text-sm text-foreground first:rounded-none last:rounded-none"
            index={index}
            key={index}
          />
        ))}
      </ShadInputOTPGroup>
    </ShadInputOTP>
  )
}

OtpInput.displayName = "OtpInput"

export { OtpInput }

export default OtpInput
