"use client";

import React, { useMemo, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import Loader from "../Loader";
import { Notification } from "@/type";
import {
  markOneStart,
  markOneSuccess,
  markOneFailure,
  markAllStart,
  markAllSuccess,
  markAllFailure,
} from "@/redux/notification/notificationSlice";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const Notifications = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  // Dữ liệu giờ đây được cung cấp tự động bởi NotificationProvider qua Redux
  const { items, loading } = useSelector((s: RootState) => s.notifications);

  const [marking, setMarking] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [open, setOpen] = useState(false);

  // unreadCount sẽ tự động cập nhật khi Redux state thay đổi
  const unreadCount = useMemo(
    () => items.filter((n) => n.status === "unread").length,
    [items]
  );

  // NotificationProvider sẽ lo việc fetch lần đầu và lắng nghe SSE.

  // Mark as read 1 cái -> update store ngay, đồng bộ với BE
  const markOne = async (id: string) => {
    try {
      setMarking(id);
      dispatch(markOneStart()); // Chỉ set error, không set loading toàn cục
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/notification/${id}/read`,
        { method: "PUT", credentials: "include" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to mark as read");
      }
      dispatch(markOneSuccess(id));
    } catch (err: any) {
      dispatch(markOneFailure(err.message || "Cannot mark as read"));
      toast.error(err.message || "Cannot mark as read");
    } finally {
      setMarking(null);
    }
  };

  // Mark all -> update store ngay, đồng bộ với BE
  const markAll = async () => {
    try {
      setMarkingAll(true);
      dispatch(markAllStart()); // Chỉ set error, không set loading toàn cục
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/notification/my/read_all`,
        { method: "PUT", credentials: "include" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to mark all as read");
      }
      dispatch(markAllSuccess());
    } catch (err: any) {
      dispatch(markAllFailure(err.message || "Cannot mark all as read"));
      toast.error(err.message || "Cannot mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  // UI cho item - Click vào item sẽ mark as read
  const ItemRow = (n: Notification) => {
    const isUnread = n.status === "unread";
    const isMarking = marking === n._id;

    return (
      <button
        key={n._id}
        onClick={() => {
          if (isUnread && !isMarking) {
            markOne(n._id);
          }
        }}
        disabled={isMarking}
        className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isUnread ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
          } ${isMarking ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${isUnread ? "bg-blue-600" : "bg-transparent"
              }`}
          />
          <div className="flex-1 min-w-0">
            <div
              className={`text-sm ${isUnread
                ? "font-semibold text-gray-900 dark:text-gray-100"
                : "font-normal text-gray-700 dark:text-gray-300"
                }`}
            >
              {n.title}
            </div>
            {n.message ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {n.message}
              </div>
            ) : null}
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
              {formatTimeAgo(new Date(n.createdAt))}
            </div>
          </div>

          {isMarking && (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400 flex-shrink-0 mt-1" />
          )}
        </div>
      </button>
    );
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
      }}
    >
      <DropdownMenuTrigger className="relative outline-none">
        <Bell className="w-5 h-5 hover:cursor-pointer text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors" />
        {/* 'unreadCount' sẽ tự động cập nhật từ Redux state */}
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-semibold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[380px] p-0">
        {/* Header */}
        <div className="px-4 py-3 border-b dark:border-slate-700">
          <div className="flex items-center justify-between">
            <DropdownMenuLabel className="p-0 text-base font-semibold">
              Notifications
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <button
                onClick={markAll}
                disabled={markingAll}
                className="text-xs inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-50"
                title="Mark all as read"
              >
                {markingAll ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {/* 'loading' này chỉ hiển thị khi Provider fetch lần đầu */}
          {loading ? (
            <div className="py-8">
              <Loader />
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No new notifications
              </p>
            </div>
          ) : (
            <div className="divide-y dark:divide-slate-700">
              {items.map(ItemRow)}
            </div>
          )}
        </div>

        {/* Footer - View All Button */}
        {items.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <div className="p-2">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/notifications");
                }}
                className="w-full py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30 rounded-md transition-colors"
              >
                View All Notifications
              </button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
