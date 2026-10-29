export enum ClothingSize {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
}

export interface ClothingEntity {
  readonly id: string;
  title: string;
  price: number;
  size: ClothingSize;
  material: string;
  color: string;
}

export interface ClothesListResponse {
  items: ClothingEntity[];
  meta: { total: number; limit: number };
}
