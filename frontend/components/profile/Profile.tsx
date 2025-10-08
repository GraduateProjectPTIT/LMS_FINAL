import React, { useState } from 'react';
import Personal from './Personal';
import Authentication from './Authentication';
import Notifications from './Notifications';
import EnrolledCourses from './EnrolledCourses';
import Interests from './Interests';
import Expertise from './Expertise';

interface ProfileProps {
    user: any;
    activeSection: string;
}

const Profile = ({ user, activeSection }: ProfileProps) => {

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'personal_info':
                return <Personal user={user} />
            case 'authentication_change':
                return <Authentication user={user} />;
            case 'interests':
                return <Interests user={user} />;
            case 'expertises':
                return <Expertise user={user} />;
            case 'notifications':
                return <Notifications user={user} />;
            case 'enroll_courses':
                return <EnrolledCourses />;
            default:
                return <Personal user={user} />;
        }
    }

    return (
        <div className="flex h-screen max-h-[1200px] overflow-y-scroll flex-1 max-sm:w-full px-2  md:px-6 max-sm:border-none border border-gray-300 dark:border-slate-700  justify-center pt-[20px]">
            <div className="w-full">
                {renderActiveSection()}
            </div>
        </div>
    )



}

export default Profile;
