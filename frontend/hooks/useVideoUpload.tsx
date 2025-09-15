"use client";

import { useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { UploadSignatureResponse, IVideoUpload } from "@/type";

type ProgressMap = { [key: string]: number };
type UploadingMap = { [key: string]: boolean };
type Cancellable = { abort: () => void };

// Nếu video > 100MB thì dùng chunk
const CHUNK_THRESHOLD = 100 * 1024 * 1024;
// Mỗi chunk gửi lên ~20MB
const CHUNK_SIZE = 20 * 1024 * 1024;

export const useVideoUpload = () => {
    const [uploadProgress, setUploadProgress] = useState<ProgressMap>({});
    const [isUploading, setIsUploading] = useState<UploadingMap>({});

    // Lưu AbortController cho từng uploadId để có thể cancel
    const controllersRef = useRef<Record<string, Cancellable | undefined>>({});
    const lastUploadIdRef = useRef<string | null>(null);

    // Cleanup function - moved to top and made useCallback for optimization
    const cleanup = useCallback((uploadId: string) => {
        setIsUploading((prev) => {
            const newState = { ...prev };
            delete newState[uploadId];
            return newState;
        });
        setUploadProgress((prev) => {
            const newState = { ...prev };
            delete newState[uploadId];
            return newState;
        });
        if (controllersRef.current[uploadId]) {
            controllersRef.current[uploadId] = undefined;
        }
    }, []);

    // Gọi BE để lấy chữ ký upload từ Cloudinary
    const generateUploadSignature = async (): Promise<UploadSignatureResponse | null> => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/course/generate-upload-signature`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || "Failed to generate upload signature");
                return null;
            }
            return data;
        } catch (error: any) {
            toast.error("Failed to generate upload signature");
            console.error(error);
            return null;
        }
    };

    /**
     * Upload file nhỏ (<= 100MB)
     * → dùng XMLHttpRequest để bắt sự kiện onprogress
     */
    const uploadSmall = (uploadId: string, file: File, signatureData: UploadSignatureResponse, onProgress?: (p: number) => void) => {
        return new Promise<IVideoUpload>((resolve, reject) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", signatureData.apiKey);
            formData.append("timestamp", signatureData.timestamp.toString());
            formData.append("signature", signatureData.signature);
            formData.append("folder", signatureData.folder);
            formData.append("resource_type", "video");

            const xhr = new XMLHttpRequest();

            // LƯU để có thể cancel
            controllersRef.current[uploadId] = { abort: () => xhr.abort() };

            xhr.upload.onprogress = (evt) => {
                if (evt.lengthComputable) {
                    const p = Math.round((evt.loaded / evt.total) * 100);
                    setUploadProgress(prev => ({ ...prev, [uploadId]: p }));
                    onProgress?.(p);
                }
            };

            xhr.onabort = () => {
                cleanup(uploadId); // Use cleanup function
                reject(new Error("Upload cancelled"));
            };

            xhr.onload = () => {
                cleanup(uploadId); // Use cleanup function
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve({ public_id: response.public_id, url: response.secure_url });
                    } catch {
                        reject(new Error("Parse upload response failed"));
                    }
                } else {
                    reject(new Error(`Upload failed with status: ${xhr.status}`));
                }
            };

            xhr.onerror = () => {
                cleanup(uploadId); // Use cleanup function
                reject(new Error("Upload failed"));
            };

            xhr.open("POST", `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`);
            xhr.send(formData);
        });
    };

    /**
     * Upload file lớn (> 100MB)
     * → chia thành nhiều chunk, gửi lần lượt
     */
    const uploadChunked = async (
        uploadId: string,
        file: File,
        signatureData: UploadSignatureResponse,
        onProgress?: (p: number) => void
    ): Promise<IVideoUpload> => {
        const uniqueUploadId = `${Date.now()}-${Math.random()}`;
        const url = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`;
        const size = file.size;
        let offset = 0;

        const controller = new AbortController();
        controllersRef.current[uploadId] = { abort: () => controller.abort() };

        let lastResponseJson: any = null;

        try {
            while (offset < size) {
                const chunkEnd = Math.min(offset + CHUNK_SIZE, size);
                const blob = file.slice(offset, chunkEnd);

                const formData = new FormData();
                formData.append("file", blob);
                formData.append("api_key", signatureData.apiKey);
                formData.append("timestamp", signatureData.timestamp.toString());
                formData.append("signature", signatureData.signature);
                formData.append("folder", signatureData.folder);
                formData.append("resource_type", "video");

                const res = await fetch(url, {
                    method: "POST",
                    body: formData,
                    headers: {
                        "X-Unique-Upload-Id": uniqueUploadId,
                        "Content-Range": `bytes ${offset}-${chunkEnd - 1}/${size}`,
                    },
                    signal: controller.signal,
                });

                if (!res.ok) {
                    // Try to parse error response
                    let errorMessage = `Chunk upload failed at bytes ${offset}-${chunkEnd - 1}`;
                    try {
                        const errorJson = await res.json();
                        if (errorJson?.error?.message) {
                            errorMessage = errorJson.error.message;
                        }
                    } catch {
                        // If can't parse error, use default message
                        errorMessage = `HTTP ${res.status}: ${errorMessage}`;
                    }
                    throw new Error(errorMessage);
                }

                lastResponseJson = await res.json();

                // Update progress
                const percent = Math.round((chunkEnd / size) * 100);
                setUploadProgress((prev) => ({ ...prev, [uploadId]: percent }));
                onProgress?.(percent);

                offset = chunkEnd;
            }

            cleanup(uploadId);

            if (!lastResponseJson?.public_id || !lastResponseJson?.secure_url) {
                throw new Error("Upload completed but missing required response data");
            }

            return {
                public_id: lastResponseJson.public_id,
                url: lastResponseJson.secure_url,
            };
        } catch (error: any) {
            cleanup(uploadId);
            throw error; // Re-throw to be handled by uploadVideo
        }
    };

    /**
     * Hàm chính: tự động chọn upload thường hoặc chunk
     */
    const uploadVideo = async (
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<IVideoUpload | null> => {
        const uploadId = `${Date.now()}-${Math.random()}`;
        lastUploadIdRef.current = uploadId;

        try {
            if (!file.type.startsWith("video/")) {
                toast.error("Only video files are allowed");
                return null;
            }

            setIsUploading((prev) => ({ ...prev, [uploadId]: true }));
            setUploadProgress((prev) => ({ ...prev, [uploadId]: 0 }));

            const signatureData = await generateUploadSignature();
            if (!signatureData) throw new Error("Failed to get upload signature");

            const result =
                file.size >= CHUNK_THRESHOLD
                    ? await uploadChunked(uploadId, file, signatureData, onProgress)
                    : await uploadSmall(uploadId, file, signatureData, onProgress);

            return result;
        } catch (error: any) {
            // Cleanup is already called in individual upload methods
            const msg = String(error?.message || "");
            const isCancelled = error?.name === "AbortError" || msg.toLowerCase().includes("cancelled");

            if (!isCancelled) {
                toast.error(error?.message || "Video upload failed");
            }
            return null;
        }
    };

    const cancelCurrentUpload = () => {
        const id = lastUploadIdRef.current;
        if (id && controllersRef.current[id]) {
            controllersRef.current[id]?.abort();
        }
    };

    return {
        uploadVideo,    // Hàm upload video
        uploadProgress, // % tiến độ cho từng uploadId
        isUploading,    // Trạng thái đang upload cho từng uploadId
        cancelCurrentUpload, // hủy upload hiện hành
    };
};