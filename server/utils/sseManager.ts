// src/utils/sseManager.ts

import { Response } from "express";

// Cấu trúc: Map<userId, Mảng các kết nối (Response)>
const clients = new Map<string, Response[]>();

// Thời gian gửi "nhịp tim" (heartbeat) để giữ kết nối (20 giây)
const HEARTBEAT_INTERVAL = 20000;

/**
 * Thêm một client (một kết nối) cho một userId.
 * @param userId - ID của người dùng
 * @param res - Đối tượng Response của Express
 */
export const addClient = (userId: string, res: Response) => {
  // Lấy danh sách client hiện tại của user, hoặc tạo mảng mới nếu chưa có
  const userClients = clients.get(userId) || [];

  // Thêm kết nối mới vào mảng
  userClients.push(res);

  // Cập nhật lại Map
  clients.set(userId, userClients);

  console.log(
    `[SSE] Client ${userId} đã kết nối (Tổng kết nối cho user này: ${userClients.length}). Tổng số user đang kết nối: ${clients.size}`
  );
};

/**
 * Xóa một client (một kết nối) cụ thể khi họ ngắt kết nối.
 * @param userId - ID của người dùng
 * @param resToRemove - Đối tượng Response CỤ THỂ đã ngắt kết nối
 */
export const removeClient = (userId: string, resToRemove: Response) => {
  const userClients = clients.get(userId);

  if (!userClients) {
    return; // Không có gì để xóa
  }

  // Lọc ra kết nối đã đóng, giữ lại các kết nối khác
  const updatedClients = userClients.filter((res) => res !== resToRemove);

  if (updatedClients.length > 0) {
    // Nếu user vẫn còn kết nối khác, cập nhật lại mảng
    clients.set(userId, updatedClients);
    console.log(
      `[SSE] Client ${userId} đã ngắt 1 kết nối (Còn lại: ${updatedClients.length}). Tổng số user đang kết nối: ${clients.size}`
    );
  } else {
    // Nếu đây là kết nối cuối cùng, xóa user khỏi Map
    clients.delete(userId);
    console.log(
      `[SSE] Client ${userId} đã ngắt kết nối cuối cùng. Tổng số user đang kết nối: ${clients.size}`
    );
  }
};

/**
 * Gửi một sự kiện đến TẤT CẢ các kết nối của một user.
 * @param userId - ID của người dùng
 * @param eventName - Tên sự kiện (ví dụ: 'NEW_NOTIFICATION')
 * @param data - Dữ liệu (payload) cần gửi
 */
export const sendEventToUser = (
  userId: string,
  eventName: string,
  data: object
) => {
  const userClients = clients.get(userId);

  if (userClients && userClients.length > 0) {
    console.log(
      `[SSE] Gửi sự kiện '${eventName}' đến ${userClients.length} kết nối của user ${userId}.`
    );

    // Định dạng SSE chuẩn (bao gồm 'event' và 'data')
    const sseMessage = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

    // Mảng để lưu lại các client đã chết (nếu có)
    const deadClients: Response[] = [];

    // Gửi cho tất cả các kết nối (tab) của user đó
    userClients.forEach((res) => {
      try {
        // Gửi dữ liệu
        res.write(sseMessage);
      } catch (error) {
        // Nếu lỗi (ví dụ: client đã đóng nhưng chưa kịp gỡ), đánh dấu để xóa
        console.warn(`[SSE] Lỗi khi gửi sự kiện đến ${userId}.`);
        deadClients.push(res);
      }
    });

    // Tự động dọn dẹp các kết nối đã chết
    if (deadClients.length > 0) {
      console.log(
        `[SSE] Dọn dẹp ${deadClients.length} kết nối chết của user ${userId}`
      );
      deadClients.forEach((res) => removeClient(userId, res));
    }
  } else {
    console.log(
      `[SSE] Client ${userId} không online, không gửi sự kiện '${eventName}'.`
    );
  }
};

/**
 * Gửi một "nhịp tim" (dạng comment) để giữ kết nối SSE
 * không bị các proxy hoặc firewall ngắt vì không hoạt động.
 */
const sendHeartbeat = () => {
  // Dấu hai chấm (:) ở đầu là một comment trong SSE, client sẽ bỏ qua
  const heartbeatMessage = ":heartbeat\n\n";

  clients.forEach((userClients, userId) => {
    userClients.forEach((res) => {
      try {
        res.write(heartbeatMessage);
      } catch (e) {
        // Kết nối này đã chết, xóa nó đi
        console.warn(
          `[SSE] Heartbeat failed for ${userId}. Removing dead client.`
        );
        removeClient(userId, res);
      }
    });
  });
};

/**
 * Khởi động tiến trình gửi heartbeat định kỳ
 */
const startHeartbeat = () => {
  console.log("[SSE] Khởi động tiến trình gửi Heartbeat mỗi 20 giây.");
  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
};

// Tự động khởi động heartbeat khi module được load
// startHeartbeat();
