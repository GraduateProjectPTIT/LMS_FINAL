'use client'

import React, { useState } from 'react';
import ImageCropModal from './ImageCropModal';
import ResultDisplay from './ResultDisplay';
import FaceUpload from './FaceUpload';
import ConsultMode from './ConsultMode';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import toast from 'react-hot-toast';

interface UIDisplay {
    style_name: string;
    description: string;
    tags: string[];
    difficulty: string;
}

interface BackendLogic {
    generation_prompt: string;
    technical_settings: {
        use_lens?: boolean;
        contour_nose?: boolean;
        contour_jaw?: boolean;
        heavy_blush?: boolean;
        skin_finish?: string;
        lip_finish?: string;
        makeup_intensity?: string;
    };
    tutorial_steps: string[];
    search_keywords: string[];
}

interface StyleOption {
    id: string;
    ui_display: UIDisplay;
    backend_logic: BackendLogic;
}

interface GenerateResult {
    result_url: string;
    tutorials: string[];
    courses: {
        id: string;
        name: string;
        price: string;
        tags: string[];
        thumbnail?: string;
    }[];
}

interface ResultHistoryItem {
    id: string;
    styleName: string;
    result: GenerateResult;
    timestamp: Date;
}

const MakeupForm = () => {
    // User Inputs
    const [userFace, setUserFace] = useState<File | null>(null);
    const [userFacePreview, setUserFacePreview] = useState<string>('');

    // AI Consultation State
    const [userRequest, setUserRequest] = useState('');
    const [userPrompt, setUserPrompt] = useState('');
    const [isConsulting, setIsConsulting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [styleOptions, setStyleOptions] = useState<StyleOption[]>([]);
    const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);

    // History Management
    const [resultHistory, setResultHistory] = useState<ResultHistoryItem[]>([]);
    const [activeResultIndex, setActiveResultIndex] = useState(0);

    // Crop Modal State
    const [showCropModal, setShowCropModal] = useState(false);
    const [tempImage, setTempImage] = useState('');

    // ========== Event Handlers ==========

    const handleFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedFile: File) => {
        setUserFace(croppedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
            setUserFacePreview(reader.result as string);
        };
        reader.readAsDataURL(croppedFile);
        setShowCropModal(false);
    };

    const handleCropCancel = () => {
        setShowCropModal(false);
        setTempImage('');
    };

    // Call API to get style suggestions from user description
    const handleConsultStyles = async () => {
        if (!userRequest.trim()) {
            toast.error('Please describe what makeup style you want');
            return;
        }

        setIsConsulting(true);
        setStyleOptions([]);
        setSelectedStyle(null);

        try {
            const formData = new FormData();
            formData.append('user_request', userRequest);

            const response = await fetch(`${process.env.NEXT_PUBLIC_AI_BASE_URL}/vto/consult-styles`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to consult styles');
            }

            const data = await response.json();
            setStyleOptions(data.styles || []);

            if (data.styles && data.styles.length > 0) {
                toast.success(`AI suggested ${data.styles.length} makeup styles for you!`);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to get style suggestions');
        } finally {
            setIsConsulting(false);
        }
    };

    // Call API to generate makeup based on selected style
    const handleGenerateMakeup = async () => {
        if (!userFace) {
            toast.error('Please upload your face photo');
            return;
        }

        if (!selectedStyle) {
            toast.error('Please select a style from suggestions');
            return;
        }

        setIsGenerating(true);

        try {
            const formData = new FormData();
            formData.append('user_face', userFace);

            // Send backend_logic data to API
            formData.append('prompt_override', selectedStyle.backend_logic.generation_prompt);
            formData.append('tutorial_override', JSON.stringify(selectedStyle.backend_logic.tutorial_steps));
            formData.append('keywords_override', JSON.stringify(selectedStyle.backend_logic.search_keywords));
            formData.append('technical_settings', JSON.stringify(selectedStyle.backend_logic.technical_settings));

            if (userPrompt.trim()) {
                formData.append('user_prompt', userPrompt);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_AI_BASE_URL}/vto/generate-makeup`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to generate makeup');
            }

            const data = await response.json();

            // Add to history
            const newHistoryItem: ResultHistoryItem = {
                id: `result-${Date.now()}`,
                styleName: selectedStyle.ui_display.style_name,
                result: data,
                timestamp: new Date()
            };

            setResultHistory(prev => [newHistoryItem, ...prev]);
            setActiveResultIndex(0);

            toast.success('Makeup applied successfully!');

        } catch (err: any) {
            toast.error(err.message || 'Failed to generate makeup');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRemoveResult = (index: number) => {
        setResultHistory(prev => prev.filter((_, i) => i !== index));
        if (activeResultIndex >= index && activeResultIndex > 0) {
            setActiveResultIndex(prev => prev - 1);
        }
    };

    const handleClearAllResults = () => {
        setResultHistory([]);
        setActiveResultIndex(0);
    };

    // ========== Render ==========

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    AI Virtual Try-On Makeup
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Describe your desired look and let AI create it for you
                </p>
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Panel - Input Section */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                        {/* Face Upload */}
                        <FaceUpload
                            preview={userFacePreview}
                            onUpload={handleFaceUpload}
                            onRemove={() => {
                                setUserFace(null);
                                setUserFacePreview('');
                            }}
                        />

                        {/* Consult Mode */}
                        <ConsultMode
                            userRequest={userRequest}
                            onRequestChange={setUserRequest}
                            onConsult={handleConsultStyles}
                            isConsulting={isConsulting}
                            styleOptions={styleOptions}
                            selectedStyle={selectedStyle}
                            onStyleSelect={setSelectedStyle}
                            userPrompt={userPrompt}
                            onPromptChange={setUserPrompt}
                            onApplyStyle={handleGenerateMakeup}
                            isGenerating={isGenerating}
                            hasUserFace={!!userFace}
                        />
                    </div>
                </div>

                {/* Right Panel - Result Section */}
                <div className="lg:sticky lg:top-6 lg:self-start">
                    {isGenerating && <LoadingState />}

                    {!isGenerating && resultHistory.length > 0 && (
                        <ResultDisplay
                            history={resultHistory}
                            activeIndex={activeResultIndex}
                            onTabChange={setActiveResultIndex}
                            onRemove={handleRemoveResult}
                            onClearAll={handleClearAllResults}
                        />
                    )}

                    {!isGenerating && resultHistory.length === 0 && <EmptyState />}
                </div>
            </div>

            {/* Crop Modal */}
            {showCropModal && (
                <ImageCropModal
                    image={tempImage}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                    aspectRatio={1}
                />
            )}
        </div>
    );
};

export default MakeupForm;