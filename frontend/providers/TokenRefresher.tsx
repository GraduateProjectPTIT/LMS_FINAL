"use client"

import React, { useEffect } from 'react'
import { refreshToken } from '@/utils/api';
import { useSelector, useDispatch } from "react-redux";
import { RootState } from '@/redux/store';
import { jwtDecode } from 'jwt-decode';
import { signOutSuccess } from '@/redux/user/userSlice';
import { clearAll } from "@/redux/cart/cartSlice";
import { clearNotificationsState } from "@/redux/notification/notificationSlice";

const TokenRefresher = () => {

    const dispatch = useDispatch();
    const accessToken = useSelector((state: RootState) => state.user.accessToken);
    const isLoggedIn = useSelector((state: RootState) => !!state.user.isLoggedIn);

    useEffect(() => {

        if (!isLoggedIn) {
            console.log("User is logged out, stopping TokenRefresher.");
            return;
        }

        // Try to refresh immediately if the access token is missing
        const attemptImmediateRefresh = async () => {
            if (!accessToken) {
                console.warn("Access token missing! Attempting to refresh...");

                const newToken = await refreshToken();
                if (!newToken) {
                    console.error("Refresh token failed. Logging out...");
                    dispatch(signOutSuccess());
                    dispatch(clearAll());
                    dispatch(clearNotificationsState());
                    return;
                }
            }
        }

        const checkAndRefreshToken = async () => {
            if (accessToken) {
                try {
                    const decoded: any = jwtDecode(accessToken);
                    const currentTime = Date.now() / 1000; // Convert to seconds

                    // Refresh if token expires in less than 3 minutes
                    if (decoded.exp - currentTime < 60 * 3) {
                        const refreshed = await refreshToken();
                        if (!refreshed) {
                            console.warn("Token refresh failed. Logging out...");
                            dispatch(signOutSuccess());
                            dispatch(clearAll());
                            dispatch(clearNotificationsState());
                        }
                    }
                } catch (error) {
                    console.error("Invalid access token. Logging out...");
                    dispatch(signOutSuccess());
                    dispatch(clearAll());
                    dispatch(clearNotificationsState());
                }
            }
        }

        // Immediately check if token is missing** and try to refresh it
        attemptImmediateRefresh();

        // Check every 2 minutes if token needs refreshing
        const interval = setInterval(checkAndRefreshToken, 1000 * 60 * 2);

        return () => clearInterval(interval);
    }, [accessToken, isLoggedIn, dispatch]);

    return null;
}

export default TokenRefresher