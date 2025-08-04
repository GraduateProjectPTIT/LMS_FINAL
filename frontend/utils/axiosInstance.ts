import axios from "axios";
import { store } from "@/redux/store";
import { refreshToken } from "@/utils/api";

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_BASEURL,
    withCredentials: true,
});

// Request Interceptor: Attach Access Token to Headers
axiosInstance.interceptors.request.use(
    async (config) => {
        const token = store.getState().user.accessToken;
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Refresh Token on 401
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const newToken = await refreshToken();

            if (newToken) {
                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                return axiosInstance(originalRequest); // Retry request with new token
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;