import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Notification } from "@/type";

interface NotificationsState {
  items: Notification[];
  loading: boolean; // Chỉ dùng cho lần fetch đầu tiên
  error: string | null;
  connected: boolean; // trạng thái kết nối SSE
}

const initialState: NotificationsState = {
  items: [],
  loading: false,
  error: null,
  connected: false,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotificationsState: () => initialState,

    // fetch list
    fetchStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchSuccess: (state, action: PayloadAction<Notification[]>) => {
      state.items = action.payload ?? [];
      state.loading = false;
      state.error = null;
    },
    fetchFailure: (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload ?? "Failed to load notifications";
    },

    // đánh dấu 1 notification đã được đọc
    markOneStart: (state) => {
      state.error = null;
    },
    markOneSuccess: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const i = state.items.findIndex((n) => n._id === id);
      if (i >= 0) state.items[i].status = "read";
      state.error = null;
    },
    markOneFailure: (state, action: PayloadAction<any>) => {
      state.error = action.payload ?? "Failed to mark as read";
    },

    // đánh dấu tất cả notification đã được đọc
    markAllStart: (state) => {
      state.error = null;
    },
    markAllSuccess: (state) => {
      state.items = state.items.map((n) => ({ ...n, status: "read" }));
      state.error = null;
    },
    markAllFailure: (state, action: PayloadAction<any>) => {
      state.error = action.payload ?? "Failed to mark all as read";
    },

    // trạng thái kết nối SSE
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },

    // real-time push
    prependOne: (state, action: PayloadAction<Notification>) => {
      const n = action.payload;
      if (!state.items.some((x) => x._id === n._id)) {
        state.items = [n, ...state.items].slice(0, 20); // Giới hạn 20 noti trong dropdown
      }
    },
  },
});

export const {
  clearNotificationsState,
  fetchStart,
  fetchSuccess,
  fetchFailure,
  markOneStart,
  markOneSuccess,
  markOneFailure,
  markAllStart,
  markAllSuccess,
  markAllFailure,
  setConnected,
  prependOne,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
