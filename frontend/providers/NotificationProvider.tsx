"use client";

import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import { prependOne, setConnected } from "@/redux/notification/notificationSlice";
import toast from "react-hot-toast";

/**
 * Provider mở duy nhất 1 kết nối SSE cho toàn app khi user đã đăng nhập.
 * Chỉ lo phần real-time (push). Phần fetch/mark sẽ xử lý ở component/hook.
 */
const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const dispatch = useDispatch();
    const { currentUser, isLoggedIn } = useSelector((s: RootState) => s.user);
    const esRef = useRef<EventSource | null>(null);

    useEffect(() => {
        // Chưa đăng nhập -> đóng SSE nếu đang mở
        if (!isLoggedIn || !currentUser) {
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }
            dispatch(setConnected(false));
            return;
        }

        // Tránh mở nhiều connection
        if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
        }

        const url = `${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/notification/stream`;
        try {
            const es = new EventSource(url, { withCredentials: true } as any);
            esRef.current = es;

            es.onopen = () => {
                dispatch(setConnected(true));
            };

            es.onerror = () => {
                // SSE tự retry; vẫn set false để UI biết đang mất kết nối
                dispatch(setConnected(false));
            };

            es.addEventListener("new_notification", (e: MessageEvent) => {
                try {
                    const notif = JSON.parse(e.data);
                    // tuân theo BE: chỉ push vào khi status là unread
                    if (notif?.status === "unread") {
                        dispatch(prependOne(notif));
                        toast.success(notif.title || "New notification");
                    }
                } catch {
                    // ignore malformed
                }
            });
        } catch {
            dispatch(setConnected(false));
        }

        return () => {
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }
            dispatch(setConnected(false));
        };
    }, [dispatch, isLoggedIn, currentUser]);

    return <>{children}</>;
};

export default NotificationProvider;
