// src/app/posts/[slug]/PostDetailClient.tsx
'use client';

import React from 'react';
import { DynamicPostReader, PostDetail } from '@/components/post/DynamicPostReader';

interface PostDetailClientProps {
  post: PostDetail | null;
  prevPost: PostDetail | null;
  nextPost: PostDetail | null;
}

export default function PostDetailClient({ post, prevPost, nextPost }: PostDetailClientProps) {
  return (
    <DynamicPostReader
      post={post}
      prevPost={prevPost}
      nextPost={nextPost}
    />
  );
}