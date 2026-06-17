import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { formatTimestamp } from "little-timestamp"

import { cn } from "@/lib/utils"

const formattedDateVariants = cva("tabular-nums", {
  variants: {
    variant: {
      default: "text-sm text-foreground",
      muted: "text-sm text-muted-foreground",
      dim: "text-xs text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export type TDateFormat = "relative" | "short" | "long"

export interface FormattedDateProps extends VariantProps<typeof formattedDateVariants> {
  date: number | Date | string | undefined | null
  format?: TDateFormat
  fallback?: React.ReactNode
  locale?: string
  className?: string
}

function FormattedDate({
  date,
  format = "relative",
  fallback = "—",
  locale,
  variant = "default",
  className,
}: FormattedDateProps): React.ReactElement {
  const formatted = React.useMemo((): React.ReactNode => {
    const hasDate = date !== undefined && date !== null
    if (hasDate === false) {
      return fallback
    }

    const dateObject = typeof date === "number" ? new Date(date) : new Date(date)
    const isValidDate = Number.isNaN(dateObject.getTime()) === false

    if (isValidDate === false) {
      return fallback
    }

    if (format === "relative") {
      return formatTimestamp(dateObject, { locale })
    }

    if (format === "short") {
      return new Intl.DateTimeFormat(locale, {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      }).format(dateObject)
    }

    if (format === "long") {
      return new Intl.DateTimeFormat(locale, {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(dateObject)
    }

    return fallback
  }, [date, fallback, format, locale])

  return <span className={cn(formattedDateVariants({ variant, className }))}>{formatted}</span>
}

FormattedDate.displayName = "FormattedDate"

export { FormattedDate }
