"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { usePathname } from 'next/navigation';

import Loader from "@/components/Loader";

const Protected = ({ children }: { children: React.ReactNode }) => {

    const router = useRouter();
    const pathname = usePathname();

    const { isLoggedIn } = useSelector((state: RootState) => state.user);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        if (!isLoggedIn) {
            router.replace(`/login?callbackUrl=${encodeURIComponent(pathname || "")}`);
        } else {
            setIsAuthenticated(true);
        }
    }, [isLoggedIn, router, pathname]);

    if (isAuthenticated === null) return (
        <div className="w-full h-screen flex justify-center items-center">
            <Loader />
        </div>
    );

    return <>{children}</>;
}

export default Protected;