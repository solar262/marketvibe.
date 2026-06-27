import type { Category, Order, Product, StoreSettings } from "./types";
import { sourceCategories, sourceProducts } from "./source-data";

const baseCategories: Category[] = [
  {
    id: "workspace",
    name: "Workspace",
    slug: "workspace",
    description: "Desk tools and quiet productivity upgrades.",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "home",
    name: "Home Essentials",
    slug: "home-essentials",
    description: "Compact home goods with proven supplier availability.",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "tech",
    name: "Everyday Tech",
    slug: "everyday-tech",
    description: "Useful accessories with clean margins.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "wellness",
    name: "Wellness",
    slug: "wellness",
    description: "Simple lifestyle products customers reorder and gift.",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
  },
];

const baseProducts: Product[] = [
  {
    id: "p-001",
    title: "Magnetic Desk Cable Dock",
    slug: "magnetic-desk-cable-dock",
    description: "A low-profile weighted dock that keeps charging cables visible, tidy, and ready for repeat use.",
    images: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80",
    ],
    category: "workspace",
    supplierName: "Northline Supply",
    supplierUrl: "https://supplier.example/cable-dock",
    supplierCost: 7.2,
    price: 24,
    compareAtPrice: 34,
    sku: "MV-CABLE-001",
    stock: 62,
    shippingTime: "7-12 business days",
    tags: ["desk", "organizer", "tech"],
    badge: "Best margin",
    featured: true,
    active: true,
    seoTitle: "Magnetic Desk Cable Dock",
    seoDescription: "Minimal cable organizer for tidy desks.",
  },
  {
    id: "p-002",
    title: "Fold-Flat Laptop Riser",
    slug: "fold-flat-laptop-riser",
    description: "Portable aluminum riser with six height settings for better posture in small spaces.",
    images: [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80",
    ],
    category: "workspace",
    supplierName: "Workwell Direct",
    supplierUrl: "https://supplier.example/laptop-riser",
    supplierCost: 13.5,
    price: 42,
    compareAtPrice: 59,
    sku: "MV-RISER-002",
    stock: 18,
    shippingTime: "6-10 business days",
    tags: ["laptop", "remote work"],
    badge: "Low stock",
    featured: true,
    active: true,
  },
  {
    id: "p-003",
    title: "Smart Pantry Label Kit",
    slug: "smart-pantry-label-kit",
    description: "Water-resistant labels and a simple marker set for clean pantry organization.",
    images: [
      "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1000&q=80",
    ],
    category: "home",
    supplierName: "Casa Trade Co.",
    supplierUrl: "https://supplier.example/pantry-label-kit",
    supplierCost: 4.25,
    price: 18,
    compareAtPrice: 25,
    sku: "MV-LABEL-003",
    stock: 140,
    shippingTime: "8-14 business days",
    tags: ["home", "kitchen"],
    badge: "Fast setup",
    featured: true,
    active: true,
  },
  {
    id: "p-004",
    title: "Minimal LED Night Bar",
    slug: "minimal-led-night-bar",
    description: "Motion-sensitive warm LED bar for hallways, closets, and late-night kitchen trips.",
    images: [
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80",
    ],
    category: "home",
    supplierName: "Lumen Route",
    supplierUrl: "https://supplier.example/night-bar",
    supplierCost: 6.8,
    price: 29,
    compareAtPrice: 39,
    sku: "MV-LIGHT-004",
    stock: 86,
    shippingTime: "7-12 business days",
    tags: ["lighting", "home"],
    featured: false,
    active: true,
  },
  {
    id: "p-005",
    title: "Pocket USB-C Hub",
    slug: "pocket-usb-c-hub",
    description: "A travel-sized USB-C hub with HDMI, USB-A, SD, and fast pass-through charging.",
    images: [
      "https://images.unsplash.com/photo-1618410320928-25228d811631?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1000&q=80",
    ],
    category: "tech",
    supplierName: "Portsmith Global",
    supplierUrl: "https://supplier.example/usb-c-hub",
    supplierCost: 12,
    price: 39,
    compareAtPrice: 55,
    sku: "MV-HUB-005",
    stock: 31,
    shippingTime: "5-9 business days",
    tags: ["tech", "travel"],
    badge: "Trending",
    featured: true,
    active: true,
  },
  {
    id: "p-006",
    title: "Acupressure Travel Mat",
    slug: "acupressure-travel-mat",
    description: "Rollable mat for quick relaxation routines at home or after long travel days.",
    images: [
      "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=80",
    ],
    category: "wellness",
    supplierName: "CalmStock",
    supplierUrl: "https://supplier.example/acupressure-mat",
    supplierCost: 10.5,
    price: 36,
    compareAtPrice: 49,
    sku: "MV-MAT-006",
    stock: 44,
    shippingTime: "8-13 business days",
    tags: ["wellness", "travel"],
    featured: false,
    active: true,
    affiliateUrl: "https://supplier.example/acupressure-mat?affiliate=marketvibe",
  },
];

export const orders: Order[] = [
  {
    id: "o-1004",
    number: "MV-1004",
    customerName: "Jordan Blake",
    customerEmail: "jordan@example.com",
    address: "42 Maple Street, Austin, TX",
    status: "paid",
    fulfillmentStatus: "new",
    total: 81,
    profit: 48.3,
    createdAt: "2026-06-16T12:30:00.000Z",
    items: [
      { productId: "p-001", title: "Magnetic Desk Cable Dock", quantity: 1, supplierUrl: "https://supplier.example/cable-dock", supplierCost: 7.2, sellingPrice: 24 },
      { productId: "p-002", title: "Fold-Flat Laptop Riser", quantity: 1, supplierUrl: "https://supplier.example/laptop-riser", supplierCost: 13.5, sellingPrice: 42 },
    ],
  },
  {
    id: "o-1003",
    number: "MV-1003",
    customerName: "Sam Carter",
    customerEmail: "sam@example.com",
    address: "9 Market Lane, Denver, CO",
    status: "pending",
    fulfillmentStatus: "new",
    total: 39,
    profit: 27,
    createdAt: "2026-06-15T09:10:00.000Z",
    items: [{ productId: "p-005", title: "Pocket USB-C Hub", quantity: 1, supplierUrl: "https://supplier.example/usb-c-hub", supplierCost: 12, sellingPrice: 39 }],
  },
];

export const categories: Category[] = [
  ...sourceCategories,
  ...baseCategories.filter((category) => !sourceCategories.some((source) => source.id === category.id)),
];

export const products: Product[] = [
  ...sourceProducts,
  ...baseProducts,
];

export const settings: StoreSettings = {
  storeName: "MarketVibe",
  logoUrl: "",
  accentColor: "#111827",
  supportEmail: "support@marketvibepro.example",
  currency: "USD",
  defaultShippingMessage: "Most products ship in 5-14 business days from vetted suppliers.",
  heroText: "Find a Realistic Online Business Idea Before You Waste Money",
  seoTitle: "MarketVibe: Free Business, Side Hustle & Product Research Tools",
  seoDescription: "Use free MarketVibe tools to research side hustle ideas, digital products, affiliate niches, product margins, and beginner-friendly online business opportunities.",
};

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug && product.active);
}

export function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function money(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function margin(product: Pick<Product, "price" | "supplierCost">) {
  if (!product.price) return 0;
  return Math.round(((product.price - product.supplierCost) / product.price) * 100);
}
