<div align="center">

# OW · Digital Garden

> **“大道至简，衍化至繁。”**

一个属于自己的数字空间。
写字、听歌、看照片，也记录那些正在发生的思考。

Built with **Next.js · React · TypeScript · Tailwind CSS · Supabase · Notion**

[**vinceou.site ↗**](https://vinceou.site)

</div>

---

## About

OW 是一个以 **阅读、表达与个人记录** 为核心的数字花园。

我不希望它只是一个博客，也不希望它成为一个堆满组件与动画的作品集。

所以这里尽量保持简单：

**文字是主体，留白是空间，交互保持克制。**

设计上受到 Anthony Fu 的极简排版与 Innei 的个人表达方式启发，但最终呈现出的视觉语言属于自己。

---

## What lives here

**文章**
用于记录技术、开发、思考与一些长期积累的东西。

**Thoughts**
比文章更轻的片段，记录那些不值得写成长文，却值得留下来的想法。

**Gallery**
照片与生活碎片。一个安静的视觉角落。

**Playlist**
让音乐成为这个空间的一部分，而不是一个独立的播放器页面。

**Live Status**
展示此刻正在做什么，让这个网站拥有一点真实的“在场感”。

---

## Design

我更在意这些：

* **Typography** — 让文字承担主要的视觉表达
* **Whitespace** — 用留白建立秩序，而不是用卡片填满页面
* **Restraint** — 动画存在，但不会打扰阅读
* **Atmosphere** — 昼夜、季节、音乐与照片共同构成空间感

整个网站遵循一个很简单的原则：

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
| Deployment | Vercel                     |

Notion 负责内容，Supabase 负责动态数据，其余部分尽可能保持简单。

---

## Structure

```text
OW
├── Home        个人主页
├── Posts       长篇文章
├── Thoughts    碎片记录
├── Gallery     摄影
├── Playlist    音乐
└── About       关于
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
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

NOTION_API_KEY=your-notion-api-key
NOTION_POSTS_DB_ID=your-posts-database-id
NOTION_THOUGHTS_DB_ID=your-thoughts-database-id
```

生产构建：

```bash
npm run build
```

---

<div align="center">

© 2026 Vince Ou · OW

**Made slowly, with intention.**

</div>
