import { combineReducers, configureStore } from "@reduxjs/toolkit";
import userReducer from "@/redux/user/userSlice";
import cartReducer from "@/redux/cart/cartSlice";

import { persistReducer, persistStore } from "redux-persist"; // cau hinh tinh nang luu tru lau dai
import storage from "redux-persist/lib/storage";

const persistConfig = {
    key: "lms1",
    storage
}

const rootReducer = combineReducers({
    user: userReducer,
    cart: cartReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export type RootState = ReturnType<typeof store.getState>;

export const persistor = typeof window !== "undefined" ? persistStore(store) : null;

