export type EntityId = string | number;

export interface BaseProduct {
  readonly id: EntityId;
  title: string;
  price: number;
  description?: string;
  tags: string[];
  inStock: boolean;
}

export type ClothingSize = "XS" | "S" | "M" | "L" | "XL";

interface ProductDetails extends BaseProduct {
  brand: string;
  material: string;
  color: string;
}

export interface Product extends ProductDetails {
  size: ClothingSize;
}

export interface FootwearProduct extends ProductDetails {
  size: number;
}

export type CatalogProduct = Product | FootwearProduct;

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type DeliveryMethod = "courier_fitting" | "post_office" | "store_pickup";

export interface CartItem {
  product: CatalogProduct;
  quantity: number;
}

export type TimestampMetadata = {
  readonly createdAt: Date;
  updatedAt: Date;
};

export type Order = {
  readonly orderId: string;
  customerEmail: string;
  items: CartItem[];
  status: OrderStatus;
  delivery: DeliveryMethod;
  discountPercent?: number;
} & TimestampMetadata;
