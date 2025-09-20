import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../store";

// Định nghĩa kiểu dữ liệu (Interface) cho một khóa học trong giỏ hàng
interface CartItem {
    _id: string;
    name: string;
    price: number;
    estimatedPrice?: number;
    thumbnail?: any;
    level?: string;
    totalSections?: number;
    totalLectures?: number;
    totalTime?: string;
    instructorName?: string;
    ratings?: number;
}

// Định nghĩa kiểu dữ liệu cho state của cart slice
interface CartState {
    items: CartItem[];              // Các khóa học trong giỏ hàng, sẵn sàng để thanh toán
    savedForLater: CartItem[];      // Các khóa học đã được "lưu để mua sau"
    totalItems: number;             // Tổng số lượng khóa học trong giỏ hàng (không tính savedForLater)
    totalPrice: number;             // Tổng giá tiền của các khóa học trong giỏ hàng (không tính savedForLater)
}

const initialState: CartState = {
    items: [],
    savedForLater: [],
    totalItems: 0,
    totalPrice: 0,
};

// Hàm helper để cập nhật lại tổng số lượng và tổng giá tiền một cách nhất quán
const updateCartTotals = (state: CartState) => {
    state.totalItems = state.items.length;
    state.totalPrice = state.items.reduce((total, item) => total + item.price, 0);
};

// --- THUNK XỬ LÝ LOGIC PHỨC TẠP ---

// Thunk này xử lý logic khi người dùng bấm "Thêm vào giỏ hàng".
// Nó sẽ kiểm tra trạng thái hiện tại và quyết định hành động phù hợp.
export const addCourseToCart = createAsyncThunk(
    'cart/addCourseToCart',
    async (course: CartItem, { getState, dispatch }) => {
        // Lấy state hiện tại của cart slice
        const state = (getState() as RootState).cart;

        const itemExists = state.items.find(item => item._id === course._id);
        const itemIsSaved = state.savedForLater.find(item => item._id === course._id);

        // Trường hợp 1: Khóa học đã có sẵn trong giỏ hàng
        if (itemExists) {
            // Trả về một trạng thái để component có thể xử lý (ví dụ: hiển thị toast)
            return { status: 'exists' };
        }

        // Trường hợp 2: Khóa học đang nằm trong danh sách "Lưu để mua sau"
        if (itemIsSaved) {
            // Gọi reducer `moveItemToCart` để di chuyển nó vào giỏ hàng
            dispatch(cartSlice.actions.moveItemToCart(course._id));
            return { status: 'moved' };
        }

        // Trường hợp 3: Khóa học hoàn toàn mới
        dispatch(cartSlice.actions.addItem(course));
        return { status: 'added' };
    }
);

// --- SLICE CHÍNH ---

const cartSlice = createSlice({
    name: "cart",
    initialState,
    // REDUCERS THUẦN KHIẾT: Chỉ thực hiện việc cập nhật state một cách trực tiếp
    reducers: {
        // Action này chỉ nên được gọi từ Thunk sau khi đã kiểm tra logic
        addItem: (state, action: PayloadAction<CartItem>) => {
            state.items.push(action.payload);
            updateCartTotals(state);
        },
        // Xóa một khóa học khỏi giỏ hàng
        removeItemFromCart: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter(item => item._id !== action.payload);
            updateCartTotals(state);
        },
        // Chuyển một khóa học từ giỏ hàng sang danh sách "lưu để mua sau"
        saveItemForLater: (state, action: PayloadAction<string>) => {
            const itemToSave = state.items.find(item => item._id === action.payload);
            if (itemToSave) {
                // KIỂM TRA QUAN TRỌNG: Đảm bảo không thêm trùng lặp vào danh sách "lưu"
                const alreadyExists = state.savedForLater.some(item => item._id === itemToSave._id);
                if (!alreadyExists) {
                    state.savedForLater.push(itemToSave);
                }
                // Luôn xóa khỏi giỏ hàng chính
                state.items = state.items.filter(item => item._id !== action.payload);
                updateCartTotals(state);
            }
        },
        // Chuyển một khóa học từ "lưu để mua sau" trở lại giỏ hàng
        moveItemToCart: (state, action: PayloadAction<string>) => {
            const itemToMove = state.savedForLater.find(item => item._id === action.payload);
            if (itemToMove) {
                // KIỂM TRA QUAN TRỌNG: Đảm bảo không thêm trùng lặp vào giỏ hàng chính
                const alreadyExists = state.items.some(item => item._id === itemToMove._id);
                if (!alreadyExists) {
                    state.items.push(itemToMove);
                }
                // Luôn xóa khỏi danh sách "lưu"
                state.savedForLater = state.savedForLater.filter(item => item._id !== action.payload);
                updateCartTotals(state);
            }
        },
        // Dọn dẹp giỏ hàng
        clearCart: (state) => {
            state.items = [];
            // LOGIC CẢI TIẾN: Không xóa danh sách "lưu để mua sau", phù hợp hơn với trải nghiệm người dùng
            state.totalItems = 0;
            state.totalPrice = 0;
        },
    },
});

// --- EXPORTS ---

// Export các actions mà component sẽ gọi trực tiếp (hành động đơn giản)
export const {
    removeItemFromCart,
    saveItemForLater,
    moveItemToCart,
    clearCart,
} = cartSlice.actions;

// Action `addItem` không được export ra ngoài vì component nên gọi qua thunk `addCourseToCart` để xử lý logic
export default cartSlice.reducer;