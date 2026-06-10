import { apiFetch } from '@/services/api';

export interface SupplierStats {
  active_orders: number;
  delivered_orders: number;
}

export async function getSupplierStats(): Promise<SupplierStats> {
  const res = await apiFetch('/mobile/supplier/stats');
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message ?? 'Statistikani yuklash xatosi');
  }

  const data = json.data ?? json;
  return {
    active_orders: data.active_orders ?? 0,
    delivered_orders: data.delivered_orders ?? 0,
  };
}
