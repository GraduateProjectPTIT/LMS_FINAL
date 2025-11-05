"use client";

import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import {
  prependOne,
  setConnected,
  fetchStart,
  fetchSuccess,
  fetchFailure,
} from "@/redux/notification/notificationSlice";

// Tên sự kiện phải khớp với backend
const SSE_EVENT_NAME = "NEW_NOTIFICATION";

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
  const { currentUser, isLoggedIn } = useSelector((s: RootState) => s.user);

  const esRef = useRef<EventSource | null>(null); // dùng để quản lý kết nối SSE (mở, đóng, cleanup)
  const activeRef = useRef<boolean>(false); // đánh dấu trạng thái kết nối SSE có đang hoạt động không
  const prefetchedRef = useRef<boolean>(false); // đánh dấu đã lấy dữ liệu thông báo chưa

  useEffect(() => {

    // --- Lắng nghe sự kiện mới ---
    const onNewNotification = (e: MessageEvent) => {
      if (!activeRef.current || !isLoggedIn) return;
      try {
        const notif = JSON.parse(e.data);

        if (notif?.status === "unread" && notif?.title) {
          dispatch(prependOne(notif)); // Thêm thông báo mới vào redux store
        }
      } catch {
        // ignore
      }
    };

    // --- Cleanup function (dùng ở nhiều nơi) ---
    const cleanup = () => {
      activeRef.current = false;
      prefetchedRef.current = false;
      if (esRef.current) {
        try {
          esRef.current.removeEventListener(SSE_EVENT_NAME, onNewNotification);
        } catch { }
        esRef.current.close();
        esRef.current = null;
      }
      dispatch(setConnected(false));
    };

    // Chưa login → cleanup & return
    if (!isLoggedIn || !currentUser) {
      cleanup();
      return;
    }

    // Tránh mở nhiều connection (chạy cleanup trước khi tạo cái mới)
    if (esRef.current) {
      cleanup();
    }

    const url = `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/notification/stream`;
    try {
      const es = new EventSource(url, { withCredentials: true } as any);
      esRef.current = es;
      activeRef.current = true;
      prefetchedRef.current = false; // reset cờ cho kết nối mới

      es.onopen = async () => {
        if (!activeRef.current || !isLoggedIn) return;
        dispatch(setConnected(true));

        // Prefetch ngay khi kết nối SSE đã mở (mỗi kết nối chỉ 1 lần)
        if (!prefetchedRef.current) {
          prefetchedRef.current = true;
          try {
            dispatch(fetchStart());
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/notification/my?status=unread&page=1&limit=20`,
              {
                method: "GET",
                credentials: "include"
              }
            );
            const data = await res.json();
            if (!res.ok)
              throw new Error(data?.message || "Failed to load notifications");

            dispatch(fetchSuccess(data.notifications || []));
          } catch (err: any) {
            dispatch(fetchFailure(err.message || "Cannot load notifications"));
          }
        }
      };

      es.onerror = () => {
        if (!activeRef.current) return;
        dispatch(setConnected(false));
      };

      es.addEventListener(SSE_EVENT_NAME, onNewNotification);
    } catch (err: any) {
      console.error("[SSE] Failed to create EventSource:", err.message);
      dispatch(setConnected(false));
    }

    // Cleanup khi deps thay đổi / unmount
    return () => {
      cleanup();
    };
  }, [dispatch, isLoggedIn, currentUser._id]);

  return <>{children}</>;
};

export default NotificationProvider;
