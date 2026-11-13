export type Role = 'CUSTOMER' | 'RESTAFF' | 'RIDER' | 'ADMIN';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  staff?: {
    id?: number;
    restaurantId?: number;
    position?: string;
    restaurant?: { id: number; name: string; logo?: string | null };
  } | null;
  rider?: {
    id?: number;
    vehicleType?: string;
    availabilityStatus?: string;
    restaurantId?: number | null;
    licensePlate?: string | null;
    totalDeliveries?: number;
    rating?: number;
    isActive?: boolean;
    restaurant?: { id: number; name: string; logo?: string | null } | null;
  } | null;
  customer?: {
    id?: number;
    addresses?: Array<{ id?: number; street: string; city: string; state: string }>;
  } | null;
  [key: string]: unknown;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiList<T> {
  data: T[];
  meta: PageMeta;
}

export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
  coverImage?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  cuisineType?: string | null;
  deliveryFee?: number;
  deliveryTimeMin?: number;
  rating?: number;
  ratingCount?: number;
  approvalStatus?: string;
  isActive?: boolean;
  opensAt?: string;
  closesAt?: string;
  [key: string]: unknown;
}

export interface FoodItem {
  id: number;
  restaurantId: number;
  categoryId?: number | null;
  name: string;
  description?: string | null;
  price: number | string;
  image?: string | null;
  isAvailable: boolean;
  isFeatured?: boolean;
  preparationTimeMin?: number;
  rating?: number;
  ratingCount?: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  foodItems: FoodItem[];
}

export interface Address {
  id: number;
  customerId: number;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode?: string | null;
  phone: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: number;
  foodItemId: number;
  name: string;
  quantity: number;
  price: number | string;
  subtotal: number | string;
  image?: string | null;
}

export interface AuditSplit {
  restaurant: {
    name: string;
    amount: number;
    status: 'SETTLED' | 'IN_ESCROW' | 'PENDING_PAYMENT';
  };
  rider: {
    name: string;
    phone?: string | null;
    amount: number;
    status: 'CREDITED_ON_DELIVERY' | 'IN_TRANSIT' | 'UNASSIGNED';
  };
  platform: {
    amount: number;
    feeRate: string;
    status: 'COLLECTED' | 'PENDING';
  };
  totalCollected: number;
}

export interface Payment {
  id: number;
  orderId: number;
  amount: number | string;
  status: string;
  method: string;
  reference?: string | null;
  provider?: string | null;
  transactionId?: string | null;
  failureReason?: string | null;
  paidAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  order?: {
    id: number;
    orderNumber: string;
    total: number | string;
    subtotal?: number | string;
    deliveryFee?: number | string;
    serviceFee?: number | string;
    status: string;
    paymentMethod?: string;
    placedAt?: string;
    restaurant?: { id: number; name: string; phone?: string; logo?: string };
    customer?: { id: number; user?: { id: number; firstName: string; lastName: string; email: string; phone?: string } };
    delivery?: {
      id: number;
      status: string;
      deliveredAt?: string | null;
      rider?: { id: number; user?: { id: number; firstName: string; lastName: string; phone?: string } };
    };
  };
  auditSplit?: AuditSplit;
}

export interface Delivery {
  id: number;
  orderId: number;
  riderId?: number | null;
  status: string;
  assignedAt?: string | null;
  acceptedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  rider?: { id: number; vehicleType?: string; licensePlate?: string; user?: User } | null;
  order?: {
    id: number;
    orderNumber: string;
    status: string;
    total: number;
    subtotal?: number;
    deliveryFee?: number;
    serviceFee?: number;
    paymentMethod: string;
    deliveryAddress?: string;
    specialInstructions?: string;
    restaurant?: Restaurant;
    customer?: { id: number; user?: User } | null;
  } | null;
}

export interface OrderRating {
  id: number;
  orderId: number;
  rating: number;
  deliveryRating?: number | null;
  comment?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number | null;
  restaurantId: number;
  status: string;
  subtotal: number | string;
  deliveryFee: number | string;
  serviceFee: number | string;
  discount: number | string;
  total: number | string;
  paymentMethod: string;
  specialInstructions?: string | null;
  deliveryAddress?: string | null;
  placedAt: string;
  confirmedAt?: string | null;
  readyAt?: string | null;
  riderAssignedAt?: string | null;
  deliveredAt?: string | null;
  customerConfirmedAt?: string | null;
  cancelledAt?: string | null;
  restaurant?: Restaurant;
  items?: OrderItem[];
  payment?: Payment | null;
  delivery?: Delivery | null;
  deliveries?: Delivery[];
  rider?: { id: number; user?: User; vehicleType?: string; rating?: number } | null;
  customer?: { id?: number; user?: User } | null;
  rating?: OrderRating | null;
  statusHistory?: { id: number; fromStatus: string; toStatus: string; note?: string; createdAt: string }[];
}

export interface Rider {
  id: number;
  userId?: number;
  restaurantId?: number | null;
  restaurant?: { id: number; name: string; phone?: string; addressStreet?: string; addressCity?: string };
  vehicleType?: string;
  licensePlate?: string | null;
  availabilityStatus?: string;
  rating?: number;
  totalDeliveries?: number;
  isActive?: boolean;
  user?: { id: number; firstName: string; lastName: string; phone: string };
}

export interface DashboardPayload {
  counts: Record<string, number>;
  revenue: Record<string, number>;
  orders?: Record<string, number>;
  isLinked?: boolean;
  linkedRestaurant?: { id: number; name: string; phone?: string; addressStreet?: string; addressCity?: string } | null;
  restaurantOrders?: Order[];
  availablePickupOrders?: Order[];
  charts?: {
    sales30?: { label: string; value: number }[];
    sales7?: { label: string; value: number }[];
    orders30?: { label: string; value: number }[];
    statusDistribution?: { status: string; count: number }[];
    revenueByRestaurant?: { name: string; value: number }[];
    popularItems?: { name: string; quantity: number; revenue?: number }[];
  };
  recentOrders?: Order[];
  completionSeries?: { label: string; value: number }[];
  activeDeliveries?: Delivery[];
  restaurantId?: number;
  [key: string]: unknown;
}

export interface ApiErrorBody {
  success: boolean;
  message: string;
  code?: string;
  errors?: { field: string; message: string }[];
  details?: { field: string; message: string }[];
}