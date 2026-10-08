export interface Product {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  price: number; // in VND
  priceFormatted: string;
  unit: string;
  image: string;
  bgColor: string;
  badge?: string;
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

export const PRODUCTS: Product[] = [
  {
    id: "ba-chi-bo-my",
    name: "Ba Chỉ Bò Mỹ Cuộn",
    subtitle: "Thịt bò mềm mọng, nẹp cuộn đẹp mắt cho lẩu & nướng BBQ",
    category: "Thịt bò & Heo",
    price: 110000,
    priceFormatted: "110.000₫",
    unit: "Khay 500g",
    image: "/images/bo-cuon.png",
    bgColor: "#FEF2F2", // soft red
    badge: "Bán chạy nhất",
  },
  {
    id: "ba-chi-heo-cuon",
    name: "Ba Chỉ Heo Thái Cuộn",
    subtitle: "Tỷ lệ nạc mỡ cân đối, thơm ngọt, chuẩn tươi ngon",
    category: "Thịt bò & Heo",
    price: 75000,
    priceFormatted: "75.000₫",
    unit: "Khay 500g",
    image: "/images/heo-cuon.png",
    bgColor: "#FFF1F2", // soft rose
    badge: "Giá sỉ xưởng",
  },
  {
    id: "lap-xuong-tuoi-dai-loan",
    name: "Lạp Xưởng Tươi Đài Loan (LC Foods)",
    subtitle: "Hương vị chuẩn Đài Loan, thơm bùi gia vị tự nhiên",
    category: "Xúc xích & Lạp xưởng",
    price: 65000,
    priceFormatted: "65.000₫",
    unit: "Gói 500g",
    image: "/images/lap-xuong.png",
    bgColor: "#FEF3C7", // warm amber
    badge: "Hàng hot",
  },
  {
    id: "xuc-xich-duc-lc-foods",
    name: "Xúc Xích Đức Thượng Hạng (LC Foods)",
    subtitle: "Thơm mùi xông khói gỗ sồi, giòn dai chuẩn vị Đức",
    category: "Xúc xích & Lạp xưởng",
    price: 55000,
    priceFormatted: "55.000₫",
    unit: "Gói 500g",
    image: "/images/xuc-xich.png",
    bgColor: "#FFEDD5", // soft orange
  },
  {
    id: "pho-mai-emborg-burger-slices",
    name: "Phô Mai Lát Emborg Burger Slices",
    subtitle: "Hộp 84 lát béo ngậy, chuyên cho hamburger, bánh mì, nướng",
    category: "Phô mai & Bơ sữa",
    price: 240000,
    priceFormatted: "240.000₫",
    unit: "Gói 84 lát (1.033kg)",
    image: "/images/emborg-slices.png",
    bgColor: "#F3E8FF", // soft purple
    badge: "Nhập khẩu",
  },
  {
    id: "pho-mai-bao-soi-benstrell",
    name: "Phô Mai Bào Sợi Pizza Topping Benstrell",
    subtitle: "Kéo sợi siêu dai dài, vàng ươm, thơm nức mũi",
    category: "Phô mai & Bơ sữa",
    price: 175000,
    priceFormatted: "175.000₫",
    unit: "Gói 1kg",
    image: "/images/pho-mai-soi.png",
    bgColor: "#FEF9C3", // soft yellow
  },
  {
    id: "vien-tha-lau-trung-ca",
    name: "Viên Thả Lẩu Trứng Cá (LC Foods)",
    subtitle: "Nhân trứng cá béo bùi nổ lép bép, vỏ giòn dai thơm",
    category: "Viên thả lẩu",
    price: 58000,
    priceFormatted: "58.000₫",
    unit: "Gói 500g",
    image: "/images/vien-lau.png",
    bgColor: "#ECFDF5", // soft emerald
    badge: "Món lẩu yêu thích",
  },
];
