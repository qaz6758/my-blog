<div align="center">

# OW · Digital Garden & Sonic Sanctuary

> **“大道至简，衍化至繁。”**  
> 深度对齐 **Anthony Fu** 极客排版与 **Innei** 诗意审美，基于 **Next.js 16 (Turbopack) + React 19** 打造的极致纯粹个人空间。

[![Next.js](https://img.shields.io/badge/Next.js-16.3.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Realtime-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Notion API](https://img.shields.io/badge/Notion-Headless%20CMS-000000?style=flat-square&logo=notion)](https://developers.notion.com/)

[**Live Experience 访问站点 ➔**](https://vinceou.site)

</div>

---

## 🌿 设计哲学与审美表达 (Aesthetic Philosophy)

本项目拒绝模板化组件堆叠与饱和度轰炸，全链路贯彻 **“以字为骨、以白为韵、动静相谐”** 的极客美学：

- **排版优先 (Typography-First)**：
  - 核心阅读区采用 `Source Serif 4` 与现代无衬线字体的精细混排，彻底摒弃厚重边框，以 20px 黄金对称边缘留白与空间张力主导视觉焦点；
  - 深度复刻 Anthony Fu 标志性长文排版：桌面端（`xl:fixed`）手写品牌 Logo 常驻左上角，与下方目录保持 24px 精准纵向间距，正文在视口物理绝对居中。
- **克制动效与静音阅读 (Calm & Non-Intrusive)**：
  - **不对称呼吸退场**：向下滚动时顶部导航自然随页面滚出，滚动中途彻底静音；唯有滑回最顶部或滚动超过 300px 点击右下角微透明（30% Opacity）回顶钮时方才唤醒；
  - **700ms 优雅目录淡显**：大纲目录无刺眼边框与高光跳动，鼠标划入正文时通过 `cubic-bezier(0.4, 0, 0.2, 1)` 渐入，移出渐隐，维持 100% 专注心流。
- **昼夜破晓交互 (Dual World Transition)**：
  - 借助原生 `document.startViewTransition` 结合点击坐标驱动的 **Circular Clip-Path 径向扩散**，以月白与玄墨（`#050505`）撕裂昼夜，配合 `<head>` 零毫秒同步锁定脚本，彻底杜绝 FOUC 白屏闪烁。
- **四季气象粒子 (Atmospheric Particles)**：
  - 基于微内核 Canvas 粒子引擎，实时演算春樱飘零、夏夜流萤、秋霜枫落、冬日初雪四阶自然流体动效，低功耗点缀数字花园。

---

## ⚡ 核心工程架构与技术力 (Technical Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 (Turbopack)                   │
│               React 19 Server Components (RSC)              │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
       ┌───────▼────────┐             ┌────────▼────────┐
       │   Notion API   │             │    Supabase     │
       │ (Headless CMS) │             │  (DB & Storage) │
       └───────┬────────┘             └────────┬────────┘
               │                               │
               ├────── Notion Blocks ➔ AST ────┤
               ├────── Markdown Pipeline ──────┤
               ├────── Realtime WebSocket ─────┤
               └────── Edge Image Proxy ───────┘
```

### 1. 双轨协同内容管线 (Hybrid Headless CMS)
- **原创深度博文 (`/posts`)**：
  - 以 Notion 为首要 Headless CMS，自研 Blocks 递归解析器，将 Notion 复杂 Block 数据树转化为纯净 AST 与 GitHub 风格 Markdown；
  - 集成代码块语法高亮（Prism.js 16 种语言）、公式 KaTeX 解析与图片 WebP 边缘优化代理 (`wsrv.nl`)，内容创作与项目代码完全解耦。
- **Supabase 数据库多维协同**：
  - 作为高速存储与容灾层，托管聚合文章、独立评论系统（嵌套回复、防刷节流）与相册元数据。

### 2. 无缝全局音频空间与流体光谱 (Sonic Sanctuary)
- **跨路由常驻播放 (`/playlist`)**：
  - 基于 React Context + HTML5 Audio 构建，全站页面跳转与深层阅读期间音乐无缝播放、状态永不重置；
  - **动态色谱流体提取**：利用 `@firecms/neat` WebGL 实时着色器，根据当前播放曲目的专辑封面主色调，动态计算并实时渲染流体色彩波浪背景。

### 3. 实时状态心跳信标 (Realtime Activity Beacon)
- 导航栏内嵌状态胶囊（Status Capsule），借助 Supabase Realtime WebSocket 订阅 `site_status` 频道；
- 能够实时向全球访客无感广播博主当前的活动状态（Steam 在线游戏状态、本地听歌音乐进度及心跳时间戳）。

### 4. 边缘多语言与智能分块翻译管线 (Edge i18n & Translation)
- 零外部重量级国际化依赖，自研 `I18nProvider` 支持中文简体、繁体（`opencc-js` 瞬时转码）、英语、日语、韩语；
- 搭建专属 Edge 翻译路由 `/api/translate`，针对长文 Markdown 实行**代码块保护与段落分块翻译**，双层降级（Google GTX + MyMemory）与内存 LRU 缓存，保障外语访客沉浸畅读。

### 5. 无人值守自动化 RSS 聚合 (Autonomous Cron Ingestion)
- 集成 Vercel Cron 定时机制，每日凌晨自动调度 `/api/rss`；
- 多线程拉取外部 RSS 源，利用 `cheerio` 深度剥离外层 HTML 标签与脏实体，经标题分块去重后自动化增量入库。

---

## 🛠️ 技术全景栈 (Tech Stack)

| 领域 | 核心技术选型 | 作用定位 |
| :--- | :--- | :--- |
| **Core** | Next.js 16.3.2 (App Router) + React 19.2.8 | 现代 Web 运行时、Turbopack 毫秒级 HMR 与全量静态预渲染 |
| **Language** | TypeScript 5.x | 端到端严格类型约束 |
| **Styling** | Tailwind CSS v4 + PostCSS | 极客级实用优先排版系统 |
| **Animation** | Framer Motion + WebGL (`@firecms/neat`) | 丝滑阻尼物理过渡、流体动态封面着色器 |
| **Data Engine** | Notion API (`@notionhq/client`) + Supabase | 双轨数据源、PostgreSQL 存储与 Realtime WebSocket 订阅 |
| **Markdown** | ReactMarkdown + remark-gfm + Prism.js | GitHub 风格排版规范与 16 种编程语言语法着色 |
| **Deployment** | Vercel (Edge Functions + Cron Jobs) | 自动化全球边缘分发与凌晨定时同步任务 |

---

## 📂 核心工程拓扑 (Architecture Topology)

```bash
src/
├── app/                      # Next.js App Router 核心路由组
│   ├── api/                  # 边缘 API (RSS 聚合定时抓取、多语言分块翻译、歌单数据)
│   ├── gallery/              # 日系摄影画廊 (瀑布流 / 正方形双模切换 + Lightbox 预览)
│   ├── playlist/             # 全局音乐空间 (沉浸式全屏流体播放器)
│   ├── posts/                # 博客大纲与详情页 (动态读取器、700ms 浮现目录)
│   ├── thoughts/             # 碎片化随想录 (Notion 同步灵感流)
│   ├── error.tsx             # 500 全局优雅错误捕获与容错边界
│   ├── not-found.tsx         # 404 纯净未命中回退
│   └── sitemap.ts            # 动态语义化 SEO 站点地图全量生成
├── components/
│   ├── effects/              # 四季粒子自然气象系统 (春樱/夏萤/秋枫/冬雪)
│   ├── layout/               # 极简双极导航栏、手写 Logo、状态胶囊、极简页脚
│   ├── playlist/             # 音乐上下文、常驻小播放器、WebGL 流体背景
│   └── post/                 # Anthony Fu 同款目录、Markdown 内容转译器、评论区
├── hooks/                    # useLiveStatus (实时长链接心跳)、useTheme
├── lib/                      # Notion AST 解析、Supabase 客户端、图片 WebP 代理
└── types/                    # 完整业务实体类型定义
```

---

## 🚀 本地开发与构建指南

### 1. 克隆并安装依赖
```bash
git clone https://github.com/qaz6758/my-blog.git
cd my-blog
npm install --legacy-peer-deps
```

### 2. 环境变量配置
在项目根目录创建 `.env.local` 文件，配置必要环境变量：
```env
NEXT_PUBLIC_SITE_URL=https://vinceou.site
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NOTION_API_KEY=ntn_your_notion_key
NOTION_POSTS_DB_ID=your_posts_database_id
NOTION_THOUGHTS_DB_ID=your_thoughts_database_id
```

### 3. 本地启动与生产构建
```bash
# 启动本地 Turbopack 开发环境
npm run dev

# 执行生产全量静态预渲染编译 (87+ 静态页面全量生成)
npm run build
```

---

<div align="center">
  <p>© 2026 Vince Ou (OW). Crafted with obsessive attention to detail.</p>
</div>

