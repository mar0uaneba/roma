import type { OrderStatus } from "@/lib/validations";

export type Order = {
  id: string;
  reference: string;
  company: string;
  contactName: string;
  phone: string;
  email: string;
  product: string;
  quantity: number;
  unitPrice: number;
  status: OrderStatus;
  notes: string;
  createdAt: string;
};
