import type { Locale } from "@/lib/i18n/config";

export const orderStatuses = ["draft", "pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const paymentStatuses = ["unpaid", "paid", "refunded", "partially_refunded"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export type PaymentMethod = "cod" | "transfer";
export type OrderSource = "shop" | "admin" | "quote" | "offer";

export const customerStages = ["lead", "customer", "vip", "inactive"] as const;
export type CustomerStage = (typeof customerStages)[number];

export const productStatuses = ["active", "hidden", "sold_out"] as const;
export type ProductStatus = (typeof productStatuses)[number];

export type OrderItem = {
  id: string;
  productSlug: string | null;
  name: string;
  image: string | null;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  lineTotal: number;
};

export type OrderEvent = { id: string; kind: string; message: string; createdAt: string };

export type Order = {
  id: string;
  number: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  source: OrderSource;
  locale: Locale;
  customerId: string | null;
  customerName: string;
  customerCompany: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerCity: string | null;
  customerAddress: string | null;
  customerNote: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  costTotal: number;
  refundedAmount: number;
  carrier: string | null;
  trackingNumber: string | null;
  supplierRef: string | null;
  deliverySlot: string | null;
  deliveryNote: string | null;
  damageFlag: boolean;
  internalNote: string | null;
  cancelReason: string | null;
  offerToken: string | null;
  offerExpiresAt: string | null;
  offerSentAt: string | null;
  quoteId: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export type Customer = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  locale: Locale;
  stage: CustomerStage;
  tags: string[];
  notes: string | null;
  createdAt: string;
};

export type CustomerWithStats = Customer & { orders: number; revenue: number; lastOrderAt: string | null };

export type EmailLog = {
  id: string;
  customerId: string | null;
  orderId: string | null;
  toEmail: string;
  subject: string;
  html: string;
  kind: string;
  status: "sent" | "failed" | "skipped";
  error: string | null;
  createdAt: string;
};

export type QuoteRequest = {
  id: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  city: string | null;
  sector: string;
  product: string | null;
  quantity: string | null;
  message: string;
  status: "new" | "in_review" | "quoted" | "closed";
  locale: Locale;
  draftOrderId: string | null;
  createdAt: string;
};

export type ShopSettings = {
  shippingFee: number | null;
  freeShippingFrom: number | null;
  minOrder: number | null;
  bankDetails: string;
  transferEnabled: boolean;
};

export const defaultSettings: ShopSettings = {
  shippingFee: null,
  freeShippingFrom: null,
  minOrder: null,
  bankDetails: "",
  transferEnabled: false,
};
