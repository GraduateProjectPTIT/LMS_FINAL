"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PostDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/public/posts/${slug}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Không tải được bài viết");
        setPost(json.post);
      } catch (e: any) {
        setError(e?.message || "Không tải được bài viết");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) return <div className="container py-8">Đang tải...</div>;
  if (error) return <div className="container py-8 text-red-500">{error}</div>;
  if (!post) return <div className="container py-8">Không tìm thấy bài viết</div>;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-3">{post.title}</h1>
      <div className="text-sm text-gray-500 mb-6">
        {new Date(post.createdAt).toLocaleString()} · {post.authorId?.name}
      </div>
      {post.coverImage?.url && (
        <img src={post.coverImage.url} alt={post.title} className="w-full max-h-96 object-cover rounded-md mb-6" />
      )}
      <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
    </div>
  );
}
