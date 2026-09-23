// 已合并至 themeTransitionDriver.ts —— 此文件保留向后兼容入口
import { ThemeDriverParams } from "../types";
import { runThemeTransition } from "./themeTransitionDriver";

export function runDesktopThemeTransition(params: ThemeDriverParams): void {
  runThemeTransition(params, false);
}
