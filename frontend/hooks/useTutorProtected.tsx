"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";


const TutorProtected = ({ children }: { children: React.ReactNode }) => {

    const router = useRouter();

    const { currentUser } = useSelector((state: RootState) => state.user);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        if (!currentUser) {
            router.replace("/login"); // Redirect to home if not logged in
        } else if (currentUser.role !== "tutor") {
            router.push("/error/unauthorized");
        } else {
            setIsAuthenticated(true);
        }
    }, [currentUser, router]);

    if (isAuthenticated === null) return null; // Prevent rendering while checking auth

    return <>{children}</>;
}

export default TutorProtected;