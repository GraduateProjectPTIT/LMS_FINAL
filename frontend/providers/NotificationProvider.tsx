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
import toast from "react-hot-toast";

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const dispatch = useDispatch();
    const { currentUser, isLoggedIn } = useSelector((s: RootState) => s.user);

    const esRef = useRef<EventSource | null>(null);
    const activeRef = useRef<boolean>(false);    // chặn callback sau khi đóng
    const prefetchedRef = useRef<boolean>(false); // đảm bảo prefetch 1 lần cho mỗi kết nối

    useEffect(() => {
        // --- Handler phải khai báo trước khi dùng để TS không cảnh báo ---
        const onNewNotification = (e: MessageEvent) => {
            if (!activeRef.current || !isLoggedIn) return;
            try {
                const notif = JSON.parse(e.data);
                if (notif?.status === "unread") {
                    dispatch(prependOne(notif));
                    toast.success(notif.title || "New notification");
                }
            } catch {
                // ignore
            }
        };

        // Chưa login → cleanup & return
        if (!isLoggedIn || !currentUser) {
            activeRef.current = false;
            prefetchedRef.current = false;
            if (esRef.current) {
                try {
                    const h = (esRef.current as any).__onNewNotification;
                    if (h) esRef.current.removeEventListener("new_notification", h);
                } catch { }
                esRef.current.close();
                esRef.current = null;
            }
            dispatch(setConnected(false));
            return;
        }

        // Tránh mở nhiều connection
        if (esRef.current) {
            try {
                const h = (esRef.current as any).__onNewNotification;
                if (h) esRef.current.removeEventListener("new_notification", h);
            } catch { }
            esRef.current.close();
            esRef.current = null;
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
                            { method: "GET", credentials: "include" }
                        );
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.message || "Failed to load notifications");
                        // GHÉP dữ liệu lần đầu vào store
                        dispatch(fetchSuccess(data.notifications || []));
                    } catch (err: any) {
                        dispatch(fetchFailure(err.message || "Cannot load notifications"));
                    }
                }
            };

            es.onerror = () => {
                if (!activeRef.current) return;
                dispatch(setConnected(false));
                // Không close ở đây; để SSE tự retry. Khi logout, cleanup sẽ đóng.
            };

            es.addEventListener("new_notification", onNewNotification);
            (esRef.current as any).__onNewNotification = onNewNotification;
        } catch {
            dispatch(setConnected(false));
        }

        // Cleanup khi deps thay đổi / unmount
        return () => {
            activeRef.current = false;
            if (esRef.current) {
                try {
                    const h = (esRef.current as any).__onNewNotification;
                    if (h) esRef.current.removeEventListener("new_notification", h);
                } catch { }
                esRef.current.close();
                esRef.current = null;
            }
            dispatch(setConnected(false));
        };
    }, [dispatch, isLoggedIn, currentUser]);

    return <>{children}</>;
};

export default NotificationProvider;
