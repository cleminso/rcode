import type { SVGProps } from "react"

export type RcodeLogoVariant = "light" | "dark"

export interface RcodeLogoProps extends SVGProps<SVGSVGElement> {
  variant?: RcodeLogoVariant
}

const backgroundByVariant: Record<RcodeLogoVariant, string> = {
  light: "#E7ABDD",
  dark: "#FFD966",
}

export const RcodeLogo = ({ variant = "light", ...props }: RcodeLogoProps) => {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="32" height="32" rx="3" fill={backgroundByVariant[variant]} />
      <path d="M13 20.164V10.75H14.584V12.442L16.222 10.75H18.634V12.334H16.294L14.584 14.098V20.164H13Z" fill="#000" />
    </svg>
  )
}

export const RcodeLogoLight = (props: SVGProps<SVGSVGElement>) => {
  return <RcodeLogo variant="light" {...props} />
}

export const RcodeLogoDark = (props: SVGProps<SVGSVGElement>) => {
  return <RcodeLogo variant="dark" {...props} />
}
