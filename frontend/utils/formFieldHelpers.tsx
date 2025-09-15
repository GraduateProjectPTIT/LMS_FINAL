import { IoAlertCircleOutline, IoCheckmarkCircleOutline } from "react-icons/io5";

// Kiểu dữ liệu cho trạng thái của 1 field: mặc định, lỗi, thành công
export type FieldStatus = 'default' | 'error' | 'success';

function normalizeTouched(val: unknown): boolean {
    if (typeof val === 'boolean') return val;
    if (Array.isArray(val)) return val.some(normalizeTouched);
    if (val && typeof val === 'object') return Object.values(val as Record<string, unknown>).some(normalizeTouched);
    return false;
}

/**
 * Hàm xác định trạng thái của 1 field trong form
 * @param fieldName - tên field cần kiểm tra
 * @param touchedFields - object chứa thông tin field nào đã được chạm vào (từ react-hook-form)
 * @param errors - object chứa lỗi validate (từ react-hook-form)
 * @param watchedFields - giá trị hiện tại của các field (từ react-hook-form)
 * @param options - tùy chọn thêm (ví dụ: field là array thì check độ dài array)
 * @returns 'default' | 'error' | 'success'
 */
export function getFieldStatus<T extends Record<string, any>>(
    fieldName: keyof T,
    // NHẬN unknown để không bị kẹt type RHF đa dạng
    touchedFields: unknown,
    errors: unknown,
    watchedFields: Partial<T>,
    options?: { isArrayField?: boolean }
): FieldStatus {
    // Truy cập field theo string-key; nếu không có thì undefined
    const tf = (touchedFields as Record<string, unknown> | undefined)?.[fieldName as string];
    const err = (errors as Record<string, unknown> | undefined)?.[fieldName as string];
    const value = watchedFields[fieldName];

    if (options?.isArrayField) {
        const hasValue = Array.isArray(value) && value.length > 0;
        const touchedOk = normalizeTouched(tf);
        if (!touchedOk || !hasValue) return 'default';
        if (err) return 'error';
        return 'success';
    }

    const hasValue = value !== undefined && value !== null && value.toString().length > 0;
    const touchedOk = normalizeTouched(tf);
    if (!touchedOk || !hasValue) return 'default';
    if (err) return 'error';
    return 'success';
}

// Hàm trả về class CSS cho border dựa trên trạng thái field
export function getFieldBorderClass(status: FieldStatus) {
    switch (status) {
        case 'error':
            return 'border-red-400'; // border màu đỏ khi có lỗi
        case 'success':
            return 'border-green-400'; // border màu xanh khi hợp lệ
        default:
            return 'border-gray-300 dark:border-gray-500'; // border mặc định
    }
}

// Hàm trả về icon tương ứng với trạng thái field
export function getFieldIcon(status: FieldStatus) {
    if (status === 'error') {
        return <IoAlertCircleOutline className="text-red-500 text-lg" />; // icon lỗi
    }
    if (status === 'success') {
        return <IoCheckmarkCircleOutline className="text-green-500 text-lg" />; // icon thành công
    }
    return null; // mặc định không hiện icon
}

export function preprocessStringToNumber(val: unknown): number | string | undefined {
    // Nếu giá trị trống hoặc null/undefined → trả về undefined (sẽ trigger required_error)
    if (val === "" || val === null || val === undefined) {
        return undefined;
    }

    // Nếu đã là number → trả về trực tiếp
    if (typeof val === "number") {
        return isNaN(val) ? "INVALID_NUMBER" : val;
    }

    // Nếu là string → xử lý
    if (typeof val === "string") {
        const trimmed = val.trim();

        // Nếu string rỗng sau khi trim → undefined
        if (trimmed === "") {
            return undefined;
        }

        // Kiểm tra xem string có phải là số hợp lệ không
        // Regex cho phép: số nguyên, số thập phân, số âm
        const numberRegex = /^-?\d+(\.\d+)?$/;
        if (!numberRegex.test(trimmed)) {
            return "INVALID_NUMBER"; // Trả về string để trigger invalid_type_error
        }

        // Parse thành số
        const num = parseFloat(trimmed);

        // Nếu không parse được → invalid
        if (isNaN(num)) {
            return "INVALID_NUMBER";
        }

        // Trả về số hợp lệ (bao gồm cả số âm)
        return num;
    }

    // Các kiểu dữ liệu khác → invalid
    return "INVALID_NUMBER";
}
