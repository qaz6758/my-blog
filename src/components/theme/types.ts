// src/components/theme/types.ts
import React from "react";

export type Theme = "light" | "dark";

export interface ToggleThemeOptions {
  disableAnimation?: boolean;
  origin?: { x: number; y: number };
}

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  mounted: boolean;
  toggleTheme: (
    event?: React.MouseEvent<HTMLElement>,
    options?: ToggleThemeOptions
  ) => void;
  setTheme: (theme: Theme) => void;
}

export interface ThemeDriverParams {
  nextTheme: Theme;
  applyThemeDirect: (newTheme: Theme) => void;
  event?: React.MouseEvent<HTMLElement>;
  options?: ToggleThemeOptions;
  onComplete?: () => void;
}
