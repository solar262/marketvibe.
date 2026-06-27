export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  category: string;
  supplierName: string;
  supplierUrl: string;
  supplierCost: number;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  shippingTime: string;
  tags: string[];
  badge?: string;
  featured: boolean;
  active: boolean;
  affiliateUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled";
export type FulfillmentStatus = "new" | "supplier_ordered" | "shipped";

export type Order = {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string;
  address: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  total: number;
  profit: number;
  createdAt: string;
  trackingNumber?: string;
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    supplierUrl: string;
    supplierCost: number;
    sellingPrice: number;
  }>;
};

export type StoreSettings = {
  storeName: string;
  logoUrl: string;
  accentColor: string;
  supportEmail: string;
  currency: string;
  defaultShippingMessage: string;
  heroText: string;
  seoTitle: string;
  seoDescription: string;
};

export type LeadSearchInput = {
  country: string;
  city: string;
  businessType: string;
  serviceCategory: string;
};

export type ScanFinding = {
  label: string;
  found: boolean;
  weight: number;
  detail: string;
};

export type LeadAudit = {
  pageTitle: string;
  metaDescription: string;
  mobileFriendly: boolean;
  pageSpeed: "fast" | "average" | "slow";
  sslPresent: boolean;
  contactFormPresent: boolean;
  bookingButtonPresent: boolean;
  phoneVisible: boolean;
  emailVisible: boolean;
  socialLinksVisible: boolean;
  reviewsVisible: boolean;
  clearCallToActionVisible: boolean;
  brokenLinks: number;
  oldCopyrightYear?: number;
  score: number;
  findings: ScanFinding[];
  summary: string;
  issues: string[];
  serviceAngle: string;
  outreachMessage: string;
  subjectLine: string;
  priority: "low" | "medium" | "high";
  suggestedOffer: string;
  fixChecklist: string[];
};

export type BusinessLead = {
  id: string;
  slug: string;
  businessName: string;
  website: string;
  contactPageUrl: string;
  publicEmail?: string;
  phone?: string;
  city: string;
  country: string;
  businessCategory: string;
  googleProfileUrl?: string;
  socialLinks: string[];
  source: string;
  sourceStatus?: "live" | "demo";
  sourceUrl?: string;
  audit: LeadAudit;
};

export type AdminLeadSettings = {
  dailySendLimit: number;
  emailSendingEnabled: boolean;
  freeLeadLimit: number;
  starterPrice: number;
  proPrice: number;
  reportPrice: number;
  allowedCountries: string[];
  allowedCategories: string[];
};
