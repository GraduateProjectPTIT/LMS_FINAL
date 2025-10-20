"use client"

import { IVideoLinkResponse, SectionLecture } from '@/type';
import React from 'react'
import { FaLink } from 'react-icons/fa6';

interface ILectureResourcesProps {
    lecture: SectionLecture;
}

const LectureResources = ({ lecture }: ILectureResourcesProps) => {
    return (
        <div>
            <ul className="space-y-3">
                {lecture.videoLinks.map((link: IVideoLinkResponse) => (
                    <li key={link._id} className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg border border-gray-300 dark:border-slate-600">
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center"
                        >
                            <FaLink className='h-4 w-4 mr-2 text-indigo-500 dark:text-indigo-400' />
                            {link.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default LectureResources