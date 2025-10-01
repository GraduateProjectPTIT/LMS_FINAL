import { Response } from "express";

// Sử dụng Map để lưu trữ kết nối: key là userId (string), value là đối tượng Response
const clients = new Map<string, Response>();

export const addClient = (userId: string, res: Response) => {
  clients.set(userId, res);
  console.log(
    `[SSE] Client ${userId} đã kết nối. Tổng số client: ${clients.size}`
  );
};

export const removeClient = (userId: string) => {
  clients.delete(userId);
  console.log(
    `[SSE] Client ${userId} đã ngắt kết nối. Tổng số client: ${clients.size}`
  );
};

export const sendEventToUser = (userId: string, data: object) => {
  const clientRes = clients.get(userId);

  if (clientRes) {
    clientRes.write(`data: ${JSON.stringify(data)}\n\n`);
    console.log(`[SSE] Đã gửi sự kiện đến client ${userId}.`);
  } else {
    console.log(`[SSE] Client ${userId} không online, không gửi sự kiện.`);
  }
};
