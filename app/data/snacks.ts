export interface SnackProduct {
  id: string;
  name: string;
  subtitle?: string;
  category: string;
  price: string;
  priceAmount: number;
  image: string;
  cardImage?: string;
  bgColor: string;
  isFavorite?: boolean;
}

export const CATEGORIES = ["All", "Chips", "Chocolate", "Cookies", "Candies", "Drinks"];

export const FEATURED_HERO: SnackProduct = {
  id: "potato-chips-purple",
  name: "Potato Chips",
  subtitle: "Crispy salted classic chips",
  category: "Chips",
  price: "$2.00 USD",
  priceAmount: 2.0,
  image: "/images/hero-purple-chips.png",
  bgColor: "#D8CEFA",
  isFavorite: true,
};

export const EXPLORE_COLLECTIONS: SnackProduct[] = [
  {
    id: "crunchy-chips",
    name: "Crunchy Chips",
    subtitle: "Crispy • salty • fun",
    category: "Chips",
    price: "$2.50 USD",
    priceAmount: 2.5,
    image: "/images/cheetos-graphic.png",
    cardImage: "/images/crunchy-card.png",
    bgColor: "#FEF6E9",
  },
  {
    id: "cheese-laius-chips",
    name: "Cheese Laius Chips",
    subtitle: "Cheesy • crunchy • bold",
    category: "Chips",
    price: "$3.20 USD",
    priceAmount: 3.2,
    image: "/images/laius-graphic.png",
    cardImage: "/images/laius-card.png",
    bgColor: "#FDF0E6",
  },
  {
    id: "onion-rings-funyuns",
    name: "Onion Rings Funyuns",
    subtitle: "Crispy • salty • tasty",
    category: "Chips",
    price: "$1.80 USD",
    priceAmount: 1.8,
    image: "/images/funyuns-graphic.png",
    cardImage: "/images/funyuns-card.png",
    bgColor: "#FEFCE8",
  },
];

export const EXPLORE_FILTERS = [
  { id: "all", label: "All", checked: true },
  { id: "recent", label: "Recent", hasPlus: true },
  { id: "offers", label: "Offers", hasPlus: true },
  { id: "trend", label: "Trend...", hasPlus: false },
];

