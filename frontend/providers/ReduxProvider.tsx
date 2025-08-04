"use client"; // Ensures this runs only on the client side

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/redux/store"; // Adjust the path based on your structure

interface ReduxProviderProps {
    children: React.ReactNode;
}

export default function ReduxProvider({ children }: ReduxProviderProps) {
    return (
        <Provider store={store}>
            <PersistGate persistor={persistor!}>
                {children}
            </PersistGate>
        </Provider>
    );
}
