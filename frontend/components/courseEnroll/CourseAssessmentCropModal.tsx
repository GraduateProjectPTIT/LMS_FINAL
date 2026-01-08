'use client'

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, RotateCw } from 'lucide-react';

interface CourseAssessmentCropModalProps {
    image: string;
    onCropComplete: (croppedImage: File) => void;
    onCancel: () => void;
}

const CourseAssessmentCropModal = ({
    image,
    onCropComplete,
    onCancel
}: CourseAssessmentCropModalProps) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop: any) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createCroppedImage = async () => {
        try {
            const croppedImage = await getCroppedImg(
                image,
                croppedAreaPixels,
                rotation
            );
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">

            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/10 backdrop-blur-sm"
                onClick={onCancel}
                style={{ zIndex: 0 }}
            />

            <div className="relative z-10 bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Crop Your Assessment Photo
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="relative w-full h-[400px] bg-gray-900">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={1}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropCompleteHandler}
                    />
                </div>

                {/* Controls */}
                <div className="p-6 space-y-4">
                    {/* Zoom Control */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Zoom: {zoom.toFixed(1)}x
                        </label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* Rotation Control */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRotate}
                            className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <RotateCw className="w-4 h-4" />
                            Rotate 90°
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Current: {rotation}°
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-6 py-3 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={createCroppedImage}
                            className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" />
                            Apply Crop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// dùng để tạo ảnh từ url
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

// dùng để cắt ảnh và trả về file ảnh
async function getCroppedImg(
    imageSrc: string,
    pixelCrop: any,
    rotation = 0
): Promise<File> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas'); // tạo canvas để vẽ ảnh
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    // SafeArea là vùng vuông đủ lớn để chứa toàn bộ ảnh khi xoay (tránh bị cắt góc khi rotate).
    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    // Dịch chuyển tâm canvas về giữa, xoay theo góc rotation, rồi dịch chuyển lại về gốc
    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    // Đảm bảo ảnh nằm chính giữa canvas sau khi xoay
    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    // chuyển canvas thành file ảnh png
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], 'assessment-photo.png', {
                    type: 'image/png'
                });
                resolve(file);
            }
        }, 'image/png');
    });
}

export default CourseAssessmentCropModal;