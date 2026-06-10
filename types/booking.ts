export type BookingStatus = 'active' | 'delivered' | 'cancelled';

export interface BookingItem {
  id: string;
  customerName: string;
  address: string;
  phone: string;
  quantity: number;
  total: string;
  bookedAt: string;
  bookedAtLabel: string;
  status: BookingStatus;
  supplierId?: number;
  latitude?: number;
  longitude?: number;
}
