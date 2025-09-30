"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import axiosInstance from "@/utils/axiosInstance";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const Editor = dynamic(async () => (await import("@tinymce/tinymce-react")).Editor, {
  ssr: false,
});

export default function PostCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("<p></p>");
  const [tags, setTags] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [submitting, setSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string>("");

  const tinymceApiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "no-api-key";

  const handleUploadImage = async (blobInfo: any) => {
    const form = new FormData();
    form.append("file", blobInfo.blob(), blobInfo.filename());
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/post/upload-image`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = await res.json();
    if (!res.ok || !data?.location) {
      throw new Error(data?.message || "Upload failed");
    }
    return data.location as string;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Vui lòng nhập tiêu đề");
    if (!contentHtml || contentHtml === "<p></p>") return toast.error("Vui lòng nhập nội dung");

    setSubmitting(true);
    try {
      let coverImage: string | undefined = undefined;
      if (coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/post/upload-image`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data?.location) throw new Error("Upload cover failed");
        coverImage = data.location;
      } else if (coverUrl) {
        coverImage = coverUrl;
      }

      const payload = {
        title: title.trim(),
        contentHtml,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status,
        ...(coverImage ? { coverImage } : {}),
      };

      await axiosInstance.post("/api/post", payload);
      toast.success("Tạo bài viết thành công");
      router.push("/admin/posts");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Tạo bài viết</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Tiêu đề</label>
        <input
          type="text"
          className="w-full border rounded-md px-3 py-2 dark:bg-slate-900"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tiêu đề"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Ảnh bìa</label>
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
          <span className="text-sm text-gray-500">hoặc</span>
          <input
            type="text"
            placeholder="Dán URL ảnh"
            className="flex-1 border rounded-md px-3 py-2 dark:bg-slate-900"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Nội dung</label>
        <Editor
          apiKey={tinymceApiKey}
          value={contentHtml}
          onEditorChange={(val) => setContentHtml(val)}
          init={{
            height: 500,
            menubar: true,
            plugins: [
              "advlist",
              "autolink",
              "lists",
              "link",
              "image",
              "charmap",
              "preview",
              "anchor",
              "searchreplace",
              "visualblocks",
              "code",
              "fullscreen",
              "insertdatetime",
              "media",
              "table",
              "help",
              "wordcount",
            ],
            toolbar:
              "undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | image media link | code | help",
            images_upload_handler: handleUploadImage,
            images_file_types: "jpg,jpeg,png,gif,webp",
            automatic_uploads: true,
            convert_urls: false,
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Tags (ngăn cách bằng dấu phẩy)</label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 dark:bg-slate-900"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="ví dụ: tinymce, lms, blog"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Trạng thái</label>
          <select
            className="w-full border rounded-md px-3 py-2 dark:bg-slate-900"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="draft">Nháp</option>
            <option value="published">Xuất bản</option>
          </select>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
        >
          {submitting ? "Đang lưu..." : "Tạo bài viết"}
        </button>
      </div>
    </form>
  );
}
