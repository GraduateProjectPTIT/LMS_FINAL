import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { CartItem } from "@/type";

interface CartState {
    items: CartItem[];              // Các khóa học trong giỏ hàng, sẵn sàng để thanh toán
    savedForLater: CartItem[];      // Các khóa học đã được "lưu để mua sau"
    totalItems: number;             // Tổng số lượng khóa học trong giỏ hàng (không tính savedForLater)
    totalPrice: number;             // Tổng giá tiền của các khóa học trong giỏ hàng (không tính savedForLater)
    loading: boolean;
    error: string | null;
}

const initialState: CartState = {
    items: [],
    savedForLater: [],
    totalItems: 0,
    totalPrice: 0,
    loading: false,
    error: null,
};

// Hàm helper để xử lý logic cập nhật state thành công (tránh lặp code)
const handleSuccess = (state: CartState, action: PayloadAction<CartState>) => {
    state.items = action.payload.items;
    state.savedForLater = action.payload.savedForLater;
    state.totalItems = action.payload.totalItems;
    state.totalPrice = action.payload.totalPrice;
    state.loading = false;
    state.error = null;
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        // --- Get Cart ---
        getCartStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        getCartSuccess: handleSuccess,
        getCartFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        // --- Add Item To Cart ---
        addItemToCartStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        addItemToCartSuccess: handleSuccess,
        addItemToCartFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        // --- Remove Item From Cart ---
        removeItemFromCartStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        removeItemFromCartSuccess: handleSuccess,
        removeItemFromCartFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        // --- Save Item For Later ---
        saveItemForLaterStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        saveItemForLaterSuccess: handleSuccess,
        saveItemForLaterFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        // --- Move Item To Cart (from Saved list) ---
        moveItemToCartStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        moveItemToCartSuccess: handleSuccess,
        moveItemToCartFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        // --- Clear Cart ---
        clearCartStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        clearCartSuccess: handleSuccess,
        clearCartFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
        clearAll: (state) => {
            state.items = [];
            state.savedForLater = [];
            state.totalItems = 0;
            state.totalPrice = 0;
            state.loading = false;
            state.error = null;
        }
    },
});

export const {
    getCartStart,
    getCartSuccess,
    getCartFailure,
    addItemToCartStart,
    addItemToCartSuccess,
    addItemToCartFailure,
    removeItemFromCartStart,
    removeItemFromCartSuccess,
    removeItemFromCartFailure,
    saveItemForLaterStart,
    saveItemForLaterSuccess,
    saveItemForLaterFailure,
    moveItemToCartStart,
    moveItemToCartSuccess,
    moveItemToCartFailure,
    clearCartStart,
    clearCartSuccess,
    clearCartFailure,
    clearAll
} = cartSlice.actions;

export default cartSlice.reducer;