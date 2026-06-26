import { RcodeLogo } from "@rcode/icons";
import { Link } from "@tanstack/react-router";

interface LogoButtonProps {
  size?: "default" | "lg";
  to?: "/" | "/dashboard";
}

export function LogoButton({ size = "default", to = "/" }: LogoButtonProps) {
  const className = size === "lg"
    ? "inline-flex size-7 shrink-0 items-center justify-center rounded-xs transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
    : "inline-flex size-6.25 shrink-0 items-center justify-center rounded-xs transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30";
  const logoClassName = size === "lg" ? "size-7" : "size-6.25";

  return (
    <Link to={to} className={className} aria-label="Go home">
      <RcodeLogo variant="light" className={`${logoClassName} dark:hidden`} aria-hidden="true" />
      <RcodeLogo variant="dark" className={`hidden ${logoClassName} dark:block`} aria-hidden="true" />
    </Link>
  );
}
