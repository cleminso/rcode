import { Field as ShadField } from "@/components/ui/field"
import { FieldContent as ShadFieldContent } from "@/components/ui/field"
import { FieldDescription as ShadFieldDescription } from "@/components/ui/field"
import { FieldError as ShadFieldError } from "@/components/ui/field"
import { FieldGroup as ShadFieldGroup } from "@/components/ui/field"
import { FieldLabel as ShadFieldLabel } from "@/components/ui/field"
import { FieldLegend as ShadFieldLegend } from "@/components/ui/field"
import { FieldSeparator as ShadFieldSeparator } from "@/components/ui/field"
import { FieldSet as ShadFieldSet } from "@/components/ui/field"
import { FieldTitle as ShadFieldTitle } from "@/components/ui/field"
import { cn } from "@/lib/utils"

export type FieldProps = React.ComponentProps<typeof ShadField>
export type FieldContentProps = React.ComponentProps<typeof ShadFieldContent>
export type FieldDescriptionProps = React.ComponentProps<typeof ShadFieldDescription>
export type FieldErrorProps = React.ComponentProps<typeof ShadFieldError>
export type FieldGroupProps = React.ComponentProps<typeof ShadFieldGroup>
export type FieldLabelProps = React.ComponentProps<typeof ShadFieldLabel>
export type FieldLegendProps = React.ComponentProps<typeof ShadFieldLegend>
export type FieldSeparatorProps = React.ComponentProps<typeof ShadFieldSeparator>
export type FieldSetProps = React.ComponentProps<typeof ShadFieldSet>
export type FieldTitleProps = React.ComponentProps<typeof ShadFieldTitle>

function Field({ className, ...props }: FieldProps) {
  return <ShadField className={cn("gap-1.5", className)} {...props} />
}

function FieldContent({ className, ...props }: FieldContentProps) {
  return <ShadFieldContent className={cn("gap-1", className)} {...props} />
}

function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return <ShadFieldDescription className={cn("font-mono text-xs", className)} {...props} />
}

function FieldError({ className, ...props }: FieldErrorProps) {
  return <ShadFieldError className={cn("font-mono text-xs", className)} {...props} />
}

function FieldGroup({ className, ...props }: FieldGroupProps) {
  return <ShadFieldGroup className={cn("gap-4", className)} {...props} />
}

function FieldLabel({ className, ...props }: FieldLabelProps) {
  return <ShadFieldLabel className={cn("font-mono text-xs font-medium uppercase", className)} {...props} />
}

function FieldLegend({ className, ...props }: FieldLegendProps) {
  return <ShadFieldLegend className={cn("font-mono text-xs uppercase", className)} {...props} />
}

function FieldSeparator({ className, ...props }: FieldSeparatorProps) {
  return <ShadFieldSeparator className={cn("font-mono text-xs", className)} {...props} />
}

function FieldSet({ className, ...props }: FieldSetProps) {
  return <ShadFieldSet className={cn("gap-4", className)} {...props} />
}

function FieldTitle({ className, ...props }: FieldTitleProps) {
  return <ShadFieldTitle className={cn("font-mono text-xs uppercase", className)} {...props} />
}

Field.displayName = "Field"
FieldContent.displayName = "FieldContent"
FieldDescription.displayName = "FieldDescription"
FieldError.displayName = "FieldError"
FieldGroup.displayName = "FieldGroup"
FieldLabel.displayName = "FieldLabel"
FieldLegend.displayName = "FieldLegend"
FieldSeparator.displayName = "FieldSeparator"
FieldSet.displayName = "FieldSet"
FieldTitle.displayName = "FieldTitle"

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
}

export default Field
