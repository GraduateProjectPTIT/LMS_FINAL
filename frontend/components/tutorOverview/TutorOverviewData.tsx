"use client";

import React, { useState, useEffect, useCallback } from 'react';
import TutorInformations from './TutorInformations';
import TutorCourses from './TutorCourses';

interface ITutorOverviewDataProps {
    tutorId: string;
}

interface ITutorInformation {
    name: string;
    avatar: {
        url: string;
    };
    bio?: string;
    socials: {
        facebook?: string;
        instagram?: string;
        tiktok?: string;
    };
    totalStudents: number;
    totalCourses: number;
    totalReviews: number;
    averageRating: number;
    createdAt: string;
}

interface ITutorCourse {
    _id: string;
    name: string;
    overview: string;
    price: number;
    estimatedPrice: number;
    thumbnail: {
        url: string;
    };
    enrolledCounts: number;
    totalLectures: number;
    totalDuration: number;
}

const TutorOverviewData = ({ tutorId }: ITutorOverviewDataProps) => {

    const [tutorInformation, setTutorInformation] = useState<ITutorInformation | null>(null);
    const [tutorCourses, setTutorCourses] = useState<ITutorCourse[]>([]);
    const [loadingInformation, setLoadingInformation] = useState<boolean>(true);
    const [loadingCourses, setLoadingCourses] = useState<boolean>(true);

    const fetchTutorInformation = useCallback(async () => {
        setLoadingInformation(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/tutor/overview/${tutorId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                console.log('Failed to fetch tutor information:', data.message);
                return;
            }
            setTutorInformation(data.tutorDetails);
        } catch (error: any) {
            console.log('Error fetching tutor information:', error.message);
        } finally {
            setLoadingInformation(false);
        }
    }, [tutorId]);

    const fetchTutorCourses = useCallback(async () => {
        setLoadingCourses(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/tutor/${tutorId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
            const responseData = await res.json();
            if (!res.ok) {
                console.log('Failed to fetch tutor courses:', responseData.message);
                return;
            }
            setTutorCourses(responseData.data);
        } catch (error: any) {
            console.log('Error fetching tutor courses:', error.message);
        } finally {
            setLoadingCourses(false);
        }
    }, [tutorId]);

    useEffect(() => {
        fetchTutorInformation();
        fetchTutorCourses();
    }, [fetchTutorInformation, fetchTutorCourses]);

    return (
        <div className='theme-mode min-h-screen'>

            {/* Main Content */}
            <div className="container py-8">
                <div className='grid grid-cols-1 lg:grid-cols-4 gap-8 mt-5'>
                    <div className='col-span-1'>
                        <TutorInformations
                            tutorData={tutorInformation}
                            loading={loadingInformation}
                        />
                    </div>
                    <div className='col-span-1 lg:col-span-3'>
                        <TutorCourses
                            courses={tutorCourses}
                            loading={loadingCourses}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorOverviewData;