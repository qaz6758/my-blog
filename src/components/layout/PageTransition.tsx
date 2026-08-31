"use client";

import React, { useEffect, useRef } from "react";
import { motion, type Variants } from "framer-motion";

/*
 * ============================================================
 * 页面切换动画
 *
 * 职责：
 * 只负责“路由页面进入 / 离开”。
 *
 * 不再使用 scale：
 * - 避免整页文字进入 GPU 合成层
 * - 避免字体缩放导致的位图抽动
 * - 避免与 Theme View Transition 发生视觉叠加
 *
 * 页面切换只使用：
 * opacity + translateY
 * ============================================================
 */

const variants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },

  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.16, 1, 0.3, 1],
    },
  },

  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.16,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

export function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
   * 每一个 PageTransition 实例只记录自己的首次挂载。
   *
   * 不再使用模块级：
   *
   * let isInitialRender = true;
   *
   * 这样可以避免：
   * - React Strict Mode
   * - Fast Refresh
   * - 多个 PageTransition
   *
   * 之间互相影响。
   */
  const hasMountedRef = useRef(false);

  const shouldAnimate = hasMountedRef.current;

  useEffect(() => {
    hasMountedRef.current = true;
  }, []);

  return (
    <motion.div
      variants={variants}
      initial={shouldAnimate ? "initial" : false}
      animate="enter"
      exit="exit"
      className="w-full flex-1"
    >
      {children}
    </motion.div>
  );
}