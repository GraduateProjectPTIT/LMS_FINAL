// Helper tạo id tạm cho section mới
export const generateTempId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `temp-${crypto.randomUUID()}`
        : `temp-${Date.now()}-${Math.random()}`;