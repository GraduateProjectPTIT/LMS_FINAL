import { useCallback, useMemo, useRef } from "react";
import Fuse from "fuse.js";
import { IBaseCategory } from "@/type";

/** Các từ dừng (stop words) cần loại bỏ trong quá trình xử lý văn bản */
const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'this', 'that', 'these', 'those'
]);

/** normalize: chuyển về chữ thường + loại bỏ ký tự đặc biệt + gộp nhiều khoảng trắng */
const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

/** Tiền xử lý văn bản nâng cao với việc loại bỏ từ dừng */
const preprocessText = (text: string) => {
    const normalized = normalize(text);
    const tokens = normalized.split(" ")
        .filter(token => token.length > 1 && !STOP_WORDS.has(token));
    return tokens;
};

/** Tạo n-grams (2–3 từ) để bắt được cụm từ như "bridal looks", "skin prep" */
const buildNGrams = (tokens: string[], min = 2, max = 3) => {
    const grams: string[] = [];
    for (let n = min; n <= max; n++) {
        for (let i = 0; i + n <= tokens.length; i++) {
            grams.push(tokens.slice(i, i + n).join(" "));
        }
    }
    return grams;
};

/** Trích xuất keywords + n-grams từ description với mức ưu tiên nâng cao */
const buildQueriesFromDescription = (description: string) => {
    const tokens = preprocessText(description);

    if (tokens.length === 0) return [];

    // Ưu tiên: cụm 3 từ trước → cụm 2 từ → cuối cùng mới đến từ đơn
    const queries = [
        ...buildNGrams(tokens, 3, 3), // cụm 3 từ trước (ưu tiên cao nhất)
        ...buildNGrams(tokens, 2, 2), // tiếp theo là cụm 2 từ
        ...tokens.slice(0, 5)         // giới hạn số từ đơn để tránh nhiễu
    ];

    return [...new Set(queries)]; // Remove duplicates
};

/** Kết quả gợi ý kèm theo độ tin cậy và loại khớp */
interface SuggestionResult {
    id: string;
    confidence: number; // 0-1 scale
    matchType: 'exact' | 'phrase' | 'fuzzy';
}

export function useCategoryAutofill(allCategories: IBaseCategory[]) {
    // Khởi tạo chỉ mục Fuse một lần dựa trên allCategories
    const fuse = useMemo(() => {
        return new Fuse(allCategories, {
            keys: ["title"],
            threshold: 0.3,      // chặt chẽ hơn một chút để tăng độ chính xác
            distance: 80,        // giảm để chỉ tập trung vào các kết quả gần
            includeScore: true,  // kèm theo điểm số để xếp hạng
            minMatchCharLength: 2, // bỏ qua các khớp quá ngắn
            shouldSort: true,    // để Fuse tự xử lý việc sắp xếp ban đầu
        });
    }, [allCategories]);

    // Cache để tối ưu hiệu năng
    const queryCache = useMemo(() => new Map<string, string[]>(), []);
    const debounceRef = useRef<number | null>(null);

    /** Hàm gợi ý nâng cao với cách tính điểm có trọng số */
    const suggest = useCallback(
        (description: string, perQueryLimit = 3, maxSuggestions = 10) => {
            if (!description.trim()) return [];

            // Kiểm tra cache trước
            const cacheKey = description.toLowerCase();
            if (queryCache.has(cacheKey)) {
                const cached = queryCache.get(cacheKey)!;
                return cached.slice(0, maxSuggestions);
            }

            const queries = buildQueriesFromDescription(description);

            // Tính trọng số: n-gram sẽ được ưu tiên cao hơn
            const weightedScores = new Map<string, { score: number, isNGram: boolean }>();

            queries.forEach((query, index) => {
                const isNGram = query.includes(" ");
                const results = fuse.search(query, { limit: perQueryLimit });

                results.forEach(r => {
                    const id = r.item._id;
                    const baseScore = r.score ?? 1;

                    // Tăng điểm cho n-gram, giảm điểm cho các query về sau
                    const weight = isNGram ? 0.8 : 1.0;
                    const positionPenalty = index * 0.05;
                    const adjustedScore = baseScore * weight + positionPenalty;

                    const existing = weightedScores.get(id);
                    if (!existing || adjustedScore < existing.score) {
                        weightedScores.set(id, { score: adjustedScore, isNGram });
                    }
                });
            });

            const result = [...weightedScores.entries()]
                .sort((a, b) => {
                    // Ưu tiên n-gram trước, sau đó mới xét điểm
                    if (a[1].isNGram !== b[1].isNGram) {
                        return a[1].isNGram ? -1 : 1;
                    }
                    return a[1].score - b[1].score;
                })
                .map(([id]) => id)
                .slice(0, maxSuggestions);

            // Lưu vào cache
            queryCache.set(cacheKey, result);
            return result;
        },
        [fuse, queryCache]
    );

    /** Gợi ý kèm theo độ tin cậy và loại khớp */
    const suggestWithConfidence = useCallback(
        (description: string, perQueryLimit = 3, maxSuggestions = 10): SuggestionResult[] => {
            if (!description.trim()) return [];

            const queries = buildQueriesFromDescription(description);
            const weightedScores = new Map<string, { score: number, isNGram: boolean }>();

            queries.forEach((query, index) => {
                const isNGram = query.includes(" ");
                const results = fuse.search(query, { limit: perQueryLimit });

                results.forEach(r => {
                    const id = r.item._id;
                    const baseScore = r.score ?? 1;

                    const weight = isNGram ? 0.8 : 1.0;
                    const positionPenalty = index * 0.05;
                    const adjustedScore = baseScore * weight + positionPenalty;

                    const existing = weightedScores.get(id);
                    if (!existing || adjustedScore < existing.score) {
                        weightedScores.set(id, { score: adjustedScore, isNGram });
                    }
                });
            });

            return [...weightedScores.entries()]
                .sort((a, b) => {
                    if (a[1].isNGram !== b[1].isNGram) {
                        return a[1].isNGram ? -1 : 1;
                    }
                    return a[1].score - b[1].score;
                })
                .map(([id, data]): SuggestionResult => {
                    const score = data.score;
                    let matchType: 'exact' | 'phrase' | 'fuzzy';

                    if (score < 0.1) {
                        matchType = 'exact';
                    } else if (data.isNGram) {
                        matchType = 'phrase';
                    } else {
                        matchType = 'fuzzy';
                    }

                    return {
                        id,
                        confidence: Math.max(0, 1 - score),
                        matchType
                    };
                })
                .slice(0, maxSuggestions);
        },
        [fuse]
    );

    /** Tự động điền category: gộp với các category đã có, giới hạn số lượng */
    const autoFill = useCallback(
        (description: string, currentIds: string[], max = 5) => {
            const suggested = suggest(description);
            const merged = Array.from(new Set([...currentIds, ...suggested]));
            return merged.slice(0, max);
        },
        [suggest]
    );

    /** Xoá cache thủ công khi cần */
    const clearCache = useCallback(() => {
        queryCache.clear();
    }, [queryCache]);

    return {
        autoFill,
        suggest,
        suggestWithConfidence,
        clearCache
    };
}