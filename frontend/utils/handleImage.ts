import MissingImage from "@/public/missing_image.jpg"

export const getValidThumbnail = (thumbnailUrl?: string) => {
    return thumbnailUrl || MissingImage;
}

export const isValidImageUrl = (url: string): boolean => {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
};