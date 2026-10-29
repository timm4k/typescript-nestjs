export const clothingSizes = ['XS', 'S', 'M', 'L', 'XL'] as const;

export type ClothingSize = (typeof clothingSizes)[number];

export interface Clothing {
  readonly id: string;
  title: string;
  price: number;
  size: ClothingSize;
  material: string;
  color: string;
}
