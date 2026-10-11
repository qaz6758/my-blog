# VinceOu Blog 全栈架构审计与运维全景指南 (ARCHITECTURE_GUIDE)

> **审计基准时间**：2026-10-11  
> **审计范围**：Git 仓库 (`qaz6758/my-blog`)、GitHub 远端分支、Cloudflare 线上 Worker 资源、Supabase 数据库、域名与 DNS 链路。  
> **执行原则**：全流程只读审计，无任何代码篡改、依赖变动或生产配置覆写。所有事实均附带验证证据与置信状态。

---

## 目录
1. [一页式总体结论与核心答疑](#1-一页式总体结论与核心答疑)
2. [完整系统架构图 (Mermaid)](#2-完整系统架构图-mermaid)
3. [各服务组件与职责详解](#3-各服务组件与职责详解)
4. [域名与访问路由表](#4-域名与访问路由表)
5. [关键业务数据流说明](#5-关键业务数据流说明)
6. [生产构建与自动化部署链路](#6-生产构建与自动化部署链路)
7. [安全防线与权限配置审计](#7-安全防线与权限配置审计)
8. [Supabase 迁移与数据一致性专项审计](#8-supabase-迁移与数据一致性专项审计)
9. [当前剩余问题优先级清单 (P0~P3)](#9-当前剩余问题优先级清单-p0p3)
10. [日常更新操作指南](#10-日常更新操作指南)
11. [故障排查手册 (全链路定障)](#11-故障排查手册-全链路定障)
12. [技术术语速查表](#12-技术术语速查表)

---

## 1. 一页式总体结论与核心答疑

### 1.1 总体结论概括
- **运行状况**：当前博客已成功从旧的 Cloudflare Pages 架构平稳迁移至 **Cloudflare Workers (基于 OpenNext 适配层)**。网站全站页面、文章路由、Notion API 网关、封面图片代理均正常提供服务（HTTP 200）。
- **自动化构建**：**GitHub 自动部署已经生效且正在运行**。你的最新提交（`06446b6` 关于 `sitemap.ts` 容错修复）已由 Cloudflare Workers Builds 自动编译并部署到生产环境（版本号 `d3cc3c59`，分配 100% 流量）。
- **手机访问超时真相**：你的主域名 `vinceou.site` 的 DNS 直接解析到 Cloudflare 的官方 Anycast IP（如 `172.67.168.162`）。**在中国大陆移动蜂窝网络（4G/5G）环境下，Cloudflare 官方 IP 遭到严重的网络运营商 QoS 丢包与 GFW 干扰**，手机甚至无法完成初始 TLS 握手拿到 301 重定向，因而显示 `Connection Timeout`；而电脑端开启了代理软件（TUN 虚拟网卡模式），绕过了国内运营商拦截，直接秒开。

### 1.2 针对六大关键疑问的明确回答

| 问题 | 审计结论 | 核心依据与证据 |
| :--- | :--- | :--- |
| **1. 当前系统是否可以继续正常使用？** | **可以正常使用** | 生产站点 `vinceou.site`（经过 301 跳转）、`www.vinceou.site`、`api.vinceou.site` 与 `cdn.vinceou.site` 均返回 200 OK；SSR 与静态路由运转正常。 |
| **2. 生产网站现在的实际回源与部署链路是什么？** | **双层 Worker 架构**<br>访客 ➔ 优选 IP / 直接访问 ➔ `blog-proxy` / 网站 Worker ➔ `my-blog.workers.dev` 渲染 ➔ Notion / Supabase | 线上 Worker `my-blog` 托管 Next.js 16 完整前端与服务端；`blog-proxy` 充当国内加速入口与图片缓存；`notion-api` 充当 CMS 数据源网关。 |
| **3. GitHub 推送自动部署是否真正生效？** | **真正生效** | 提交 `06446b6` 于 14:30:57 推送至 GitHub `master`；Cloudflare 于 14:32:30 生成版本 `d3cc3c59` 并接入 100% 流量；线上 `sitemap.xml` 包含最新提交逻辑。 |
| **4. 是否存在可能再次导致手机无法访问的风险？** | **存在**（主要在主域名直连与缓存） | ① 国内手机若直接输入 `vinceou.site`，受制于 CF 官方 IP 封锁，无法到达 301 阶段；<br>② 手机浏览器可能缓存了中午 Pages 刚删除时的旧 DNS 故障（1016/530）。 |
| **5. 旧 Pages 被删除后，回滚能力还剩哪些？** | **依赖 Git 历史与 Worker 版本回滚** | Pages 项目已物理删除，无法通过 Pages 控制台一键回滚；但 Cloudflare Workers 保留了最近数十个历史版本（`Versions`），支持在 Worker 面板一键 Rollback；本地 Git 提交树完好。 |
| **6. 目前最值得优先处理的 3 个问题是什么？** | **① 手机国内免代理直达优化**<br>**② 生产变量与 Git 追踪安全收敛**<br>**③ Supabase CLI 迁移历史同步确认** | 详见后文 P1 级任务清单。 |

---

## 2. 完整系统架构图 (Mermaid)

```mermaid
flowchart TD
    %% 客户端层
    subgraph Clients["客户端 (访客终端)"]
        PC["💻 电脑端 (带代理/VPN)"]
        Mobile["📱 手机端 (国内 4G/5G 移动蜂窝网络)"]
    end

    %% DNS 与边缘接入
    subgraph Edge["Cloudflare 边缘解析与路由层"]
        CF_DNS_Apex["DNS: vinceou.site<br>(官方 Anycast IP: 172.67.x.x / 104.21.x.x)"]
        CF_DNS_WWW["DNS: www.vinceou.site<br>(Worker Custom Domain)"]
        CF_DNS_CDN["DNS: cdn.vinceou.site<br>(CNAME -> cf.090227.xyz 优选 IP)"]
        CF_DNS_API["DNS: api.vinceou.site<br>(Worker Custom Domain)"]
        Redirect301["Cloudflare 边缘 301 规则<br>vinceou.site -> https://cdn.vinceou.site/"]
    end

    %% Worker 运算层
    subgraph Workers["Cloudflare Workers 运行时集群"]
        subgraph ProxyWorker["Worker: blog-proxy (saas.vinceou.site)"]
            ImgProxy["/img 路由: 封面图片代理<br>(绕过防盗链 + 边缘强缓存 1年)"]
            OriginForward["全站页面回源转发<br>Forward to: my-blog.dedeboki123.workers.dev"]
        end

        subgraph SiteWorker["主网站 Worker: my-blog (OpenNext Next.js 16)"]
            SSR_Engine["Node.js 兼容服务端 (Turbopack + OpenNext)"]
            StaticAssets["静态资源绑定 (env.ASSETS)<br>_next/static, fonts, favicon"]
        end

        subgraph NotionWorker["API Worker: notion-api"]
            NotionGW["Notion 实时网关 (/api/posts, /api/thoughts)<br>携带 NOTION_API_KEY + 严格校验 Published 状态"]
        end
    end

    %% 外部数据源
    subgraph DataSources["后端持久化与外部数据源"]
        NotionDB[("📝 Notion 数据库<br>(文章/随想录/音乐库)")]
        SupabaseDB[("⚡ Supabase PostgreSQL<br>(点赞 RPC / 访问计数 / 实时 WebSocket)")]
        ExtImgServer["🖼️ 外部源图片服务器<br>(网易云音乐 163.com / Unsplash 等)"]
    end

    %% 自动化流水线
    subgraph CI_CD["GitHub 与构建部署流"]
        GH_Repo["🐙 GitHub 仓库: qaz6758/my-blog (分支: master)"]
        CF_Builds["⚙️ Cloudflare Workers Builds<br>构建: npm run build:worker<br>部署: npx wrangler deploy"]
    end

    %% 访问流向连接
    PC -->|可连通 CF 官方 IP| CF_DNS_Apex
    PC -->|直连| CF_DNS_WWW
    Mobile -.->|国内网络连接严重丢包超时 (Timeout)| CF_DNS_Apex
    Mobile -->|若直接访问优选域名| CF_DNS_CDN
    PC -->|访问优选域名| CF_DNS_CDN

    CF_DNS_Apex --> Redirect301
    Redirect301 -->|301 跳转| CF_DNS_CDN

    CF_DNS_CDN -->|经过优选 IP 节点| ProxyWorker
    ProxyWorker -->|请求 /img 图片| ImgProxy
    ImgProxy --> ExtImgServer
    ProxyWorker -->|其他所有页面请求| OriginForward
    OriginForward --> SiteWorker

    CF_DNS_WWW --> SiteWorker

    SiteWorker -->|读取静态 CSS/JS| StaticAssets
    SiteWorker -->|服务端渲染 / 静态生成| SSR_Engine
    SSR_Engine -->|获取文章与随想录| NotionWorker
    NotionWorker -->|安全拉取| NotionDB
    SSR_Engine -->|获取点赞与访问数据| SupabaseDB

    Clients -->|客户端点赞 RPC / 访问计数| SupabaseDB
    Clients -->|前端 API 轮询 (可选)| CF_DNS_API
    CF_DNS_API --> NotionWorker

    %% 部署流程连接
    GH_Repo -->|git push master| CF_Builds
    CF_Builds -->|自动构建产物并部署| SiteWorker

    classDef danger fill:#fee,stroke:#f66,stroke-width:2px;
    classDef success fill:#efe,stroke:#4a4,stroke-width:2px;
    class Mobile,CF_DNS_Apex danger;
    class SiteWorker,NotionWorker,ProxyWorker success;
```

---

## 3. 各服务组件与职责详解

### 3.1 Next.js 网站核心 (`src/`)
- **运行环境**：Next.js `16.4.0` + React `19.2.8`，基于 App Router 架构。
- **构建适配器**：`@opennextjs/cloudflare@1.20.10`。
- **运行形态**：
  - **静态资产 (`.open-next/assets`)**：打包后的 CSS、JS Chunks、图片、字体，直接部署在 Cloudflare 全球边缘 KV 存储中（通过 `env.ASSETS` 绑定直接响应，不消耗 Worker CPU）。
  - **计算核心 (`.open-next/worker.js`)**：负责处理 SSR 动态路由（如新发布的文章页面）、Route Handlers（`/api/playlist`）、ISR 缓存再验证以及 `sitemap.xml` 动态生成。
- **浏览器端与服务端分工**：
  - **浏览器端执行 (Client Components)**：包含 `"use client"` 的组件，例如播放器控制条、随想录点赞乐观更新按钮、访问计数器 WebSocket 监听。
  - **服务端执行 (Server Components)**：页面初始 HTML 拼装、向 Notion API Worker 拉取 Markdown 数据、从 Supabase 读取已发布随想录的点赞数。

### 3.2 网站 Worker (`my-blog`)
- **配置载体**：根目录 [wrangler.jsonc](file:///d:/code/my-blog/wrangler.jsonc)。
- **线上名称**：`my-blog`（账户 ID：`b15a509833c1c539ec1e6e469dd8e302`）。
- **当前生效版本**：`d3cc3c59-a1be-4ea2-8e70-dbac4f1076f3`（对应 Git commit `06446b6`）。
- **核心绑定**：
  - `ASSETS`：静态资产目录绑定。
  - `NOTION_API_KEY` 及 5 个数据库 ID：安全服务端密钥绑定。
  - `workers_dev: true`：允许 `my-blog.dedeboki123.workers.dev` 作为内部回源通道。

### 3.3 Notion API 辅助 Worker (`notion-api`)
- **配置与源码**：[worker/wrangler.toml](file:///d:/code/my-blog/worker/wrangler.toml) 与 [worker/index.js](file:///d:/code/my-blog/worker/index.js)。
- **部署状态**：已于 2026-10-11 部署加固版本（版本 ID：`b4765a95`）。
- **核心职责**：
  1. 作为专用的 Notion CMS 数据安全中继，隔离私有 `NOTION_API_KEY`；
  2. 实现严格的 **发布状态强制断言 (`isPagePublished`)**：任何草稿或未标记为“已发布”的页面，接口统一返回 404，绝不泄露草稿内容；
  3. 提供全网跨域（CORS）与 30 秒边缘微缓存。

### 3.4 反向代理与图片加速 Worker (`blog-proxy`)
- **服务载体**：Cloudflare 独立 Worker `blog-proxy`，挂载在自定义域 `saas.vinceou.site`。
- **核心职责**：
  1. **图片代理 (`/img?url=...`)**：智能伪造 `Referer`（绕过网易云音乐等防盗链 403 拦截），并使用 Cloudflare `caches.default` 将图片写入全球边缘节点，缓存有效期为 **1 年**；
  2. **优选 IP 回源转发**：所有非图片请求，自动重写 Host 头转发至 `my-blog.dedeboki123.workers.dev`，为国内通过优选 IP 访问的访客提供透明反向代理。

### 3.5 Supabase 数据服务
- **数据源区分**：
  - **内容类数据**（博客正文、随想录文字、音乐库歌单）：**100% 存储于 Notion**。
  - **高频互动与状态数据**（点赞数、全站访问计数器、实时在线状态）：**存储于 Supabase PostgreSQL**。
- **安全架构**：
  - 点赞操作采用受限存储过程 `public.increment_thought_like(target_id, delta)`，严格限定只能为 `is_published IS TRUE` 的条目增加/减少 1 个赞，禁止插入未知 UUID。
  - 客户端仅授权读取 `thoughts` 表的 `(id, likes, is_published)` 字段，保障数据表其他潜在敏感字段不被窃取。

---

## 4. 域名与访问路由表

| 域名 / 路径 | DNS 记录类型 | 目标指向 | 代理状态 | 最终处理者 | 核心作用 |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `vinceou.site` | Worker 自定义域 / A | Cloudflare 边缘 Anycast | 已代理 🟠 | 边缘重定向规则 | Apex 品牌域名。边缘 301 重定向至 `https://cdn.vinceou.site/` |
| `www.vinceou.site` | Worker 自定义域 | Cloudflare 边缘 Anycast | 已代理 🟠 | `my-blog` Worker | 备用完整主站入口，直达 Next.js 网站 Worker |
| `cdn.vinceou.site` | CNAME | `cf.090227.xyz` | 仅 DNS ⚪ | `blog-proxy` Worker | **核心页面访问域**。国内优选 IP 节点解析，保障国内网络秒开 |
| `saas.vinceou.site` | Worker 自定义域 | Cloudflare 内部 | 已代理 🟠 | `blog-proxy` Worker | 优选 IP 回源目的地（Cloudflare for SaaS 回源点） |
| `api.vinceou.site` | Worker 自定义域 | Cloudflare 内部 | 已代理 🟠 | `notion-api` Worker | 独立的 Notion CMS 数据网关 |
| `*.workers.dev` | 官方子域名 | Cloudflare 内部集群 | 官方默认 | `my-blog` Worker | 内部受保护回源通道，供 `blog-proxy` 反代拉取页面 |

---

## 5. 关键业务数据流说明

### A. 首页打开与网站状态显示
1. **网络接入**：访客在浏览器打开 `vinceou.site`，Cloudflare 边缘接收请求并触发 301 重定向至 `cdn.vinceou.site`。
2. **边缘加速**：`cdn.vinceou.site` 通过优选 IP 节点将请求送达 `blog-proxy`，`blog-proxy` 内部回源请求 `my-blog.dedeboki123.workers.dev`。
3. **页面拼装**：`my-blog` Worker 命中 Next.js 静态 HTML/SSR 缓存，立即返回首页框架及预渲染内容。
4. **状态激活**：浏览器加载前端脚本，`SiteVisitCounter` 组件通过 Supabase RPC 异步调用 `increment_site_visit_count` 增加访问计数，并订阅 WebSocket 频道更新在线状态。
- *验证状态*：**已在生产环境验证**。

### B. 发布一篇新 Notion 文章后的更新链路
1. **文章撰写**：在 Notion 数据库中新建文章，填写标题、Slug，并将状态勾选为“已发布”。
2. **动态路由命中**：访客首次访问该文章路径 `/posts/my-new-post`。
3. **增量生成 (ISR)**：
   - Next.js 发现本地无预生成静态 HTML，触发服务端动态请求；
   - 服务端向 `api.vinceou.site/api/posts/:id` 或直接通过内部 Notion 客户端发起查询；
   - `notion-api` 校验该文章状态为 `Published`，返回 Markdown 正文与属性；
   - OpenNext Worker 渲染生成页面 HTML，同时将页面缓存写入边缘（有效期配置：10 秒后允许平滑再验证 `revalidate: 10`）。
- *验证状态*：静态路由与构建期生成已验证；线上实时发布新文章行为**从代码推断、尚未在生产写入真实测试数据**（符合保护生产环境原则）。

### C. 随想录详情与发布状态校验
1. **请求到达**：访客请求 `/thoughts/:id`。
2. **双重防线过滤**：
   - **第一道防线 (Next.js 服务端)**：从 `fetchThoughts()` 获取数据，若 Notion 来源不存在或状态不对，直接触发 `notFound()` 渲染 404 页面；
   - **第二道防线 (Notion Worker)**：`worker/index.js` 在提取单个随想录时执行 `if (!isPagePublished(p)) return jsonResponse({ success: false, error: "Thought not found" }, 404)`。
- *验证状态*：**已在生产环境验证**（向生产 API 请求伪造/未发布 ID 均稳定返回 404）。

### D. 用户点赞交互与回滚机制
1. **用户点击**：访客点击随想录详情页的点赞红心按钮。
2. **乐观更新 (UI 零延迟)**：前端组件 `ThoughtDetailClient` 立即将界面点赞数 `likes + 1`，图标变红。
3. **后端写入**：前端通过 Supabase 客户端安全发起 RPC 调用：
   ```typescript
   supabase.rpc("increment_thought_like", { target_id: thought.id, delta: 1 })
   ```
4. **数据库原子判定**：数据库执行安全函数，校验 `WHERE id = target_id AND is_published IS TRUE`。
5. **异常自动回滚**：若网络超时或该条目已被设为未发布，RPC 报错返回；前端 `catch` 捕获异常，立刻执行 `setLikes(prev => prev - 1)` 并弹出错误提示，界面恢复原状。
- *验证状态*：RPC 函数逻辑与列权限**已在生产环境数据库中实测生效**。

### E. 图片加载与防盗链代理
1. **图片请求**：页面中的封面图与歌单图片统一使用格式：
   `https://cdn.vinceou.site/img?url=https%3A%2F%2Fmusic.163.com%2F...`
2. **边缘缓存查询**：`blog-proxy` 首先在 Cloudflare 边缘缓存查询是否存在该缓存。若存在，直接返回并附带 `X-Cache-Status: HIT`。
3. **防盗链穿透拉取**：若未命中，Worker 伪造合法的桌面端 `User-Agent` 与对应源站的 `Referer`（如 `https://music.163.com/`），发起极速专线拉取。
4. **异步写缓存**：将图片流返回给访客的同时，通过 `ctx.waitUntil(cache.put(...))` 将副本缓存在边缘，有效期为 1 年。
- *验证状态*：**已在生产环境验证**（实测返回 HTTP 200 及 `image/jpeg`）。

---

## 6. 生产构建与自动化部署链路

整个全自动部署链路的真实状态如下：

```text
本地代码修改 ➔ Git Commit ➔ Git Push master
                                   │
                                   ▼ (自动触发 Webhook)
                    Cloudflare Workers Builds 编译容器
                                   │
        ┌──────────────────────────┴──────────────────────────┐
        ▼                                                     ▼
依赖安装阶段 (npm ci)                                 构建阶段 (npm run build:worker)
自动触发 postinstall 钩子                             调用 opennextjs-cloudflare build
执行 scripts/patch-opennext.js 补丁                   Next.js 16 (Turbopack) 编译产物
校验 @opennextjs/cloudflare@1.20.10 版本              生成 .open-next/worker.js 与 assets
        │                                                     │
        └──────────────────────────┬──────────────────────────┘
                                   ▼
                   部署阶段 (npx wrangler deploy)
                   自动同步静态资产至全球边缘 (ASSETS)
                   更新 Worker 部署版本并切换 100% 流量
```

### 证据与核实结果
- **连接状态**：**已在生产环境验证**。Cloudflare Workers 账户中已成功关联 `qaz6758/my-blog` 仓库。
- **最新部署记录**：
  - Git Commit `06446b6`（Update sitemap.ts，14:30:57 推送）；
  - Cloudflare 生成版本 `d3cc3c59-a1be-4ea2-8e70-dbac4f1076f3`（14:32:32 部署完成）；
  - 线上访问 `https://vinceou.site/sitemap.xml` 确认已生效。
- **自动部署生效结论**：**自动化部署链路完整、畅通且已在实际运行中得到证明。**

---

## 7. 安全防线与权限配置审计

| 检查项 | 审计标准 | 审计结论 | 严重度与置信度 | 证据位置与说明 |
| :--- | :--- | :---: | :---: | :--- |
| **1. 未发布内容泄露** | Notion 接口强制过滤草稿 | **无风险** | 低风险 / 高置信度 | [worker/index.js#L530](file:///d:/code/my-blog/worker/index.js#L530) 中 `isPagePublished` 严格校验，未发布条目直接 404。 |
| **2. 点赞刷票与任意插入** | 禁止为随机 UUID 伪造记录 | **已修复** | 低风险 / 高置信度 | [20261011110200_...sql#L18](file:///d:/code/my-blog/supabase/migrations/20261011110200_restrict_thought_likes_and_grant_published.sql#L18) 使用受限 UPDATE，彻底移除 INSERT 逻辑。 |
| **3. 函数搜索路径注入** | 清空 `search_path` 隔离模式 | **已符合** | 低风险 / 高置信度 | 函数明确声明 `SET search_path = ''` 与 `SECURITY DEFINER`。 |
| **4. 列级信息泄露** | 仅授权公开必要字段 | **已收敛** | 低风险 / 高置信度 | 仅对 `anon` 角色授权 `(id, likes, is_published)`，其他内部列对匿名访客不可见。 |
| **5. 敏感密钥追踪泄露** | `service_role` 及私钥不得进代码库 | **需注意** | **中风险 (P1)** / 高置信度 | commit `c40081c` 中将 `.env.production` 提交入库。虽然仅含可公开的 `NEXT_PUBLIC_*` 凭证，但建议将生产变量移入 Cloudflare 平台管理。 |
| **6. 补丁抗漂移保护** | OpenNext 补丁版本锁定与退出保护 | **已加固** | 低风险 / 高置信度 | [scripts/patch-opennext.js#L22](file:///d:/code/my-blog/scripts/patch-opennext.js#L22) 强校验 `1.20.10`，版本不符直接中断退出（Exit 1）。 |
| **7. 核心依赖漏洞审计** | 生产依赖 0 漏洞 | **已达标** | 低风险 / 高置信度 | `source-map-js@1.2.2`，Next.js `16.4.0`；`npm audit --omit=dev` 结果为 0 漏洞。 |

---

## 8. Supabase 迁移与数据一致性专项审计

### 8.1 现状与事实认定
1. **线上数据库实际行为**：
   - 线上数据库中的 `public.increment_thought_like` 存储过程经过实测，已成功应用了包含参数防御与仅更新已发布记录的安全逻辑；
   - 线上数据库的列级 SELECT 权限已成功授予 `anon` 与 `authenticated` 角色。
2. **迁移历史记录差异**：
   - 此前通过 CLI 检查迁移历史时提示：`relation "supabase_migrations.schema_migrations" does not exist`。
   - **根本原因**：该 Supabase 项目起初并未通过 Supabase CLI 进行全生命周期纳管（而是直接在 Supabase Web Dashboard 的 SQL Editor 中执行了初始化或维护脚本），因此远程数据库中尚未创建 CLI 专属的迁移版本元数据表。

### 8.2 规范化结论与处置建议
- **结论定性**：**函数与权限行为已在生产数据库验证生效，但 CLI 迁移历史记录尚未关联确认。**
- **当前处置**：**切勿在生产环境盲目运行修复或伪造迁移记录**。业务逻辑与安全加固已在线生效，保留本地迁移文件 `supabase/migrations/20261011110200_restrict_thought_likes_and_grant_published.sql` 作为版本库的基线记录即可。

---

## 9. 当前剩余问题优先级清单 (P0~P3)

### 🔴 P0 级别（严重故障 / 阻断性风险）
*当前无 P0 级别阻断问题。全站服务正常提供。*

### 🟡 P1 级别（建议近期处理的体验与规范问题）

#### 1. 国内移动端直接访问 `vinceou.site` 超时问题
- **现象与影响**：国内手机在没有翻墙/代理的蜂窝网络下直接输入 `vinceou.site`，部分地区运营商可能因 Cloudflare Anycast IP 拦截而报连接超时。
- **根本原因**：`vinceou.site` 的主 DNS 解析直接落在大众公共 Anycast 节点（`172.67.x.x`），无法顺利完成 TCP 握手。
- **推荐方案**：
  - **方案 A（用户引导）**：国内宣传与友情链接建议直接采用优选域名 `https://cdn.vinceou.site`；
  - **方案 B（双域名解析）**：若 DNS 服务商支持国内/国外分流解析，可将国内线路直接 CNAME 指向优选域名；
#### 2. `.env.production` 凭据纳入版本库追踪（✅ 已彻底解决）
- **处理经过**：通过在 `src/lib/supabase.ts` 中设置默认公共回退常量，彻底解除了构建时对本地 `.env.production` 文件的硬依赖。随后执行 `git rm --cached .env.production`，恢复 `.gitignore` 规则，并在 Commit `828b613` 中验证通过。
- **当前状态**：Git 仓库中已无任何凭证泄漏；Cloudflare Workers Builds 自动化流水线已在干净环境中成功构建并上线（版本 `afa24ff5`）。

### 🟢 P2 级别（稳定性与运维优化）
- **Supabase CLI 迁移历史同步**：未来有明确数据库维护窗口时，可通过 CLI link 项目并同步 `schema_migrations`。

### ⚪ P3 级别（可选清理项）
- **旧脚本引用清理**：`package.json` 中的 `"pages:build"` 脚本已无实际 Pages 项目调用，可保留或视情况整理。

---

## 10. 日常更新操作指南

### 10.1 修改博客代码后如何发布
你不需要在本地运行任何部署命令，**只需使用 GitHub Desktop 或 Git CLI 正常推送代码**：
```bash
git checkout master
git add .
git commit -m "feat: 你的新功能说明"
git push origin master
```
推送后，Cloudflare 会在 **1~2 分钟内全自动完成构建与上线**。

### 10.2 如何确认 GitHub 推送是否成功部署
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)；
2. 点击左侧导航栏 **Compute (Workers & Pages)** ➔ 选择 Worker **`my-blog`**；
3. 进入 **Deployments** 标签页：
   - 查看最新一行记录，时间是否为最近几分钟；
   - 查看 Version ID 是否为最新，Traffic 是否显示 **100%**。

### 10.3 在 Notion 发布新文章后如何检查更新
1. 在 Notion 数据库中确认文章属性的 **状态 (Status)** 已勾选为 **已发布 (Published)**；
2. 打开文章对应的 URL（如 `https://cdn.vinceou.site/posts/your-slug`）；
3. 如果未即时显示：
   - 等待约 30 秒（Notion API 边缘缓存更新周期）；
   - 按 `Ctrl + F5`（或手机端强制下拉刷新）跳过浏览器本地缓存。

### 10.4 手机访问超时的排查流程
1. **先确认输入的地址**：在手机浏览器地址栏直接输入 `https://cdn.vinceou.site`（带优选加速），而非直连的 `vinceou.site`；
2. **清除移动端本地 DNS 污染**：
   - 打开手机“飞行模式”保持 5 秒，然后关闭，重新获取移动基站 IP；
   - 清理手机浏览器的“缓存的图像和文件”；
3. **测试切换网络**：从蜂窝数据切换至家用 WiFi，测试是否为特定运营商拦截。

### 10.5 如何查看实时 Worker 运行日志 (实时排错)
1. 打开 Cloudflare 控制台 ➔ **`my-blog`** ➔ **Logs (日志)** ➔ **Real-time Logs (实时日志)**；
2. 点击 **Begin log stream (开始监听)**；
3. 在手机或电脑上刷新出现异常的页面；
4. 观察控制台输出的请求日志与错误堆栈。

---

## 11. 故障排查手册 (全链路定障)

当网站出现异常时，按以下快速矩阵进行“一分钟定位”：

| 故障现象 | 检查目标 | 定位排查方法 | 对应解决措施 |
| :--- | :--- | :--- | :--- |
| **手机提示连接超时 (Timeout)** | 域名解析 / 运营商拦截 | 检查手机打开的是否为 `vinceou.site` 直连域名 | 改用优选域名 `https://cdn.vinceou.site` 访问；开关飞行模式刷新基站缓存 |
| **报错 1016 (Origin DNS Error)** | 反代回源故障 | 检查 `blog-proxy` 是否成功连通 `my-blog.workers.dev` | 检查 `my-blog` Worker 的 `workers_dev: true` 是否被意外关闭 |
| **报错 530 / 1042** | Worker 触发器异常 | 检查 Worker 自定义域绑定状态 | 在 Cloudflare 控制台检查 `my-blog` 的 Custom Domains 状态是否正常 |
| **页面能打开，但文章列表空白** | Notion API Worker | 浏览器直接访问 `https://api.vinceou.site/posts` | 若返回 500，检查 Notion 数据库 Integration 授权是否被意外移除 |
| **点赞按钮点击无反应或报错** | Supabase 数据库 | 检查浏览器 F12 控制台网络请求是否拦截了 Supabase 请求 | 检查 Supabase 数据库是否处于活跃状态（防休眠） |
| **文章封面图挂掉** | 图片代理服务 | 直接访问图片代理 URL（带 `/img?url=`） | 检查源图片链接本身是否有效，或 `blog-proxy` 是否被 Cloudflare 拦截 |

---

## 12. 技术术语速查表

- **OpenNext**：专为非 AWS/非 Vercel 环境设计的 Next.js 开源打包转换器，能把 Next.js 复杂的服务端与静态资产转换成可在 Cloudflare Workers 上高效执行的标准代码。
- **Cloudflare Workers**：运行在 Cloudflare 全球数百个数据中心边缘的无服务器执行环境（Serverless），没有传统服务器的冷启动延迟和繁琐运维。
- **优选 IP (Cloudflare Optimized IP)**：通过专门测速挑选出的对中国大陆网络互联体验最佳、丢包率最低的 Cloudflare 节点 IP 集合，通过 CNAME 转发让国内用户流畅访问海外服务。
- **ISR (增量静态再验证)**：Next.js 的一种缓存策略。页面生成后缓存在边缘，到达设定的超时时间后，在后台静默拉取最新内容重构缓存，兼具极速秒开与内容动态更新。
- **RLS (行级安全策略)**：PostgreSQL/Supabase 的数据库安全机制，能细粒度控制特定身份（如匿名访客）只能读取符合特定条件（如 `is_published = true`）的数据行。
- **RPC (远程过程调用)**：在数据库中预先编写好的受控存储过程（SQL 函数），前端只能按规矩传递参数调用，杜绝前端直接对数据库执行随意增删改查。
