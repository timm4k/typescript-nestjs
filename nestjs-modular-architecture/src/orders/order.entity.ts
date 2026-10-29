export interface OrderEntity {
  readonly orderId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  currency: string;
  storeName: string;
  customerEmail?: string;
  status: 'confirmed';
  createdAt: string;
}
