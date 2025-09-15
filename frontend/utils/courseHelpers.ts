// tách chuỗi comma thành mảng, loại bỏ rỗng
export const splitComma = (val: string): string[] =>
    val.split(",").map(s => s.trim()).filter(Boolean);

// check trùng (case-insensitive)
export const hasDuplicatesCI = (arr: string[]): boolean => {
    const seen = new Set<string>();
    for (const x of arr) {
        const k = x.toLowerCase();
        if (seen.has(k)) return true;
        seen.add(k);
    }
    return false;
};

// regex cho từng tag
export const tagRegex = /^[A-Za-z0-9\s\-&]+$/;

// Hàm tiện ích để "escape" các ký tự đặc biệt trong regex
export const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& nghĩa là toàn bộ chuỗi đã khớp
};