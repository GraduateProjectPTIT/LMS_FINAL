"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Loader from "../Loader";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  markOneStart,
  markOneSuccess,
  markOneFailure,
  markAllStart,
  markAllSuccess,
  markAllFailure,
} from "@/redux/notification/notificationSlice";
import AllNotificationsPagination from "./AllNotificationsPagination";

interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

const AllNotifications = () => {
  const dispatch = useDispatch();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [marking, setMarking] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const [meta, setMeta] = useState<PaginationMeta>({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10
  });

  const { items: dropdownItems } = useSelector((s: RootState) => s.notifications);

  const unreadCount = useMemo(
    () => dropdownItems.filter((n) => n.status === "unread").length,
    [dropdownItems]
  );

  const fetchNotifications = useCallback(async (page: number, limit: number) => {
    try {
      setLoading(true);
      const status = activeTab === "unread" ? "unread" : "all";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/notification/my?status=${status}&page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load notifications");
      }

      const paginatedResult = data.paginatedResult || {};
      setItems(paginatedResult.data || []);

      const metaData = paginatedResult.meta || {};
      setMeta({
        totalItems: metaData.totalItems || 0,
        totalPages: metaData.totalPages || 1,
        currentPage: metaData.currentPage || 1,
        pageSize: metaData.pageSize || 10
      });
    } catch (err: any) {
      console.error("Failed to fetch notifications:", err);
      toast.error(err.message || "Cannot load notifications");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchNotifications(meta.currentPage, meta.pageSize);
  }, [meta.currentPage, meta.pageSize, activeTab]);

  const handlePageChange = (newPage: number) => {
    setMeta(prev => ({ ...prev, currentPage: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Đánh dấu đọc 1 notification
  const markOne = async (id: string) => {
    try {
      setMarking(id);
      dispatch(markOneStart());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/notification/${id}/read`,
        {
          method: "PUT",
          credentials: "include"
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to mark as read");
      }

      // 1. Dispatch tới Redux (để dropdown cập nhật)
      dispatch(markOneSuccess(id));

      // 2. Cập nhật state cục bộ (để UI trang này cập nhật)
      setItems(prevItems =>
        prevItems.map(item => item._id === id ? { ...item, status: 'read' } : item)
      );

      toast.success("Marked as read");
    } catch (err: any) {
      dispatch(markOneFailure(err.message || "Cannot mark as read"));
      toast.error(err.message || "Cannot mark as read");
    } finally {
      setMarking(null);
    }
  };

  // Đánh dấu đọc tất cả notifications
  const markAll = async () => {
    try {
      setMarkingAll(true);
      dispatch(markAllStart());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/notification/my/read_all`,
        {
          method: "PUT",
          credentials: "include"
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to mark all as read");
      }

      // 1. Dispatch tới Redux (để dropdown cập nhật)
      dispatch(markAllSuccess());

      // 2. Cập nhật state cục bộ (để UI trang này cập nhật)
      setItems(prevItems =>
        prevItems.map(item => ({ ...item, status: 'read' }))
      );

      toast.success("All notifications marked as read");
    } catch (err: any) {
      dispatch(markAllFailure(err.message || "Cannot mark all as read"));
      toast.error(err.message || "Cannot mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Notifications
          </h1>
        </div>

        {/* Tabs and Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border dark:border-slate-700">
          <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => {
                  setActiveTab("all");
                  setMeta(prev => ({ ...prev, currentPage: 1 }));
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "all"
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setActiveTab("unread");
                  setMeta(prev => ({ ...prev, currentPage: 1 }));
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors relative ${activeTab === "unread"
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mark All Button */}
            {unreadCount > 0 && (
              <button
                onClick={markAll}
                disabled={markingAll}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30 rounded-lg transition-colors disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="divide-y dark:divide-slate-700">
            {loading ? (
              <div className="py-12">
                <Loader />
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center">
                <Bell className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-1">
                  No notifications
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  {activeTab === "unread"
                    ? "You're all caught up! No unread notifications."
                    : "You don't have any notifications yet."}
                </p>
              </div>
            ) : (
              <>
                {items.map((n) => {
                  const isUnread = n.status === "unread";

                  return (
                    <div
                      key={n._id}
                      onClick={() => markOne(n._id)}
                      className={`group p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${isUnread ? "bg-blue-50/30 dark:bg-blue-950/10" : ""
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Unread Indicator */}
                        <div
                          className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${isUnread ? "bg-blue-600" : "bg-transparent"
                            }`}
                        />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-base mb-1 ${isUnread
                              ? "font-semibold text-gray-900 dark:text-gray-100"
                              : "font-normal text-gray-700 dark:text-gray-300"
                              }`}
                          >
                            {n.title}
                          </div>
                          {n.message && (
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                              {n.message}
                            </div>
                          )}
                          <div className="text-xs text-slate-500 dark:text-slate-500">
                            {formatTimeAgo(new Date(n.createdAt))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                <AllNotificationsPagination
                  currentPage={meta.currentPage}
                  totalPages={Math.max(meta.totalPages, 1)}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllNotifications;