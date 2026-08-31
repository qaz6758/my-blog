# 项目目录结构规范与基准文档 (Project Structure Baseline)

> **注意**：本项目的所有功能开发、优化与重构均以此目录结构为基准规范。如有结构增删或模块调整，请同步更新本文档。

---

## 1. 全局目录总览

```text
my-blog/
├── app/                        # Next.js App Router (页面、路由、接口与全局布局)
│   ├── api/                    # 后端 API 路由
│   │   ├── playlist/route.ts   # 歌单数据接口
│   │   └── rss/route.ts        # RSS 订阅生成接口
│   ├── gallery/                # 画廊 / 相册路由
│   │   └── page.tsx
│   ├── page/                   # 首页分页路由
│   │   └── [page]/page.tsx
│   ├── playlist/               # 音乐播放列表路由
│   │   └── page.tsx
│   ├── posts/                  # 文章博客路由
│   │   ├── [id]/
│   │   │   ├── actions.ts      # 文章相关 Server Actions
│   │   │   └── page.tsx        # 文章详情页
│   │   └── page.tsx            # 文章列表页
│   ├── thoughts/               # 动态 / 想法 / 碎碎念路由
│   │   ├── [id]/page.tsx       # 想法详情页
│   │   └── page.tsx            # 想法列表页
│   ├── favicon.ico
│   ├── globals.css             # 全局 Tailwind 及自定义样式
│   ├── layout.tsx              # 根 Layout 布局组件
│   ├── page.tsx                # 首页入口
│   ├── robots.ts               # 搜索引擎爬虫配置
│   └── sitemap.ts              # SEO 站点地图生成
├── components/                 # React UI 组件目录（按功能域拆分）
│   ├── effects/                # 视觉特效（如背景动画、粒子、流星）
│   │   └── ShootingStars.tsx
│   ├── gallery/                # 相册相关组件
│   │   ├── Lightbox/           # 图片灯箱与大图查看器
│   │   │   ├── LightboxImage.tsx
│   │   │   ├── LightboxToolbar.tsx
│   │   │   ├── ThumbnailItem.tsx
│   │   │   ├── ThumbnailStrip.tsx
│   │   │   └── lightbox.tsx
│   │   ├── upload/             # 相册上传相关组件
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── UploadForm.tsx
│   │   │   └── UploadModal.tsx
│   │   ├── GalleryFilters.tsx  # 画廊分类与标签筛选
│   │   ├── GalleryGrid.tsx     # 画廊瀑布流/网格布局
│   │   ├── GalleryHeader.tsx   # 画廊头部介绍与操作栏
│   │   └── GalleryItem.tsx     # 单个相片卡片
│   ├── home/                   # 首页专有组件
│   │   └── HeroSection.tsx     # 首页 Hero 区域
│   ├── layout/                 # 页面骨架与公共布局组件
│   │   ├── BackgroundImage.tsx # 全局背景图
│   │   ├── Footer.tsx          # 底部栏
│   │   ├── Navbar.tsx          # 顶部导航栏
│   │   ├── PageTransition.tsx  # 页面路由切换动画
│   │   ├── SignatureLogo.tsx   # 签名 Logo
│   │   ├── SlideEnter.tsx      # 内容滑入动效
│   │   └── StatusCapsule.tsx   # 实时状态药丸组件
│   ├── playlist/               # 音乐播放器相关组件
│   │   ├── MusicContext.tsx    # 音乐播放全局 Context
│   │   ├── MusicPlayer.tsx     # 悬浮/全局播放器控件
│   │   ├── Playlist.tsx        # 播放列表抽屉/弹窗
│   │   └── SongList.tsx        # 歌单列表组件
│   ├── post/                   # 文章与动态内容渲染组件
│   │   ├── CodeBlock.tsx       # 代码块高亮与复制
│   │   ├── CommentSection.tsx  # 评论区容器
│   │   ├── Comments.tsx        # 评论列表与交互
│   │   ├── PostContentWrapper.tsx # 文章内容包装容器
│   │   ├── PostsListClient.tsx # 文章客户端列表筛选/展示
│   │   ├── ReadingProgressBar.tsx # 阅读进度条
│   │   ├── TableOfContents.tsx # 文章目录大纲 TOC
│   │   ├── ThoughtDetailClient.tsx # 想法详情客户端组件
│   │   └── ThoughtsClientList.tsx  # 想法列表客户端组件
│   └── theme/                  # 明暗主题切换
│       ├── ThemeProvider.tsx   # 主题 Provider
│       └── ThemeToggle.tsx     # 主题切换按钮
├── config/                     # 全局静态配置
│   ├── music.ts                # 播放器与默认歌单配置
│   └── site.ts                 # 网站元数据、社交媒体与站点配置
├── hooks/                      # 自定义通用 React Hooks
│   ├── useLanyard.ts           # Discord / Lanyard 实时状态 Hook
│   └── useLiveStatus.ts        # 实时在线状态 Hook
├── lib/                        # 服务端与客户端工具库、第三方 SDK 封装
│   ├── gallery.ts              # 画廊数据查询与操作
│   ├── notion.ts               # Notion 数据获取与解析
│   ├── rss.ts                  # RSS Feed 构造逻辑
│   └── supabase.ts             # Supabase Client 实例与接口
├── public/                     # 静态公共资源
│   ├── avatar.png              # 头像图片
│   └── home-bg.webp            # 首页背景大图
├── scripts/                    # 构建、迁移或自动化脚本
│   └── clean-gallery-metadata.mjs # 历史相册照片数据清洗与检测脚本
├── types/                      # TypeScript 全局/业务接口类型定义
│   ├── gallery.ts              # 画廊相关类型
│   └── music.ts                # 音乐与播放器相关类型
├── .env.local                  # 本地环境变量（不入库）
├── eslint.config.mjs           # ESLint 代码检查配置
├── next.config.ts              # Next.js 构建与运行配置
├── package.json                # 项目依赖清单
├── postcss.config.mjs          # PostCSS 样式处理器配置
├── tailwind.config.ts          # Tailwind CSS 主题与样式配置
├── tsconfig.json               # TypeScript 编译配置
└── README.md                   # 项目基本说明
```

---

## 2. 模块职责与开发规范

### 1. `app/` (页面路由与 API)
- 遵循 Next.js 14+ App Router 约定。
- 数据获取优先采用 **Server Components**，需要交互的页面部分下沉至 `components/` 或客户端子组件中。
- `api/` 下用于暴露 REST 接口，内部复杂业务逻辑请封装在 `lib/` 中。

### 2. `components/` (UI 组件)
- 按**业务功能域**划分子目录（如 `layout/`, `gallery/`, `post/`, `playlist/` 等）。
- 通用无业务绑定的原子组件建议放在 `components/ui/`（未来若引入如 Radix / Shadcn 可统一归入）。
- 复杂组件（如 `Lightbox`）若包含多个紧密耦合的子部件，可在其专属子文件夹内维护。

### 3. `lib/` (底层与第三方 SDK)
- 负责与外部平台（Notion、Supabase、Discord 等）通信与数据格式转换。
- 纯函数工具库建议统一放置或未来拆分 `lib/utils.ts`。

### 4. `config/` (业务与全局配置)
- 用于存放非私密的业务配置（如站点标题、导航菜单、默认音乐源等）。
- 敏感配置（API Key、Token 等）必须存放在 `.env.local` 中并通过 `process.env` 读取。

### 5. `types/` (TypeScript 类型定义)
- 所有通用的接口、数据模型定义在 `types/` 中，保持与组件解耦。

---

## 3. 变更记录 (Change Log)

| 日期 | 变更内容 | 变更原因 / 模块 |
| :--- | :--- | :--- |
| 2026-08-31 | 初始化建立项目目录结构基准文档 | 规范项目架构，为后续迭代提供基准 |
| 2026-08-31 | 画廊 Phase 1 性能优化：全面接入 WebP 转码压缩与 Next.js Image 组件升级 | 优化相册加载速度与流量，解决原图与超大 PNG 导致的卡顿问题 (`app/gallery/page.tsx`, `components/gallery/`) |
| 2026-08-31 | 画廊 Phase 2 数据层优化：移除客户端 new Image 探测，接入智能 CDN 缩略图兜底 | 彻底消除接口阻塞，解决存量超大 PNG 历史包袱 (`lib/gallery.ts`, `scripts/clean-gallery-metadata.mjs`) |
| 2026-08-31 | 画廊 Phase 3 体验优化：实现基于 Intersection Observer 的触底渐进式加载 | 削减首屏请求与 DOM 开销，提供丝滑无限滚动与归档完结提示 (`app/gallery/page.tsx`) |
| 2026-08-31 | 图片优化适配代理与 LCP 预加载优化 | 开启 `dangerouslyAllowLocalIP` 支持本地 VPN/TUN 代理，并为首屏前两张图注入 `priority` 消除 LCP 警告 (`next.config.ts`, `components/gallery/`) |
| 2026-08-31 | 修复 Lightbox 顶部工具栏布局与全局 Navbar 穿透层级错位 | 重构 `LightboxToolbar` 顶栏 Flex 布局，使用 `createPortal` 将全屏灯箱直接挂载到 `document.body` 彻底解决层叠上下文与穿透冲突 (`components/gallery/Lightbox/`) |
| 2026-08-31 | 画廊 Noir Archive 重设计：衬线展示标题 · 琥珀滑动 indicator · 群组降光 · 无圆角胶片卡片 | 全面重构 `GalleryHeader`（serif 展示字 + 琥珀注释）、`GalleryFilters`（JS 驱动滑动 indicator）、`GalleryGrid`（6px 紧凑间距 + hover 群组状态下传）、`GalleryItem`（无圆角 + 降光对比 + 胶片边框 + Exif 徽章重设计）|
| 2026-08-31 | 画廊整体页面排版重构（Noir Archive 概念图还原） | 将 Header 内联至页面 JSX，采用全宽双栏布局（左侧 clamp 响应式大字标题 + 右侧计数/上传），分割线 + Filters 嵌入 Header 底部，主网格延伸至 `max-w-[1800px]`，归档页脚改为带装饰线的极简琥珀文字，移除多余的 `GalleryHeader` 组件引用 (`app/gallery/page.tsx`) |
| 2026-08-31 | 完整复刻 Noir Archive 概念图全局布局：新增左侧 Filmstrip 胶片竖条 + 右侧内容区双栏结构 | 新建 `Filmstrip.tsx`（76px fixed 胶片竖条，含序号 + active amber 竖线），重构 `GalleryFilters.tsx`（加入右侧照片数量徽章）, 整体页面改为 Filmstrip fixed + 右侧偏移双栏 (`app/gallery/page.tsx`, `components/gallery/Filmstrip.tsx`, `components/gallery/GalleryFilters.tsx`) |
| 2026-08-31 | 按完整设计规范重建 Noir Archive 画廊页全部视觉组件 | `#080808` 背景色；左列两行衬线大字 + 右列策展说明（amber mono）；胶囊药丸过滤栏（`bg-zinc-900/60 border border-white/5 rounded-full`）；`GalleryItem` 改为 `rounded-xl` + 胶片颗粒 SVG 噪声遮罩 + amber EXIF 文字 + `scale-[1.03]` hover；`Filmstrip` 不活跃缩略图灰度降低；accent 色全面从 `#d4a574` 升级为 `#c48b5f` (`app/gallery/page.tsx`, `GalleryFilters.tsx`, `GalleryItem.tsx`, `GalleryGrid.tsx`, `Filmstrip.tsx`) |
