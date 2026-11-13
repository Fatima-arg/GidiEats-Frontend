import type { Order } from '../api/types';

export interface DeliveryAddressFields {
  name?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
}

export function parseDeliveryAddress(order?: { deliveryAddress?: string | null } | null): DeliveryAddressFields | null {
  if (!order?.deliveryAddress) return null;
  try {
    const parsed = JSON.parse(order.deliveryAddress);
    return parsed && typeof parsed === 'object' ? (parsed as DeliveryAddressFields) : null;
  } catch {
    return null;
  }
}

type WithCustomer = { customer?: Order['customer']; deliveryAddress?: string | null };

export function orderCustomerName(order?: WithCustomer | null): string {
  const user = order?.customer?.user;
  if (user) {
    const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    if (name) return name;
    return user.email ?? '';
  }
  return parseDeliveryAddress(order)?.name ?? '';
}

export function orderCustomerPhone(order?: WithCustomer | null): string {
  if (order?.customer?.user?.phone) return order.customer.user.phone;
  return parseDeliveryAddress(order)?.phone ?? '';
}