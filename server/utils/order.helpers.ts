export const toPlain = (o: any) => (o && typeof o.toObject === 'function' ? o.toObject() : o);

export const normalizeOrder = (o: any) => {
  const obj = toPlain(o);
  if (obj && Array.isArray(obj.items) && typeof (obj as any).total !== 'undefined') {
    return obj;
  }
  const amt = Number(obj?.payment_info?.amount || 0);
  return {
    ...obj,
    items: [{ courseId: obj?.courseId, price: amt }],
    total: amt,
  };
};

export const normalizeOrders = (orders: any[]) => {
  if (!Array.isArray(orders)) return [];
  return orders.map((o) => normalizeOrder(o));
};
