// Theme sources:
// - vitesse-dark and vitesse-light: originally from https://github.com/antfu/vscode-theme-vitesse
//   Copied locally to add subtle monochrome bracket pair colors (Zed-style).
// - zedokai and zedokai-darker: originally from https://github.com/slymax/zedokai
import type { ThemeRegistration } from "shiki";
import vitesseDarkTheme from "./themes/vitesse-dark.json";
import vitesseLightTheme from "./themes/vitesse-light.json";
import zedokaiTheme from "./themes/zedokai.json";
import zedokaiDarkerTheme from "./themes/zedokai-darker.json";

export const vitesseDark = {
  ...vitesseDarkTheme,
} as ThemeRegistration;

export const vitesseLight = {
  ...vitesseLightTheme,
} as ThemeRegistration;

export const zedokai = {
  ...zedokaiTheme,
} as ThemeRegistration;

export const zedokaiDarker = {
  ...zedokaiDarkerTheme,
} as ThemeRegistration;
