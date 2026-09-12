# 项目开发与设计接续档案 (PROJECT_HANDOFF.md)

> **致接手本项目的 AI / 开发者**：  
> 本文件记录了当前 Next.js 个人数字花园项目的**核心世界观、设计规范、已完成的修改明细及技术约束**。请完整阅读本文件，以 100% 还原此前的设计语境并无缝接续后续工作。

---

## 一、项目核心世界观与设计哲学

这是一个人的**数字花园**（写代码、写文章、记录思考、摄影、音乐）。设计风格绝不是普通的“二次元”或“通用 SaaS 仪表盘”，而是深度汲取自**《混沌武士》（Samurai Champloo）**与**《浪客行》（Vagabond）**的精神气质：

### 1. 昼行 / DAY（灵感来自《混沌武士》）
* **关键词**：旧纸、墨、朱砂、印刷痕迹、节奏、街头、漂泊、手作感。
* **色彩基调**：
  * 底色：暖纸色（`#ede7dc`）。
  * 墨字：深墨色（`#1e1b18`）。
  * 点缀：朱砂红（`#b91c1c`），极为克制，如印章落款。
* **物理动效**：干净利落（`~0.18s` / `200ms`），使用快意缓动 `easeOut`，禁止弹簧（spring/bounce）。

### 2. 夜行 / NIGHT（灵感来自《浪客行》）
* **关键词**：夜色、墨、枯山水、月光、留白、深沉、呼吸、安静。
* **色彩基调**：
  * 底色：黑灰/炭色（`#181614`）。
  * 文字：月白/素霜（`#eae5dc`）、淡墨灰（`#777168` / `#9d9589`）。
  * 点缀：纯净低透明度月光白（`rgba(255,255,255,0.4)`）。
* **物理动效**：深沉呼吸（`~0.24s` / `240ms`），以透明度（opacity）与明暗为主，避免大幅位移。

### 3. 全局红线（绝对禁止）
* ❌ 严禁使用通用 SaaS 组件感（大圆角 `rounded-2xl/3xl`、强高斯模糊 `backdrop-blur`、发光发亮、霓虹 Neon、弹簧动画 Spring）。
* ❌ 严禁出现显眼的古风装饰（武士刀、樱花、浮世绘直接贴图）。
* ❌ 任何页面展开不得强行推动（push down）主体文档流。

---

## 二、已完成的重构与现状 (Work Accomplished)

项目已通过 4 轮大阶段改造，构建状态稳定（`npm run build` 和 `npx tsc --noEmit` 均 0 报错通过）。

### 1. 基础材料引擎与排印 (Phase 1 & 2)
* 全局 CSS 变量确立：`--realm-motion-duration`、`--realm-motion-ease`。
* Hero 区域：去掉了扁平化无机感，确立版画和雕版印刷般的质感。

### 2. 博客与思考流页面 (Phase 3)
* `src/components/post/PostsListClient.tsx` & `DynamicPostReader.tsx`：文章标题加权，弱化元数据对比度，统一时间动效。
* `src/components/post/ThoughtsClientList.tsx` & `ThoughtDetailClient.tsx`：点赞等交互按钮剥离了常见的桃红色，改为昼行朱砂 / 夜行月白反馈。

### 3. 相册与音乐页面 (Phase 4)
* `src/app/gallery/GalleryClient.tsx`：拉大网格间距赋予空气感（`gap-8 sm:gap-10`），深黑色沉浸式 Lightbox，移除夜行模式下的突兀投影与大圆角。
* `src/components/playlist/Playlist.tsx`：彻底剔除 Apple Music 模板痕迹（去掉了洋红色 `#FA2D48`、`rounded-[8px]`、浮夸阴影），采用版画式直角封面与克制的 `PLAY` 文本。

### 4. 移动端 Navbar 与状态胶囊最终打磨（重点！）
涉及文件：`src/components/layout/Navbar.tsx`、`src/components/layout/StatusCapsule.tsx`。
* **移动端菜单展开**：
  * 定位为 `absolute inset-x-0 top-full`，**绝对不挤压页面内容**。
  * Framer Motion 编排（Staggered）：展开时容器先显现，接着胶囊，随后 Navigation 依次浮现（间隔 40ms）；关闭时 Navigation 先退场，随后胶囊隐去，最后空间闭合。
  * 菜单底缘完全消除硬线条 `border-bottom`，采用微弱背景渐隐过渡回页面正文。
  * Active 项无背景卡片包裹，仅为纯文字 + 底部一笔 16px 的朱砂/月白短痕。
* **StatusCapsule（状态胶囊）**：
  * **PC 端**：保持原状，悬浮/点击依然展示精致的“LIVE DESK”纸墨卡片。
  * **移动端（手机端）**：彻底取消点击弹出卡片（`disablePopover={true}`）；开启 `inlineApp={true}`，当同时听歌和有运行 App 时，采用 **左右两端对齐（`justify-between`）**，左边为音乐信息，右边为 App 信息，**无中间分割竖线**，且**两边的文字字体大小（`text-[10px] sm:text-[11px]`）、字重（`font-medium`）、颜色完全 1:1 对齐**。

---

## 三、关键文件结构与当前职责

* `src/components/layout/Navbar.tsx`：响应式导航栏主体、移动端动画容器。
* `src/components/layout/StatusCapsule.tsx`：听歌与实时应用状态胶囊（支持 `disablePopover` 和 `inlineApp` 属性）。
* `src/components/theme/ThemeProvider.tsx`：昼行 / 夜行切换引擎。
* `src/hooks/useLiveStatus.ts`：实时音乐与活动状态监听。
* `src/app/globals.css`：纸墨纹理、双界基础主题定义。

---

## 四、接续指令（换号后直接对新 AI 发送）

请复制以下这段话作为你在新账号新会话中的**第一句话**：

```text
请阅读根目录下的 PROJECT_HANDOFF.md，彻底吸收当前个人数字花园项目的《混沌武士 × 浪客行》（昼行 / 夜行）世界观、已落实的设计规范与最新修改进度。在确认理解后，请告诉我你已就绪，等待我的下一步指令。
```
