export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  priceFormatted: string;
  unit: string;
  stock: number;
  image: string;
  bgColor: string;
  badge?: string;
  tags?: string[];
}

export const CATEGORIES = [
  "Tất cả",
  "Thịt bò & Heo",
  "Xúc xích & Lạp xưởng",
  "Phô mai & Bơ sữa",
  "Viên thả lẩu",
];

export const PRICE_RANGES = [
  { id: "all", label: "Tất cả mức giá", min: 0, max: Infinity },
  { id: "under-60k", label: "Dưới 60.000₫", min: 0, max: 60000 },
  { id: "60k-120k", label: "60.000₫ - 120.000₫", min: 60000, max: 120000 },
  { id: "above-120k", label: "Trên 120.000₫", min: 120000, max: Infinity },
];
