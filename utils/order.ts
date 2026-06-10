import type { BookingItem, BookingStatus } from '@/types/booking';
import {
  OrderStatus,
  type OrderDetailResource,
  type OrderDetailView,
  type OrderListItem,
  type OrderResource,
} from '@/types/order';
import {
  formatDistance,
  haversineDistanceKm,
  type Coordinates,
} from '@/utils/geo';

const UZ_MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentyabr',
  'oktyabr',
  'noyabr',
  'dekabr',
] as const;

export function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    const ms = num < 1e12 ? num * 1000 : num;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dmyMatch = trimmed.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (dmyMatch) {
    const [, day, month, year, hour = '0', minute = '0', second = '0'] = dmyMatch;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const ymdMatch = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (ymdMatch) {
    const [, year, month, day, hour = '0', minute = '0', second = '0'] = ymdMatch;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const normalized = trimmed.includes(' ') && !trimmed.includes('T')
    ? trimmed.replace(' ', 'T')
    : trimmed;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatOrderDateTime(value: string | null | undefined): {
  date: string;
  time: string;
  label: string;
} {
  const parsed = parseApiDate(value);

  if (!parsed) {
    const fallback = value?.trim() || '—';
    return { date: fallback, time: '—', label: fallback };
  }

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = UZ_MONTHS[parsed.getMonth()] ?? '';
  const year = parsed.getFullYear();
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');

  const date = `${day}.${String(parsed.getMonth() + 1).padStart(2, '0')}.${year}`;
  const time = `${hours}:${minutes}`;
  const label = `${day} ${month} ${year}, ${time}`;

  return { date, time, label };
}

export function getCustomerName(customer: OrderDetailResource['customer']): string {
  if (!customer) return 'Mijoz';
  return [customer.first_name, customer.last_name, customer.middle_name]
    .filter(Boolean)
    .join(' ');
}

function parseCoordinate(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : undefined;
}

export function mapOrderToListItem(item: OrderDetailResource): OrderListItem {
  const { date, time, label } = formatOrderDateTime(item.created_at);
  const latitude = parseCoordinate(item.latitude);
  const longitude = parseCoordinate(item.longitude);

  return {
    id: String(item.id),
    customerName: getCustomerName(item.customer),
    date,
    time,
    dateTimeLabel: label,
    address: item.address,
    phone: item.customer?.phone ?? item.customer?.phone2 ?? '',
    quantity: item.quantity,
    sum: item.sum,
    latitude,
    longitude,
    status: extractStatusValue(item.status),
  };
}

export function attachDistanceToOrders(
  orders: OrderListItem[],
  driverLocation: Coordinates | null,
): OrderListItem[] {
  if (!driverLocation) {
    return orders.map((order) => ({ ...order, distance: undefined }));
  }

  return orders.map((order) => {
    if (order.latitude == null || order.longitude == null) {
      return { ...order, distance: undefined };
    }

    const km = haversineDistanceKm(driverLocation, {
      latitude: order.latitude,
      longitude: order.longitude,
    });

    return { ...order, distance: formatDistance(km) };
  });
}

function parseOrderStatusCode(status: unknown): number | null {
  if (status == null) return null;

  if (typeof status === 'number' && Number.isFinite(status)) {
    return status;
  }

  if (typeof status === 'string') {
    const trimmed = status.trim();
    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed);
    }
  }

  if (typeof status === 'object') {
    const obj = status as Record<string, unknown>;
    const nested = obj.value ?? obj.id ?? obj.code ?? obj.name ?? obj.label ?? obj.status;
    return parseOrderStatusCode(nested);
  }

  return null;
}

function extractStatusValue(status: unknown): string {
  const code = parseOrderStatusCode(status);
  if (code != null) return String(code);

  if (status == null) return '';

  if (typeof status === 'object') {
    const obj = status as Record<string, unknown>;
    const nested = obj.value ?? obj.name ?? obj.label ?? obj.status;
    return extractStatusValue(nested);
  }

  return String(status);
}

export function mapApiStatusToBooking(status: unknown): BookingStatus {
  switch (parseOrderStatusCode(status)) {
    case OrderStatus.ACTIVE:
      return 'active';
    case OrderStatus.CANCEL:
      return 'cancelled';
    case OrderStatus.DONE:
      return 'delivered';
    default:
      break;
  }

  const normalized = extractStatusValue(status).toLowerCase().trim();
  if (!normalized) return 'active';
  if (normalized.includes('cancel')) return 'cancelled';
  if (normalized === 'delivered' || normalized === 'done') return 'delivered';
  return 'active';
}

function parseSupplierId(value: unknown): number | undefined {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export function mapOrderToBooking(
  item: OrderDetailResource,
  forceActive = false,
): BookingItem {
  const { time, label } = formatOrderDateTime(item.created_at);
  const latitude = parseCoordinate(item.latitude);
  const longitude = parseCoordinate(item.longitude);
  const quantity = Number(item.quantity);
  const supplierId = parseSupplierId(item.supplier_id);

  return {
    id: String(item.id),
    customerName: getCustomerName(item.customer),
    address: item.address,
    phone: item.customer?.phone ?? item.customer?.phone2 ?? '',
    quantity: Number.isFinite(quantity) ? quantity : 0,
    total: formatOrderSum(item.sum),
    bookedAt: time,
    bookedAtLabel: label,
    status: forceActive ? 'active' : mapApiStatusToBooking(item.status),
    supplierId,
    latitude,
    longitude,
  };
}

export function formatOrderSum(sum: string | null): string {
  if (!sum) return '—';
  const num = Number(sum);
  if (Number.isFinite(num)) {
    return `${num.toLocaleString('uz-UZ')} so'm`;
  }
  return sum;
}

function readRelationName(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value.trim() || '—';
  if (typeof value === 'object' && 'name' in value) {
    const name = (value as { name?: string }).name;
    return name?.trim() || '—';
  }
  return '—';
}

export function getOrderStatusLabel(status: number | null | undefined): string {
  switch (status) {
    case OrderStatus.ACTIVE:
      return 'Jarayonda';
    case OrderStatus.CANCEL:
      return 'Bekor qilingan';
    case OrderStatus.DONE:
      return 'Yetkazilgan';
    default:
      return '—';
  }
}

export function mapOrderResourceToDetail(order: OrderResource): OrderDetailView {
  const created = formatOrderDateTime(order.created_at);
  const orderDate = order.date?.trim()
    ? formatOrderDateTime(order.date).label
    : '—';
  const latitude = parseCoordinate(order.latitude ?? order.lotitude ?? null);
  const longitude = parseCoordinate(order.longitude);
  const statusCode = Number.isFinite(order.status) ? order.status : null;

  return {
    id: String(order.id),
    customerName: getCustomerName(order.customer),
    phone: order.customer?.phone?.trim() || '—',
    phone2: order.customer?.phone2?.trim() || '—',
    address: order.address?.trim() || '—',
    district:
      readRelationName(order.district) !== '—'
        ? readRelationName(order.district)
        : order.customer?.district?.trim() || '—',
    neighborhood:
      readRelationName(order.neighborhood) !== '—'
        ? readRelationName(order.neighborhood)
        : order.customer?.neighborhood?.trim() || '—',
    quantity: String(order.quantity ?? '—'),
    sum: formatOrderSum(order.sum),
    productName: order.product?.name?.trim() || '—',
    note: order.note?.trim() || '—',
    orderDate,
    createdAtLabel: created.label,
    statusCode,
    statusLabel: getOrderStatusLabel(statusCode),
    source: order.source?.trim() || '—',
    supplierName: order.supplier?.name?.trim() || '—',
    supplierId: parseSupplierId(order.supplier?.id),
    latitude,
    longitude,
    canCancel: statusCode === OrderStatus.ACTIVE,
  };
}
