// Theme sources:
// - vitesse-dark and vitesse-light: built-in to Shiki (https://github.com/antfu/vscode-theme-vitesse)
// - zedokai and zedokai-dark: custom themes from https://github.com/slymax/zedokai/blob/main/themes/zedokai.json
import type { ThemeRegistration } from "shiki";
import zedokaiTheme from "./themes/zedokai.json";
import zedokaiDarkerTheme from "./themes/zedokai-darker.json";

export const vitesseDark = "vitesse-dark" as ThemeRegistration;

export const vitesseLight = "vitesse-light" as ThemeRegistration;

export const zedokai = {
  ...zedokaiTheme,
} as ThemeRegistration;

export const zedokaiDarker = {
  ...zedokaiDarkerTheme,
} as ThemeRegistration;
