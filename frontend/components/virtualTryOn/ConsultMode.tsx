'use client'

import React from 'react';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

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

interface ConsultModeProps {
    userRequest: string;
    onRequestChange: (value: string) => void;
    onConsult: () => void;
    isConsulting: boolean;
    styleOptions: StyleOption[];
    selectedStyle: StyleOption | null;
    onStyleSelect: (style: StyleOption) => void;
    userPrompt: string;
    onPromptChange: (value: string) => void;
    onApplyStyle: () => void;
    isGenerating: boolean;
    hasUserFace: boolean;
}

const ConsultMode = ({
    userRequest,
    onRequestChange,
    onConsult,
    isConsulting,
    styleOptions,
    selectedStyle,
    onStyleSelect,
    userPrompt,
    onPromptChange,
    onApplyStyle,
    isGenerating,
    hasUserFace
}: ConsultModeProps) => {
    return (
        <>
            {/* AI Consultation Input */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Describe Your Desired Look *
                </label>
                <textarea
                    value={userRequest}
                    onChange={(e) => onRequestChange(e.target.value)}
                    placeholder="E.g., I want a natural look for daily office wear, or a glamorous evening party makeup..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
            </div>

            {/* Consult Button */}
            <button
                onClick={onConsult}
                disabled={isConsulting || !userRequest.trim()}
                className="w-full px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isConsulting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        AI is Thinking...
                    </>
                ) : (
                    <>
                        <Sparkles className="w-5 h-5" />
                        Get AI Suggestions
                    </>
                )}
            </button>

            {/* Style Options Display */}
            {styleOptions.length > 0 && (
                <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        AI Suggested Styles ({styleOptions.length})
                    </h3>
                    <div className="space-y-3">
                        {styleOptions.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => onStyleSelect(style)}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedStyle?.id === style.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Style Name */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                {style.ui_display.style_name}
                                            </h4>
                                            {selectedStyle?.id === style.id && (
                                                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                            )}
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            {style.ui_display.description}
                                        </p>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {style.ui_display.tags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 rounded-full font-medium"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Difficulty */}
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-semibold text-blue-500 dark:text-blue-400">
                                                Difficulty:
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${style.ui_display.difficulty === 'Easy'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                : style.ui_display.difficulty === 'Medium'
                                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                }`}>
                                                {style.ui_display.difficulty}
                                            </span>
                                        </div>

                                        {/* Technical Settings (Optional Enhancement Display) */}
                                        {style.backend_logic.technical_settings && (
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600">
                                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    ✨ AI Enhancements:
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {/* Display active technical settings */}
                                                    {Object.entries(style.backend_logic.technical_settings).map(([key, value]) => {
                                                        if (value === true) {
                                                            const displayName = key
                                                                .split('_')
                                                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                                .join(' ');

                                                            return (
                                                                <span
                                                                    key={key}
                                                                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                                                                >
                                                                    {displayName}
                                                                </span>
                                                            );
                                                        }

                                                        // Display string settings
                                                        if (typeof value === 'string') {
                                                            return (
                                                                <span
                                                                    key={key}
                                                                    className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full"
                                                                >
                                                                    {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}: {value}
                                                                </span>
                                                            );
                                                        }

                                                        return null;
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Additional Notes */}
                    {selectedStyle && (
                        <div className="mt-6">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Additional Notes (Optional)
                            </label>
                            <textarea
                                value={userPrompt}
                                onChange={(e) => onPromptChange(e.target.value)}
                                placeholder="Any specific requests or modifications? (e.g., 'Add beauty marks', 'Make lips more pink')"
                                rows={2}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                            />
                        </div>
                    )}

                    {/* Apply Button */}
                    <button
                        onClick={onApplyStyle}
                        disabled={isGenerating || !selectedStyle || !hasUserFace}
                        className="w-full mt-4 px-6 py-4 bg-blue-500 dark:bg-blue-600 text-white font-semibold rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Applying Makeup...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Apply This Look
                            </>
                        )}
                    </button>

                    {!hasUserFace && selectedStyle && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 text-center mt-2">
                            Please upload your face photo first
                        </p>
                    )}
                </div>
            )}
        </>
    );
};

export default ConsultMode;