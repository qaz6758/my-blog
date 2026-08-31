
"use client";

import React, {
  ElementType,
  ComponentPropsWithoutRef,
  ReactNode,
  CSSProperties,
} from "react";

export type SlideEnterProps<T extends ElementType = "div"> = {
  /**
   * 要渲染的 HTML 元素
   *
   * 例如：
   * as="div"
   * as="header"
   * as="nav"
   */
  as?: T;

  /**
   * 阶梯序号
   *
   * stage={0} → 0ms
   * stage={1} → 50ms
   * stage={2} → 100ms
   */
  stage?: number;

  /**
   * 自定义延迟。
   *
   * 设置后会覆盖 stage * stagger。
   */
  delay?: number;

  /**
   * stage 之间的默认间隔，单位 ms。
   */
  stagger?: number;

  /**
   * 进入时向上移动的距离，单位 px。
   */
  offset?: number;

  /**
   * 动画持续时间，单位 ms。
   */
  duration?: number;

  /**
   * 是否标记为自动 stagger。
   *
   * 当前仅作为扩展接口保留，
   * 不会自动修改 children。
   */
  autoStagger?: boolean;

  children?: ReactNode;

  className?: string;
} & Omit<
  ComponentPropsWithoutRef<T>,
  "as" | "children" | "className" | "style"
>;

export function SlideEnter<T extends ElementType = "div">({
  as,
  stage = 0,
  delay,
  stagger = 50,
  offset = 8,
  duration = 400,
  autoStagger = false,
  children,
  className,
  style,
  ...props
}: SlideEnterProps<T>) {
  const Component = (as || "div") as ElementType;

  /*
   * ============================================================
   * 计算动画延迟
   * ============================================================
   *
   * 没有手动指定 delay 时：
   *
   * stage={0} → 0ms
   * stage={1} → 50ms
   * stage={2} → 100ms
   * ...
   */
  const calculatedDelay =
    delay !== undefined ? delay : Math.max(0, stage) * stagger;

  /*
   * ============================================================
   * 动画参数
   * ============================================================
   *
   * 直接通过 CSS custom properties 传给组件。
   *
   * 这样 SlideEnter 不再依赖 globals.css
   * 中的全局动画规则。
   */
  const animationStyle: CSSProperties = {
    "--slide-enter-delay": `${Math.max(0, calculatedDelay)}ms`,
    "--slide-enter-offset": `${offset}px`,
    "--slide-enter-duration": `${duration}ms`,
    ...style,
  };

  return (
    <Component
      {...props}
      className={`slide-enter ${className ?? ""}`.trim()}
      style={animationStyle}
      data-slide-enter=""
      data-stage={stage}
      data-auto-stagger={autoStagger ? "" : undefined}
    >
      {children}
    </Component>
  );
}

