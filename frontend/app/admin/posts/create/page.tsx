"use client";

import React from "react";
import PostCreateForm from "@/components/admin/posts/PostCreateForm";
import toast, { Toaster } from "react-hot-toast";

export default function CreatePostPage() {
  return (
    <div className="p-4">
      <Toaster position="top-right" />
      <PostCreateForm />
    </div>
  );
}
