import React, { useState } from 'react';

interface VideoLink {
    title: string;
    url: string;
    _id: string;
}

interface LectureQuestions {
    _id: string;
    user: string;
    question: string;
    replies: LectureQuestionsReply[];
    createdAt: string;
    updatedAt: string;
}

interface LectureQuestionsReply {
    _id: string;
    user: string;
    answer: string;
    createdAt: string;
    updatedAt: string;
}

interface CourseContent {
    _id: string;
    videoTitle: string;
    videoDescription: string;
    videoUrl: string;
    videoLength: number;
    videoLinks: VideoLink[];
    questions: LectureQuestions[];
}

interface VideoPlayerProps {
    video: CourseContent | null;
}

const VideoPlayer = ({ video }: VideoPlayerProps) => {
    const [activeTab, setActiveTab] = useState<'description' | 'resources' | 'questions'>('description');

    if (!video) {
        return (
            <div className="flex flex-col h-full">
                <div className="bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center aspect-video">
                    <div className="text-center p-6">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <p className="mt-4 text-gray-500 dark:text-gray-400">Select a video to start learning</p>
                    </div>
                </div>
            </div>
        );
    }

    // Function to extract YouTube video ID
    const getYoutubeVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    };

    const isYoutubeVideo = video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be');
    const youtubeVideoId = isYoutubeVideo ? getYoutubeVideoId(video.videoUrl) : null;

    return (
        <div className="flex flex-col h-screen overflow-y-scroll">
            <div className="bg-black rounded-lg overflow-hidden aspect-video">
                {isYoutubeVideo && youtubeVideoId ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0`}
                        title={video.videoTitle}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full aspect-video"
                    ></iframe>
                ) : (
                    <video
                        src={video.videoUrl}
                        controls
                        className="w-full h-full"
                        poster="/video-placeholder.jpg"
                    >
                        Your browser does not support the video tag.
                    </video>
                )}
            </div>

            <div className="mt-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{video.videoTitle}</h2>

                {/* Tabs */}
                <div className="border-b border-gray-300 dark:border-slate-700 mb-4">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('description')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'description'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                        >
                            Description
                        </button>
                        <button
                            onClick={() => setActiveTab('resources')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'resources'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                        >
                            Resources {video.videoLinks.length > 0 && `(${video.videoLinks.length})`}
                        </button>
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'questions'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                        >
                            Q&A {video.questions.length > 0 && `(${video.questions.length})`}
                        </button>
                    </nav>
                </div>

                {/* Tab content */}
                <div className="pb-8">
                    {activeTab === 'description' && (
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-gray-700 dark:text-gray-300">{video.videoDescription}</p>
                        </div>
                    )}

                    {activeTab === 'resources' && (
                        <div>
                            {video.videoLinks && video.videoLinks.length > 0 ? (
                                <ul className="space-y-3">
                                    {video.videoLinks.map((link) => (
                                        <li key={link._id} className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg border border-gray-300 dark:border-slate-600">
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center"
                                            >
                                                <svg
                                                    className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                    />
                                                </svg>
                                                {link.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                    <p className="text-gray-500 dark:text-gray-400">No resources available for this video</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'questions' && (
                        <div>
                            {video.questions && video.questions.length > 0 ? (
                                <div className="space-y-4">
                                    {video.questions.map((item) => (
                                        <div key={item._id} className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-300 dark:border-slate-600">
                                            <div className="mb-4">
                                                <div className="flex justify-between mb-2">
                                                    <h3 className="font-medium text-gray-900 dark:text-white">Question:</h3>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-gray-700 dark:text-gray-300">{item.question}</p>
                                            </div>

                                            {item.replies && item.replies.length > 0 && (
                                                <div className="mt-3 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                                                    {item.replies.map((reply, index) => (
                                                        <div key={index} className="mb-3">
                                                            <div className="flex justify-between mb-1">
                                                                <h4 className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Reply:</h4>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {new Date(reply.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">{reply.answer}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                    <p className="text-gray-500 dark:text-gray-400">No questions available for this video</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;