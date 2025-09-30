"use client";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";

type Author = { name?: string; email?: string };
type PostRow = {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  authorId?: Author;
};

export default function AdminPostsPage() {
  const [rows, setRows] = useState<PostRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (p = page, l = limit) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/post", { params: { page: p, limit: l } });
      const data = res.data?.paginatedResult?.data ?? [];
      const meta = res.data?.paginatedResult?.meta ?? {};
      setRows(data);
      setTotalPages(meta.totalPages ?? 0);
      setTotalItems(meta.totalItems ?? 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Lỗi tải dữ liệu");
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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Posts</h1>
        <Link
          href="/admin/posts/create"
          className="px-4 py-2 rounded-md bg-blue-600 text-white"
        >
          Tạo bài viết
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm">Hiển thị</label>
        <select
          className="border rounded px-2 py-1 dark:bg-slate-900"
          value={limit}
          onChange={(e) => {
            setPage(1);
            setLimit(parseInt(e.target.value, 10));
          }}
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">Tổng: {totalItems}</span>
      </div>

      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-slate-800">
            <tr>
              <th className="text-left p-3">Tiêu đề</th>
              <th className="text-left p-3">Trạng thái</th>
              <th className="text-left p-3">Tags</th>
              <th className="text-left p-3">Tác giả</th>
              <th className="text-left p-3">Tạo lúc</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={5}>Đang tải...</td>
              </tr>
            ) : error ? (
              <tr>
                <td className="p-3 text-red-500" colSpan={5}>{error}</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3 text-gray-500" colSpan={5}>Chưa có bài viết</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-gray-500">/{r.slug}</div>
                  </td>
                  <td className="p-3">
                    <span className={
                      r.status === "published"
                        ? "px-2 py-1 text-xs rounded bg-green-100 text-green-700"
                        : "px-2 py-1 text-xs rounded bg-gray-100 text-gray-700"
                    }>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {r.tags && r.tags.length > 0 ? r.tags.join(", ") : "-"}
                  </td>
                  <td className="p-3">{r.authorId?.name || "-"}</td>
                  <td className="p-3">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          disabled={!canPrev}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          « Trước
        </button>
        <div className="text-sm text-gray-600">
          Trang {page}/{Math.max(totalPages, 1)}
        </div>
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
