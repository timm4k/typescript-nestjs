import { createProduct } from "./catalog.js";
import type { CatalogProduct } from "./models.js";

export function createCatalog(): CatalogProduct[] {
  return [
    createProduct({
      id: 1,
      title: "Sweat Oversized Pullover Hoodie",
      brand: "UNIQLO",
      price: 1800,
      description: "An oversized pullover hoodie from the UNIQLO sweat collection",
      tags: ["clothing", "hoodie", "oversized"],
      inStock: true,
      size: "M",
      material: "Cotton blend",
      color: "Gray",
    }),
    createProduct({
      id: "sneakers-02",
      title: "Fishnet Shoes",
      brand: "Cat&Sofa",
      price: 2400,
      tags: ["footwear", "everyday"],
      inStock: true,
      size: 42,
      material: "Textile",
      color: "Blue",
    }),
    createProduct({
      id: "boots-03",
      title: "Retro Chunky Heel Work Boots",
      brand: "Mule Donkey",
      price: 3200,
      description: "Work-inspired boots with a chunky heel",
      tags: ["footwear", "boots", "workwear"],
      inStock: true,
      size: 43,
      material: "Faux leather",
      color: "Black",
    }),
    createProduct({
      id: 4,
      title: "AIRism Cotton Oversized T-Shirt",
      brand: "UNIQLO",
      price: 950,
      description: "An oversized AIRism cotton-blend tee with half-length sleeves",
      tags: ["clothing", "t-shirt", "airism"],
      inStock: true,
      size: "S",
      material: "Cotton blend",
      color: "White",
    }),
    createProduct({
      id: "trousers-05",
      title: "Sweat Wide Pants",
      brand: "UNIQLO",
      price: 2100,
      description:
        "Wide sweatpants with a relaxed straight-leg silhouette",
      tags: ["clothing", "trousers", "sweatwear"],
      inStock: true,
      size: "XS",
      material: "Cotton blend",
      color: "Gray",
    }),
  ];
}
