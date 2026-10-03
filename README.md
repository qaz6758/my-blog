<div align="center">

# OW · Digital Garden

> **“大道至简，衍化至繁。”**

一个属于自己的数字空间。
写字、听歌、相册，也记录那些正在发生的思考。

Built with **Next.js · React · TypeScript · Tailwind CSS · Supabase · Notion**

[**vinceou.site ↗**](https://vinceou.site)

</div>

---

## About

OW 是一个以 **记录、表达与生活** 为核心的个人空间。

这里有随笔、随想、相册与音乐，也保留一些正在进行中的东西。

它不追求把页面填满，也不追求用复杂的交互证明什么。

**文字是主体，留白是空间，交互保持克制。**

设计上受到 Anthony Fu 的极简排版与 Innei 的个人表达方式启发。

---

## Spaces

**Posts**
记录技术、开发、思考，以及一些值得长期留下来的内容。

**Thoughts**
比随笔更轻的记录。捕捉那些短暂出现，却值得保存的想法。

**Gallery**
照片与生活碎片，一个安静的视觉角落。

**Playlist**
让音乐自然地存在于网站之中，并贯穿整个浏览过程。

**Live Status**
记录此刻正在做什么，让一个静态网站多一点真实的在场感。

---

## Design

我更在意这些：

* **Typography** — 让文字承担主要的视觉表达
* **Whitespace** — 用留白建立秩序，而不是用组件填满页面
* **Restraint** — 动画存在，但不打扰阅读
* **Atmosphere** — 昼夜、季节、音乐与照片共同构成空间

整个网站遵循一个简单的原则：

> **能删掉的，就不留下。**

---

## Technology

| Layer      | Technology                 |
| ---------- | -------------------------- |
| Framework  | Next.js 16 · React 19      |
| Language   | TypeScript                 |
| Styling    | Tailwind CSS v4            |
| Content    | Notion API                 |
| Database   | Supabase / PostgreSQL      |
| Markdown   | ReactMarkdown · remark-gfm |
| Animation  | Framer Motion              |
| Deployment | Cloudflare                 |

Notion 负责内容，Supabase 负责动态数据，其余部分尽可能保持简单。

---

## Supabase 安全迁移

部署包含评论、随想点赞的版本前，请先备份数据库，并在 Supabase Dashboard 的 SQL Editor 中执行 [安全迁移](./supabase/migrations/20260927203000_harden_public_blog_data.sql)。迁移会收紧公开表权限和 RLS、限制点赞 RPC，并将已有评论邮箱与用户 ID 移至不可由 `anon` / `authenticated` 访问的 `blog_private` schema；公开评论记录中的这两项会被清空。不要把 `blog_private` schema 加入 Supabase 的 API exposed schemas。

## 酷狗概念版歌词回退

逐词歌词会依次尝试现有歌词源、免登录酷狗 KRC，以及可选的酷狗概念版 KRC 回退。概念版回退需要有效的概念版登录 Cookie；在 Cloudflare Pages 项目设置中将 `KUGOU_CONCEPT_COOKIE` 配置为 Secret。此凭证只由 `/api/lyrics` 服务端读取，不要使用 `NEXT_PUBLIC_` 前缀、提交到仓库或发送给浏览器。概念版 Cookie 与普通酷狗客户端凭证不通用；接口为非官方社区方案，凭证可能失效，且不保证每首歌都有逐词歌词。

在 Windows 本机获取凭证时，先确保已安装 Node.js 和 Git，在项目根目录运行：

```bash
npm run kugou:login
```

首次运行会从固定版本的社区 KuGouMusicApi 下载登录组件及其依赖到用户系统目录，自动打开本机二维码页面。使用酷狗概念版扫码并确认后，工具会把凭证写入项目根目录的 `.env.local`，不会打印凭证。完成后将该值作为 Cloudflare Pages Secret `KUGOU_CONCEPT_COOKIE` 配置，再重新构建部署。此工具会在本机运行社区开源代码；请只在信任该社区项目的前提下运行。

---

## Structure

```text
OW
├── Home        个人主页
├── Posts       长篇文章
├── Thoughts    碎片记录
├── Gallery     摄影
└── Playlist    音乐
```

---

## Development

```bash
git clone https://github.com/qaz6758/my-blog.git
cd my-blog

npm install --legacy-peer-deps
npm run dev
```

创建 `.env.local`：

```env
NEXT_PUBLIC_SITE_URL=https://vinceou.site

NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

NOTION_API_KEY=your-notion-api-key
NOTION_POSTS_DB_ID=your-posts-database-id
NOTION_THOUGHTS_DB_ID=your-thoughts-database-id

# Optional: raw Cookie string from a logged-in Kugou Concept account.
# Keep this value private and do not commit it.
KUGOU_CONCEPT_COOKIE=
```

生产构建：

```bash
npm run build
npm run lint
```

---

<div align="center">

© 2026 Vince Ou · OW

**Made slowly, with intention.**

</div>
