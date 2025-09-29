"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function PublicPostsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (p = page, l = limit) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/public/posts?page=${p}&limit=${l}`;
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Lỗi tải dữ liệu");
      setRows(json?.paginatedResult?.data || []);
      setTotalPages(json?.paginatedResult?.meta?.totalPages || 0);
    } catch (e: any) {
      setError(e?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page, limit);
  }, [page, limit]);

  const canPrev = page > 1;
  const canNext = totalPages > 0 && page < totalPages;

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bài viết</h1>
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : rows.length === 0 ? (
        <div className="text-gray-500">Chưa có bài viết</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rows.map((post: any) => (
            <Link key={post._id} href={`/posts/${post.slug}`} className="border rounded-md overflow-hidden hover:shadow">
              {post.coverImage?.url && (
                <img src={post.coverImage.url} alt={post.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="font-semibold line-clamp-2 mb-2">{post.title}</div>
                <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</div>
                {post.tags?.length > 0 && (
                  <div className="text-xs mt-2 text-gray-600">{post.tags.join(", ")}</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          disabled={!canPrev}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          « Trước
        </button>
        <div className="text-sm text-gray-600">Trang {page}/{Math.max(totalPages, 1)}</div>
        <button
          disabled={!canNext}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          Sau »
        </button>
      </div>
    </div>
  );
}
