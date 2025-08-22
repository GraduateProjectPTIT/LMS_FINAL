"use client"

import { useState, useEffect, useCallback } from 'react';

const SEARCH_HISTORY_KEY = 'lms_search_history';
const MAX_HISTORY_LENGTH = 10;

export const useSearchHistory = () => {
    // Sử dụng hàm khởi tạo cho useState để chỉ đọc localStorage một lần duy nhất
    const [history, setHistory] = useState<string[]>(() => {
        // Kiểm tra xem code có đang chạy trên trình duyệt không
        if (typeof window === 'undefined') {
            return [];
        }
        try {
            const storedHistory = window.localStorage.getItem(SEARCH_HISTORY_KEY);
            return storedHistory ? JSON.parse(storedHistory) : [];
        } catch (error) {
            console.error("Lỗi khi đọc lịch sử tìm kiếm từ localStorage:", error);
            return [];
        }
    });

    // Sử dụng useEffect để đồng bộ state với localStorage mỗi khi history thay đổi
    useEffect(() => {
        try {
            window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.error("Lỗi khi lưu lịch sử tìm kiếm vào localStorage:", error);
        }
    }, [history]);


    const addHistory = useCallback((term: string) => {
        const trimmedTerm = term.trim();
        if (!trimmedTerm) return; // Bỏ qua nếu từ khóa rỗng

        setHistory(prevHistory => {
            // Lọc bỏ từ khóa cũ (không phân biệt hoa thường)
            const filteredHistory = prevHistory.filter(
                (item) => item.toLowerCase() !== trimmedTerm.toLowerCase()
            );
            // Thêm từ khóa mới vào đầu và giới hạn độ dài
            const newHistory = [trimmedTerm, ...filteredHistory];
            return newHistory.slice(0, MAX_HISTORY_LENGTH);
        });
    }, []);

    const removeHistory = useCallback((termToRemove: string) => {
        setHistory(prevHistory =>
            prevHistory.filter(
                (item) => item.toLowerCase() !== termToRemove.toLowerCase()
            )
        );
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    return { history, addHistory, removeHistory, clearHistory };
};