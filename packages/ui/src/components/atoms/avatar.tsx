import {
  Avatar as ShadAvatar,
  AvatarBadge as ShadAvatarBadge,
  AvatarFallback as ShadAvatarFallback,
  AvatarGroup as ShadAvatarGroup,
  AvatarGroupCount as ShadAvatarGroupCount,
  AvatarImage as ShadAvatarImage,
} from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export type AvatarProps = Omit<React.ComponentProps<typeof ShadAvatar>, "size"> & {
  size?: "default" | "sm" | "lg"
}

const Avatar = ({ ref, className, size = "default", ...props }: AvatarProps) => (
  <ShadAvatar
    ref={ref}
    size={size}
    className={cn("rounded-xs after:border-0 after:rounded-xs data-[size=sm]:size-5 data-[size=default]:size-6 data-[size=lg]:size-10", className)}
    {...props}
  />
)

Avatar.displayName = "Avatar"

export type AvatarImageProps = React.ComponentProps<typeof ShadAvatarImage>

const AvatarImage = ({ ref, className, ...props }: AvatarImageProps) => (
  <ShadAvatarImage ref={ref} className={cn("rounded-xs", className)} {...props} />
)

AvatarImage.displayName = "AvatarImage"

export type AvatarFallbackProps = React.ComponentProps<typeof ShadAvatarFallback>

const AvatarFallback = ({ ref, className, ...props }: AvatarFallbackProps) => (
  <ShadAvatarFallback ref={ref} className={cn("rounded-xs", className)} {...props} />
)

AvatarFallback.displayName = "AvatarFallback"

export type AvatarBadgeProps = React.ComponentProps<typeof ShadAvatarBadge>

const AvatarBadge = ({ ref, className, ...props }: AvatarBadgeProps) => (
  <ShadAvatarBadge ref={ref} className={cn("rounded-xs", className)} {...props} />
)

AvatarBadge.displayName = "AvatarBadge"

export type AvatarGroupProps = React.ComponentProps<typeof ShadAvatarGroup>

const AvatarGroup = ({ ref, className, ...props }: AvatarGroupProps) => (
  <ShadAvatarGroup ref={ref} className={className} {...props} />
)

AvatarGroup.displayName = "AvatarGroup"

export type AvatarGroupCountProps = React.ComponentProps<typeof ShadAvatarGroupCount>

const AvatarGroupCount = ({ ref, className, ...props }: AvatarGroupCountProps) => (
  <ShadAvatarGroupCount ref={ref} className={cn("rounded-xs group-has-data-[size=sm]/avatar-group:size-5 group-has-data-[size=default]/avatar-group:size-6 group-has-data-[size=lg]/avatar-group:size-10", className)} {...props} />
)

AvatarGroupCount.displayName = "AvatarGroupCount"

export { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage }
export default Avatar
