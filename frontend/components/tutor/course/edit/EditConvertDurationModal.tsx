"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditConvertDurationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConvert: (seconds: number) => void;
}

const EditConvertDurationModal = ({ isOpen, onClose, onConvert }: EditConvertDurationModalProps) => {
    const [timeInput, setTimeInput] = useState('');
    const [convertedSeconds, setConvertedSeconds] = useState<number | null>(null);

    if (!isOpen) return null;

    const parseTimeToSeconds = (input: string): number | null => {
        // Remove all spaces
        const cleanInput = input.trim();

        // Pattern for hh:mm:ss or mm:ss
        const timePattern = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/;
        const match = cleanInput.match(timePattern);

        if (!match) {
            return null;
        }

        const hours = match[3] ? parseInt(match[1], 10) : 0;
        const minutes = match[3] ? parseInt(match[2], 10) : parseInt(match[1], 10);
        const seconds = match[3] ? parseInt(match[3], 10) : parseInt(match[2], 10);

        // Validate ranges
        if (minutes >= 60 || seconds >= 60) {
            return null;
        }

        return hours * 3600 + minutes * 60 + seconds;
    };

    const handleConvert = () => {
        const seconds = parseTimeToSeconds(timeInput);

        if (seconds === null) {
            toast.error('Invalid format. Please use mm:ss or hh:mm:ss format (e.g., 5:30 or 1:05:30)');
            return;
        }

        if (seconds <= 0) {
            toast.error('Duration must be greater than 0');
            return;
        }

        setConvertedSeconds(seconds);
    };

    const handleApply = () => {
        if (convertedSeconds !== null) {
            onConvert(convertedSeconds);
            handleClose();
        }
    };

    const handleClose = () => {
        setTimeInput('');
        setConvertedSeconds(null);
        onClose();
    };

    const formatSecondsToTime = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Convert Duration to Seconds
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            Enter Duration
                        </Label>
                        <Input
                            value={timeInput}
                            onChange={(e) => setTimeInput(e.target.value)}
                            placeholder="mm:ss or hh:mm:ss (e.g., 5:30)"
                            className="border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleConvert();
                                }
                            }}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Format: mm:ss (e.g., 5:30) or hh:mm:ss (e.g., 1:05:30)
                        </p>
                    </div>

                    {/* Convert Button */}
                    <Button
                        type="button"
                        onClick={handleConvert}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                        Convert
                    </Button>

                    {/* Result */}
                    {convertedSeconds !== null && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Converted Result:</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {convertedSeconds} seconds
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        ({formatSecondsToTime(convertedSeconds)})
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1 hover:cursor-pointer dark:hover:bg-slate-600"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleApply}
                        disabled={convertedSeconds === null}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        Apply
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EditConvertDurationModal;