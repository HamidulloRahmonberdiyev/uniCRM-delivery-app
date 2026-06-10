import { apiFetch } from '@/services/api';
import type { BookingItem } from '@/types/booking';
import type {
  ChangeOrderActionRequest,
  OrderDetailResource,
  OrderListItem,
  OrderResource,
} from '@/types/order';
import { mapOrderToBooking, mapOrderToListItem } from '@/utils/order';

async function fetchOrderList(path: string): Promise<OrderDetailResource[]> {
  const res = await apiFetch(path);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? 'Buyurtmalarni yuklash xatosi');
  }

  return (json.data ?? []) as OrderDetailResource[];
}

export async function getActiveOrders(
  nameOrPhone?: string,
): Promise<OrderListItem[]> {
  const query = nameOrPhone?.trim()
    ? `?name_or_phone=${encodeURIComponent(nameOrPhone.trim())}`
    : '';

  const items = await fetchOrderList(`/mobile/orders/actives${query}`);
  return items.map(mapOrderToListItem);
}

/** Bron qilingan (faol) buyurtmalar */
export async function getBookedOrders(): Promise<BookingItem[]> {
  const items = await fetchOrderList('/mobile/orders/booked');
  return items.map((item) => mapOrderToBooking(item, true));
}

/** Yetkazilgan va bekor qilingan buyurtmalar tarixi */
export async function getOrderHistory(): Promise<BookingItem[]> {
  const items = await fetchOrderList('/mobile/orders/history');
  return items
    .map((item) => mapOrderToBooking(item))
    .filter((item) => item.status !== 'active');
}

export async function fetchBookingsData(): Promise<{
  active: BookingItem[];
  history: BookingItem[];
}> {
  const [active, history] = await Promise.all([
    getBookedOrders(),
    getOrderHistory(),
  ]);
  return { active, history };
}

export async function bookOrder(orderId: string): Promise<void> {
  const res = await apiFetch(`/mobile/orders/booking/${orderId}`, {
    method: 'PUT',
  });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? 'Band qilish amalga oshmadi');
  }
}

/** POST /orders/{order}/change-order-action */
export async function changeOrderAction(
  orderId: string,
  body: ChangeOrderActionRequest,
): Promise<void> {
  const res = await apiFetch(`/orders/${orderId}/change-order-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? 'Buyurtma yangilash xatosi');
  }
}

/** O'ngga surish — status done (3), supplier_id o'zgarishsiz qoladi */
export async function completeBookedOrder(
  orderId: string,
  supplierId: number,
): Promise<void> {
  await changeOrderAction(orderId, { status: 'done', supplier_id: supplierId });
}

/** Chapga surish — supplier_id null, buyurtmalar ro'yxatiga qaytarish */
export async function releaseBookedOrder(orderId: string): Promise<void> {
  await changeOrderAction(orderId, { status: 'active', supplier_id: null });
}

/** GET /orders/{order} — buyurtma tafsilotlari */
export async function getOrderById(orderId: string): Promise<OrderResource> {
  const res = await apiFetch(`/orders/${orderId}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? 'Buyurtma topilmadi');
  }

  return (json.data ?? json) as OrderResource;
}

/** Bekor qilish — status cancel (2), supplier_id saqlanadi */
export async function cancelBookedOrder(
  orderId: string,
  supplierId: number,
): Promise<void> {
  await changeOrderAction(orderId, { status: 'cancel', supplier_id: supplierId });
}
