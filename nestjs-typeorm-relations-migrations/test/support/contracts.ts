export interface CollectionResponse {
  id: string;
  name: string;
}

export interface MaterialResponse {
  id: string;
  name: string;
}

export interface CareResponse {
  id: string;
  washingTemperature: number;
  dryCleanOnly: boolean;
  instructions: string;
}

export interface ClothingResponse {
  id: string;
  title: string;
  price: string;
  size: string;
  color: string;
  collection: CollectionResponse;
  materials: MaterialResponse[];
  careInstruction: CareResponse;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse {
  data: ClothingResponse[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface Counts {
  clothes: number;
  materials: number;
  care: number;
  links: number;
}
