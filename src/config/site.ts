import { SITE_URL, siteUrl } from "@/lib/site";

/**
 * 站点全局基础元数据配置中心
 */
export const siteConfig = {
  name: "Vince Ou",
  tagline: "Vince Ou · Anything is possible",
  description: "Personal Blog&Portfolio - 记录技术探索、折腾过程与生活碎片",
  url: SITE_URL,
  /** 站点正式上线日期 (用于计算持续运行天数) */
  launchDate: "2026-08-24",
};

export type SiteConfig = typeof siteConfig;
export { SITE_URL, siteUrl };