'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search, Clock, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface MobileSearchProps {
    isOpen: boolean
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    onClose: () => void
    searchTerm: string
    onSearchTermChange: (term: string) => void
    history: string[]
    onAddHistory: (term: string) => void
    onRemoveHistory: (term: string) => void
    onClearHistory: () => void
}

const MobileSearch: React.FC<MobileSearchProps> = ({
    isOpen,
    setIsOpen,
    onClose,
    searchTerm,
    onSearchTermChange,
    history,
    onAddHistory,
    onRemoveHistory,
    onClearHistory
}) => {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isSearchHistoryVisible, setIsSearchHistoryVisible] = useState(false);
    const mobileSearchRef = useRef<HTMLDivElement>(null);
    const [showAllHistory, setShowAllHistory] = useState(false);

    const INITIAL_DISPLAY_COUNT = 5;

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen]);

    // Xử lý click bên ngoài để đóng search history
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
                setIsSearchHistoryVisible(false);
                setIsOpen(false);
            }
        }

        if (isSearchHistoryVisible) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isSearchHistoryVisible, setIsOpen]);

    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (searchTerm.trim()) {
            onAddHistory(searchTerm.trim())
            router.push(`/courses/search?query=${searchTerm}`)
            onClose()
            setIsSearchHistoryVisible(false);
            setIsOpen(false);
        }
    }

    const handleHistoryClick = (term: string) => {
        onAddHistory(term);
        onSearchTermChange(term);
        router.push(`/courses/search?query=${term}`);
        onClose();
        setIsSearchHistoryVisible(false);
        setIsOpen(false);
    };

    const handleInputFocus = () => {
        setIsSearchHistoryVisible(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearchTermChange(e.target.value);
        if (history.length > 0) {
            setIsSearchHistoryVisible(true);
        }
    };

    const handleClose = () => {
        setIsSearchHistoryVisible(false);
        setIsOpen(false);
        setShowAllHistory(false);
        onClose();
    };

    const toggleShowAll = () => {
        setShowAllHistory(!showAllHistory);
    };

    const displayedHistory = showAllHistory ? history : history.slice(0, INITIAL_DISPLAY_COUNT);
    const hasMoreItems = history.length > INITIAL_DISPLAY_COUNT;

    if (!isOpen) return null;

    return (
        <>
            {/* Search Bar */}
            <div
                ref={mobileSearchRef}
                className="absolute top-full left-0 right-0 z-50"
            >
                <div className="container">
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            ref={inputRef}
                            placeholder="What are you looking for?"
                            value={searchTerm}
                            onChange={handleInputChange}
                            onFocus={handleInputFocus}
                            className="pl-10 pr-10 h-12 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 rounded-lg text-base"
                        />
                        <button
                            type="button"
                            onClick={handleClose}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                            <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        </button>
                    </form>

                    {/* Search History Dropdown */}
                    {isSearchHistoryVisible && history.length > 0 && (
                        <div className="mt-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg">
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent searches</span>
                                    <button
                                        onClick={() => {
                                            onClearHistory();
                                            setIsSearchHistoryVisible(false);
                                            setShowAllHistory(false);
                                        }}
                                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Clear all
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {displayedHistory.map((term, index) => (
                                        <div
                                            key={index}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 group transition-colors"
                                        >
                                            <button
                                                onClick={() => handleHistoryClick(term)}
                                                className="flex items-center gap-3 flex-1 text-left"
                                            >
                                                <Clock className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                                                <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                                    {term}
                                                </span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onRemoveHistory(term)
                                                }}
                                                className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {hasMoreItems && (
                                    <div className="mt-3 pt-2 border-t border-gray-200 dark:border-slate-600">
                                        <button
                                            onClick={toggleShowAll}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                                        >
                                            <span>
                                                {showAllHistory
                                                    ? 'Show less'
                                                    : 'Show more'
                                                }
                                            </span>
                                            {showAllHistory ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default MobileSearch