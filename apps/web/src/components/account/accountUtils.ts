export const avatarMaxBytes = 2 * 1024 * 1024;

export type AccountTheme = "system" | "light" | "dark";

export const accountThemes: AccountTheme[] = ["system", "light", "dark"];

export function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter((part) => part !== "");
  const firstInitial = parts[0]?.[0] ?? "R";

  return firstInitial.toUpperCase();
}

export function getAvatarColor(displayName: string) {
  const value = displayName.trim() === "" ? "rcode" : displayName.trim();
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) % 360;
  }

  return `oklch(0.74 0.12 ${hash})`;
}

export function isAllowedAvatarFile(file: File) {
  return file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/webp";
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
