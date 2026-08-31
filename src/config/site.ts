// src/config/site.ts

/**
 * 站点全局基础信息与个人配置中心
 * 统一管理全站标题、个人介绍文案、技术栈状态与社交平台链接
 */
export const siteConfig = {
  // 1. 站点基础元数据
  name: "theyole",
  blogName: "拾光小站",
  title: "Anything is possible",
  tagline: "拾光小站 · Anything is possible",
  description: "Personal Blog & Portfolio - 记录技术探索、折腾过程与生活碎片",
  avatar: "/avatar.png",

  // 2. 首页 HeroSection 个人介绍文案
  intro: {
    greeting: "嗨，我是",
    role: "一名热爱折腾的全栈开发者与数字手艺人。",
    philosophy: "破碎重组，再破碎的循环，让自己成为自己",
    description:
      "在这里记录技术探索、系统折腾、DIY 工具与生活碎片。秉持着这个理念，持续构建有温度的开源与个人项目。",
    hobby:
      "我喜欢研究新的东西，也喜欢把想法真正做出来。常在 GitHub 探索开源项目，也会在各种平台上分享自己的折腾日常。",
  },

  // 3. 当前进行中的状态与技术栈 (Currently)
  currently: {
    title: "Currently",
    techStack: "React · Next.js · TypeScript",
    learningText: "正在学习 React · Next.js · TypeScript，探索全栈开发与现代 Web 技术。",
    projectText: "也在持续折腾自己的博客、摄影网站以及一些有趣的小项目。",
  },

  // 4. 摄影板块文案 (Photography)
  photography: {
    title: "Photography",
    text: "除了写代码，我也喜欢摄影。这里记录我在生活和旅途中留下的一些影像。如果你也喜欢照片，可以去",
    linkText: "摄影画廊",
    linkHref: "/gallery",
  },

  // 5. 社交媒体链接
  socialLinks: [
    { name: "GitHub", href: "https://github.com/qaz6758" },
    { name: "X", href: "https://x.com" },
    { name: "Bilibili", href: "https://space.bilibili.com/520681544?spm_id_from=333.1007.0.0" },
    { name: "Telegram", href: "https://t.me" },
    { name: "Email", href: "mailto:theyole@outlook.com" },
  ],
};

export type SiteConfig = typeof siteConfig;