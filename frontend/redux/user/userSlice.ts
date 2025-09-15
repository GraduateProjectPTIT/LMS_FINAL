import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
    currentUser: any | null;
    error: string | null;
    loading: boolean;
    accessToken: any;
    isLoggedIn: boolean;
    resetToken: any;
}

const initialState: UserState = {
    currentUser: null,
    error: null,
    loading: false,
    accessToken: null,
    isLoggedIn: false,
    resetToken: null
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        resetState: () => initialState,
        signInStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        signInSuccess: (state, action: PayloadAction<any>) => {
            state.currentUser = action.payload.userResponse;
            state.accessToken = action.payload.accessToken;
            state.isLoggedIn = true;
            state.resetToken = null;
            state.loading = false;
            state.error = null;
        },
        signInFailure: (state, action: PayloadAction<any>) => {
            state.error = action.payload;
            state.loading = false;
        },
        refreshTokenSuccess: (state, action: PayloadAction<any>) => {
            state.accessToken = action.payload;
        },
        signUpStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        signUpSuccess: (state) => {
            state.loading = false;
            state.error = null;
        },
        signUpFailure: (state, action: PayloadAction<any>) => {
            state.error = action.payload;
            state.loading = false;
        },
        signOutSuccess: (state) => {
            state.currentUser = null;
            state.accessToken = null;
            state.isLoggedIn = false;
            state.resetToken = null;
            state.loading = false;
            state.error = null;
        },
        forgotPasswordStart: (state) => {
            state.loading = true;
            state.error = null;
            state.resetToken = null;
        },
        forgotPasswordSuccess: (state, action: PayloadAction<any>) => {
            state.loading = false;
            state.error = null;
            state.resetToken = action.payload;
        },
        updateStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        updateSuccess: (state, action: PayloadAction<any>) => {
            state.currentUser = action.payload;
            state.loading = false;
            state.error = null;
        },
        updateFailure: (state, action: PayloadAction<any>) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

export const {
    resetState,
    signInStart,
    signInSuccess,
    refreshTokenSuccess,
    signInFailure,
    signUpStart,
    signUpSuccess,
    signUpFailure,
    signOutSuccess,
    updateStart,
    updateSuccess,
    updateFailure,
    forgotPasswordSuccess,
    forgotPasswordStart
} = userSlice.actions;

export default userSlice.reducer;
