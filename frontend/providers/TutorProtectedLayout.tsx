"use client"

import TutorProtected from "@/hooks/useTutorProtected"

const TutorProtectedLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <TutorProtected>
            {children}
        </TutorProtected>
    )
}

export default TutorProtectedLayout;
