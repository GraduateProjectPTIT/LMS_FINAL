import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
    currentUser: any | null;
    error: string | null;
    loading: boolean;
    activationToken: any;
    accessToken: any;
    isLoggedIn: boolean;
}

const initialState: UserState = {
    currentUser: null,
    error: null,
    loading: false,
    activationToken: null,
    accessToken: null,
    isLoggedIn: false
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
            state.currentUser = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.isLoggedIn = true;
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
            state.activationToken = null;
        },
        signUpSuccess: (state, action: PayloadAction<any>) => {
            state.loading = false;
            state.error = null;
            state.activationToken = action.payload;
        },
        signUpFailure: (state, action: PayloadAction<any>) => {
            state.error = action.payload;
            state.loading = false;
            state.activationToken = null;
        },
        signOutSuccess: (state) => {
            state.currentUser = null;
            state.accessToken = null;
            state.activationToken = null;
            state.isLoggedIn = false;
            state.loading = false;
            state.error = null;
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
} = userSlice.actions;

export default userSlice.reducer;
