"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Eye, Upload } from "lucide-react";
import Link from "next/link";
import PostPreview from "./PostPreview";

const Editor = dynamic(async () => (await import("@tinymce/tinymce-react")).Editor, {
  ssr: false,
});

export default function PostCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("<p></p>");
  const [shortDescription, setShortDescription] = useState("");
  const [tags, setTags] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [submitting, setSubmitting] = useState(false);
  const [coverImage, setCoverImage] = useState<string>("");
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  const tinymceApiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY;

  // dành cho các image ở trong trình soạn thảo
  const handleUploadImage = async (blobInfo: any) => {
    const form = new FormData();
    form.append("file", blobInfo.blob(), blobInfo.filename());

    try {
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
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload image");
      throw error;
    }
  };

  const maxMB = 2;
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

  const processCoverImageFile = (file: File) => {
    // Chỉ cho phép file ảnh
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed!");
      return;
    }

    // Check loại file
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, JPEG, and PNG formats are accepted!");
      return;
    }

    // Giới hạn dung lượng ảnh
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`Image size must not exceed ${maxMB}MB!`);
      return;
    }

    // Đọc file và chuyển thành base64
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverPreview(reader.result);
        setCoverImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  const [dragging, setDragging] = useState(false);

  const handleDragOver = (e: any) => {
    e.preventDefault();
    setDragging(true);
  }

  const handleDragLeave = (e: any) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCoverImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processCoverImageFile(file);
    }
  }

  const removeImage = () => {
    setCoverImage("");
    setCoverPreview("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!contentHtml || contentHtml === "<p></p>") {
      toast.error("Please enter content");
      return;
    }

    setSubmitting(true);

    try {
      // Prepare payload
      const payload = {
        title: title.trim(),
        contentHtml,
        shortDescription: shortDescription.trim() || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status,
        coverImage,
      };

      // Create post
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create post");
      }

      toast.success("Post created successfully");
      router.push("/admin/posts");
    } catch (err: any) {
      toast.error(err?.message || "An error occurred");
      console.error("Create post error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen theme-mode">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/posts">
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  Back
                </Button>
              </Link>

              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Create New Post
              </h1>

            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={submitting}
                onClick={() => setShowPreview(true)}
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                type="submit"
                size="sm"
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={submitting}
                onClick={onSubmit}
              >
                <Save className="h-4 w-4" />
                {submitting ? "Saving..." : "Save Post"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-4 py-2 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title..."
                required
              />
            </div>

            {/* Short Description */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Short Description
              </label>
              <textarea
                className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-4 py-2 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief description of the post (displayed in post listings)..."
                rows={4}
              />
            </div>

            {/* Content Editor */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content <span className="text-red-500">*</span>
              </label>
              <Editor
                apiKey={tinymceApiKey}
                value={contentHtml}
                onEditorChange={(val) => setContentHtml(val)}
                init={{
                  height: 600,
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
                    "undo redo | blocks | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | image media link | code | help",
                  images_upload_handler: handleUploadImage,
                  images_file_types: "jpg,jpeg,png,gif,webp",
                  automatic_uploads: true,
                  convert_urls: false,
                  content_style: "body { font-family: Arial, sans-serif; font-size: 14px; }",
                }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-4 py-2 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {status === "draft"
                  ? "Post will be saved as draft"
                  : "Post will be published publicly"}
              </p>
            </div>

            {/* Cover Image */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Cover Image
              </label>

              <input
                id="cover-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
                  ${dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}
                  hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {coverPreview ? (
                  <>
                    <div className="rounded-lg relative overflow-hidden w-full shadow-md border dark:border-gray-700">
                      <div className="w-full h-64 relative">
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <label
                        htmlFor="cover-file-input"
                        className="text-xs text-blue-600 cursor-pointer dark:text-blue-400 hover:underline"
                      >
                        Change image
                      </label>
                      <p
                        onClick={removeImage}
                        className="text-xs text-red-500 dark:text-red-400 cursor-pointer hover:underline"
                      >
                        Delete image
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Drag and drop an image here, or{' '}
                      <label
                        htmlFor="cover-file-input"
                        className="text-blue-600 cursor-pointer dark:text-blue-400 hover:underline"
                      >
                        browse
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG, JPEG (max 2MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-4 py-2 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. react, nodejs, tutorial"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Separate tags with commas
              </p>
            </div>
          </div>
        </div>
      </form>

      <PostPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={title}
        contentHtml={contentHtml}
        shortDescription={shortDescription}
        tags={tags}
        coverImage={coverImage}
        status={status}
      />
    </div>
  );
}