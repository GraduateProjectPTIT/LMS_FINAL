'use client'

import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from "@/redux/store";
import SelectPreferencesModal from './SelectPreferencesModal';
import ArrowRight from "@/assets/arrow-right.svg"
import { Settings, CheckCheck, Compass } from 'lucide-react'

const Hero = () => {

    const { currentUser } = useSelector((state: RootState) => state.user);
    const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);

    const handleCompleteProfile = () => {
        setShowCompleteProfileModal(true);
    };

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    const handleExploreFeaturesClick = () => {
        scrollToSection('product-showcase');
    };

    const handleExploreCoursesClick = () => {
        scrollToSection('top-purchased-courses');
    };

    return (
        <>
            <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30">
                <div className="container relative z-10 px-6 md:px-8 lg:px-12">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Welcome badge for authenticated users */}
                        {currentUser && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-blue-200/50 dark:border-blue-700 mb-8 animate-fade-in">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Welcome back,
                                    <span className='font-semibold ml-1'>{currentUser.name} !</span>
                                </span>
                            </div>
                        )}

                        {/* Main heading */}
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 text-transparent bg-clip-text">
                                Master Makeup
                            </span>
                            <br />
                            <span className="text-gray-900 dark:text-white">
                                Art & Beauty
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-md md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                            Learn makeup from top experts or share your techniques with the community.
                            Discover the limitless world of beauty.
                        </p>

                        {/* Progress Steps and CTA */}
                        {currentUser && !currentUser.isSurveyCompleted && currentUser?.role !== "admin" ? (
                            <div className="flex flex-col gap-8 justify-center items-center">
                                {/* Progress Steps */}
                                <div className="w-full max-w-md">
                                    <div className="flex items-center justify-center gap-4">
                                        {/* Step 1: Verify Account (Completed) */}
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center justify-center w-8 h-8 md:w-12 md:h-12 rounded-full bg-green-500 border-green-500 text-white transition-colors duration-300">
                                                <CheckCheck className="w-4 h-4 md:w-6 md:h-6" />
                                            </div>
                                            <div className="hidden md:block mt-2 text-center">
                                                <div className="text-sm font-medium text-green-500 dark:text-green-400 transition-colors duration-300">
                                                    Verify Account
                                                </div>
                                            </div>
                                        </div>

                                        {/* Connecting Line */}
                                        <div className="flex-grow h-0.5 bg-blue-400/50 dark:bg-blue-600/50 transition-colors duration-300" />

                                        {/* Step 2: Preferences (Current) */}
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center justify-center w-8 h-8 md:w-12 md:h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 transition-colors duration-300">
                                                <Settings className="w-4 h-4 md:w-6 md:h-6" />
                                            </div>
                                            <div className="hidden md:block mt-2 text-center">
                                                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors duration-300">
                                                    Preferences
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={handleCompleteProfile}
                                    className="relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 group overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        Complete Your Profile
                                    </span>

                                    {/* Hiệu ứng shine khi hover */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700"></div>

                                    {/* Border glow animation */}
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-300 -z-10"></div>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                    <button 
                                        onClick={handleExploreFeaturesClick}
                                        className="group px-8 py-4 bg-blue-500 dark:bg-blue-600 backdrop-blur-sm border border-gray-200 dark:border-gray-700 font-medium rounded-xl shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        <span className="flex items-center gap-2 text-white">
                                            Explore Features
                                            <Compass className="w-5 h-5 group-hover:translate-x-1 transition-transform text-gray-300" />
                                        </span>
                                    </button>

                                <button 
                                    onClick={handleExploreCoursesClick}
                                    className="group px-8 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-slate-800 hover:border-gray-300 dark:hover:border-gray-600 font-medium rounded-xl shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        Explore Courses
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-slate-600 dark:text-slate-400" />
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Complete Profile Modal */}
            {currentUser && (
                <SelectPreferencesModal
                    isOpen={showCompleteProfileModal}
                    onClose={() => setShowCompleteProfileModal(false)}
                    userRole={currentUser.role}
                />
            )}

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }
            `}</style>
        </>
    )
}

export default Hero