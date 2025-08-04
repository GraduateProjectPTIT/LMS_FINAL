import axios from "axios"
import { store } from "@/redux/store"
import { refreshTokenSuccess } from "@/redux/user/userSlice"

export const refreshToken = async () => {
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_BASEURL}/api/auth/refresh_token`, {
            withCredentials: true,
        });
        if (response.data?.accessToken) {
            store.dispatch(refreshTokenSuccess(response.data.accessToken));

            return response.data.accessToken;
        }
    } catch (error: any) {
        console.error("Error refreshing token", error);
        return null;
    }
}