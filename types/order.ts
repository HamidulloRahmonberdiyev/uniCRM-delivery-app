/** Backend Order model status codes */
export const OrderStatus = {
  ACTIVE: 1,
  CANCEL: 2,
  DONE: 3,
} as const;

export type OrderStatusCode = (typeof OrderStatus)[keyof typeof OrderStatus];

export type ChangeOrderActionStatus = 'active' | 'cancel' | 'done';

export interface ChangeOrderActionRequest {
  status: ChangeOrderActionStatus;
  supplier_id?: number | null;
}

export interface OrderCustomer {
  first_name: string;
  last_name: string;
  middle_name: string;
  phone: string | null;
  phone2: string | null;
}

export interface OrderDetailResource {
  id: string;
  customer: OrderCustomer | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  quantity: string;
  sum: string | null;
  address: string;
  latitude: string;
  longitude: string;
  status?: unknown;
  supplier_id?: number | null;
  created_at: string;
}

export interface OrderResourceCustomer {
  first_name: string;
  last_name: string | null;
  middle_name: string | null;
  phone: string | null;
  phone2: string | null;
  district?: string | null;
  neighborhood?: string | null;
  home?: string | null;
}

export interface OrderResource {
  id: number;
  customer: OrderResourceCustomer | null;
  user?: { id: number; name: string } | null;
  supplier?: { id: number; name: string } | null;
  district?: { name?: string } | string | null;
  neighborhood?: { name?: string } | string | null;
  product?: { name?: string } | null;
  quantity: number | string;
  sum: string | null;
  date: string | null;
  address: string | null;
  note: string | null;
  lotitude?: string | null;
  latitude?: string | null;
  longitude: string | null;
  status: number;
  source?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface OrderDetailView {
  id: string;
  customerName: string;
  phone: string;
  phone2: string;
  address: string;
  district: string;
  neighborhood: string;
  quantity: string;
  sum: string;
  productName: string;
  note: string;
  orderDate: string;
  createdAtLabel: string;
  statusCode: number | null;
  statusLabel: string;
  source: string;
  supplierName: string;
  supplierId?: number;
  latitude?: number;
  longitude?: number;
  canCancel: boolean;
}

export interface OrderListItem {
  id: string;
  customerName: string;
  date: string;
  time: string;
  dateTimeLabel: string;
  address: string;
  phone: string;
  quantity: string;
  sum: string | null;
  distance?: string;
  latitude?: number;
  longitude?: number;
  status: string;
}
