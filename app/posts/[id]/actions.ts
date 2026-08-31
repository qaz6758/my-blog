"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// 1. 发布文章
export async function createPost(formData: {
  title: string;
  category: string;
  tags: string;
  summary: string;
  content: string;
}) {
  const { title, category, tags, summary, content } = formData;

  if (!title || !content) {
    return { success: false, error: "标题和正文不能为空！" };
  }

  console.log("【正在写入 Supabase】:", { title, category });

  const { data, error } = await supabase
    .from("posts")
    .insert([
      {
        title,
        category: category || "随笔",
        tags: tags || "折腾",
        summary: summary || content.slice(0, 100),
        content,
      },
    ])
    .select();

  if (error) {
    console.error("【Supabase 写入失败】:", error);
    return { success: false, error: error.message };
  }

  console.log("【Supabase 写入成功】:", data);
  revalidatePath("/");
  return { success: true };
}

// 2. 提交评论
export async function addComment(postId: number, author: string, content: string) {
  if (!author || !content) return;

  const { error } = await supabase.from("comments").insert([
    {
      post_id: postId,
      author,
      content,
    },
  ]);

  if (error) {
    console.error("【Supabase 评论写入失败】:", error);
    return;
  }

  revalidatePath(`/posts/${postId}`);
}

