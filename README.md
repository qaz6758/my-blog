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

OW 是一个以 **记录、表达与生活** 为核心的个人空间。

这里有文章、随想、照片与音乐，也保留一些正在进行中的东西。

它不追求把页面填满，也不追求用复杂的交互证明什么。

**文字是主体，留白是空间，交互保持克制。**

设计上受到 Anthony Fu 的极简排版与 Innei 的个人表达方式启发，但最终形成属于自己的视觉语言。

---

## Spaces

**Posts**
记录技术、开发、思考，以及一些值得长期留下来的内容。

**Thoughts**
比文章更轻的记录。捕捉那些短暂出现，却值得保存的想法。

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
