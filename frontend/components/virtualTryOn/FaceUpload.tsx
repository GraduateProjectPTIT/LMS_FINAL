'use client'

import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

interface FaceUploadProps {
    preview: string;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
}

const FaceUpload = ({ preview, onUpload, onRemove }: FaceUploadProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Upload Your Face Photo *
            </label>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={onUpload}
                className="hidden"
            />

            {preview ? (
                <div className="relative">
                    <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-slate-600">
                        <Image
                            src={preview}
                            alt="Your face"
                            fill
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <button
                        onClick={onRemove}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => inputRef.current?.click()}
                    className="w-full h-64 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-slate-900/50"
                >
                    <Upload className="w-12 h-12 text-gray-400" />
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Click to upload your photo
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            PNG, JPG up to 10MB
                        </p>
                    </div>
                </button>
            )}
        </div>
    );
};

export default FaceUpload;