import type { Category, Product } from "./types";

export const sourceCategories: Category[] = [
  {
    "id": "fashion",
    "name": "Fashion",
    "slug": "fashion",
    "description": "Curated Fashion products from the source catalog.",
    "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
  },
  {
    "id": "sports",
    "name": "Sports",
    "slug": "sports",
    "description": "Curated Sports products from the source catalog.",
    "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
  },
  {
    "id": "electronics",
    "name": "Electronics",
    "slug": "electronics",
    "description": "Curated Electronics products from the source catalog.",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"
  },
  {
    "id": "home-garden",
    "name": "Home & Garden",
    "slug": "home-garden",
    "description": "Curated Home & Garden products from the source catalog.",
    "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"
  },
  {
    "id": "health",
    "name": "Health",
    "slug": "health",
    "description": "Curated Health products from the source catalog.",
    "image": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
  },
  {
    "id": "beauty",
    "name": "Beauty",
    "slug": "beauty",
    "description": "Curated Beauty products from the source catalog.",
    "image": "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
  }
];

export const sourceProducts: Product[] = [
  {
    "id": "src-001",
    "title": "Air Jordan 1 Retro High OG Chicago",
    "slug": "air-jordan-1-retro-high-og-chicago-1",
    "description": "Iconic Air Jordan 1 in the legendary Chicago colorway. Full-grain leather upper with Nike Air cushioning. Perforated toe box for breathability. Rubber outsole with herringbone traction pattern. DS deadstock condition with original box.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-aj1-chi",
    "supplierCost": 48,
    "price": 69.8,
    "compareAtPrice": 82.36,
    "sku": "KS-AJ1-CHI",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "badge": "Source catalog",
    "featured": true,
    "active": true,
    "seoTitle": "Air Jordan 1 Retro High OG Chicago",
    "seoDescription": "Iconic Air Jordan 1 in the legendary Chicago colorway. Full-grain leather upper with Nike Air cushioning. Perforated toe box for breathability. Rubber outs"
  },
  {
    "id": "src-002",
    "title": "Nike Dunk Low Panda White Black",
    "slug": "nike-dunk-low-panda-white-black-2",
    "description": "The clean-cut Dunk Low in the iconic Panda colorway. Leather upper with perforated toe box. Padded collar for comfort. Nike Swoosh branding. Rubber cupsole with pivot point. One of the most sought-after silhouettes of the decade.",
    "images": [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-dunk-pnd",
    "supplierCost": 38,
    "price": 57.2,
    "compareAtPrice": 67.5,
    "sku": "KS-DUNK-PND",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "badge": "Source catalog",
    "featured": true,
    "active": true,
    "seoTitle": "Nike Dunk Low Panda White Black",
    "seoDescription": "The clean-cut Dunk Low in the iconic Panda colorway. Leather upper with perforated toe box. Padded collar for comfort. Nike Swoosh branding. Rubber cupsole"
  },
  {
    "id": "src-003",
    "title": "Adidas Yeezy Boost 350 V2 Zebra",
    "slug": "adidas-yeezy-boost-350-v2-zebra-3",
    "description": "Kanye West's iconic Yeezy Boost 350 V2 in the coveted Zebra colorway. Primeknit upper with BOOST cushioning technology. Distinctive side stripe detail. Translucent rubber outsole. Unisex sizing available. Comes in original packaging.",
    "images": [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600"
    ],
    "category": "fashion",
    "supplierName": "YeezySource Co",
    "supplierUrl": "https://supplier.example.com/ys-350v2-zbr",
    "supplierCost": 62,
    "price": 87.8,
    "compareAtPrice": 103.6,
    "sku": "YS-350V2-ZBR",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "yeezysource co"
    ],
    "badge": "Source catalog",
    "featured": true,
    "active": true,
    "seoTitle": "Adidas Yeezy Boost 350 V2 Zebra",
    "seoDescription": "Kanye West's iconic Yeezy Boost 350 V2 in the coveted Zebra colorway. Primeknit upper with BOOST cushioning technology. Distinctive side stripe detail. Tra"
  },
  {
    "id": "src-004",
    "title": "New Balance 550 White Grey",
    "slug": "new-balance-550-white-grey-4",
    "description": "Retro basketball shoe reissued for modern streetwear. Leather and mesh upper with classic New Balance branding. Vintage cup sole construction. EVA foam midsole. Clean white and grey colorway works with any outfit.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "NB Wholesale Hub",
    "supplierUrl": "https://supplier.example.com/nb-550-wgy",
    "supplierCost": 32,
    "price": 49.4,
    "compareAtPrice": 58.29,
    "sku": "NB-550-WGY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "nb wholesale hub"
    ],
    "badge": "Source catalog",
    "featured": true,
    "active": true,
    "seoTitle": "New Balance 550 White Grey",
    "seoDescription": "Retro basketball shoe reissued for modern streetwear. Leather and mesh upper with classic New Balance branding. Vintage cup sole construction. EVA foam mid"
  },
  {
    "id": "src-005",
    "title": "Nike Air Force 1 Low Triple White",
    "slug": "nike-air-force-1-low-triple-white-5",
    "description": "The shoe that started it all. Classic Air Force 1 in the timeless triple white. Full leather upper with perforated toe cap. Nike Air unit in heel. Durable rubber outsole. Versatile enough for any occasion from street to gym.",
    "images": [
      "https://images.unsplash.com/photo-1584735175315-9d5df23be2c2?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-af1-wht",
    "supplierCost": 28,
    "price": 44,
    "compareAtPrice": 51.92,
    "sku": "KS-AF1-WHT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "badge": "Source catalog",
    "featured": true,
    "active": true,
    "seoTitle": "Nike Air Force 1 Low Triple White",
    "seoDescription": "The shoe that started it all. Classic Air Force 1 in the timeless triple white. Full leather upper with perforated toe cap. Nike Air unit in heel. Durable "
  },
  {
    "id": "src-006",
    "title": "Adidas Stan Smith White Green",
    "slug": "adidas-stan-smith-white-green-6",
    "description": "Tennis icon turned streetwear staple. Smooth leather upper with serrated 3-Stripes detail. Perforated Stan Smith face logo on tongue. OrthoLite insole for comfort. Herringbone rubber outsole. Minimal design that goes with everything.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "Adidas Wholesale",
    "supplierUrl": "https://supplier.example.com/aw-stan-wgn",
    "supplierCost": 22,
    "price": 36.2,
    "compareAtPrice": 42.72,
    "sku": "AW-STAN-WGN",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "adidas wholesale"
    ],
    "badge": "Source catalog",
    "featured": true,
    "active": true,
    "seoTitle": "Adidas Stan Smith White Green",
    "seoDescription": "Tennis icon turned streetwear staple. Smooth leather upper with serrated 3-Stripes detail. Perforated Stan Smith face logo on tongue. OrthoLite insole for "
  },
  {
    "id": "src-007",
    "title": "Puma Suede Classic Shadow Grey",
    "slug": "puma-suede-classic-shadow-grey-7",
    "description": "The original Puma Suede first created in 1968. Premium suede upper with formstripe branding. Rubber outsole for grip. Padded ankle collar. Available in shadow grey — a versatile neutral that pairs with any outfit. Iconic silhouette that shaped sneaker culture.",
    "images": [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600"
    ],
    "category": "fashion",
    "supplierName": "Puma Direct Supply",
    "supplierUrl": "https://supplier.example.com/pd-sde-gry",
    "supplierCost": 19,
    "price": 32,
    "compareAtPrice": 37.76,
    "sku": "PD-SDE-GRY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "puma direct supply"
    ],
    "badge": "Source catalog",
    "featured": true,
    "active": true,
    "seoTitle": "Puma Suede Classic Shadow Grey",
    "seoDescription": "The original Puma Suede first created in 1968. Premium suede upper with formstripe branding. Rubber outsole for grip. Padded ankle collar. Available in sha"
  },
  {
    "id": "src-008",
    "title": "Converse Chuck Taylor All Star High Black",
    "slug": "converse-chuck-taylor-all-star-high-black-8",
    "description": "The legendary Chuck Taylor All Star in classic black. Canvas upper with rubber toe cap and bumper. Medial eyelets for ventilation. OrthoLite cushioned insole. Rubber outsole with cupsole construction. 100+ year heritage design still relevant today.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "Converse Supply Hub",
    "supplierUrl": "https://supplier.example.com/csh-ctayh-blk",
    "supplierCost": 14.5,
    "price": 26,
    "compareAtPrice": 30.68,
    "sku": "CSH-CTAYH-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "converse supply hub"
    ],
    "badge": "Source catalog",
    "featured": true,
    "active": true,
    "seoTitle": "Converse Chuck Taylor All Star High Black",
    "seoDescription": "The legendary Chuck Taylor All Star in classic black. Canvas upper with rubber toe cap and bumper. Medial eyelets for ventilation. OrthoLite cushioned inso"
  },
  {
    "id": "src-009",
    "title": "Vans Old Skool True White",
    "slug": "vans-old-skool-true-white-9",
    "description": "The iconic Vans Old Skool with the original side stripe. Canvas and suede upper. Waffle outsole for superior traction. Padded collar for comfort. Internal foam padding for a locked-in feel. Classic skate shoe silhouette.",
    "images": [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600"
    ],
    "category": "fashion",
    "supplierName": "Vans Wholesale",
    "supplierUrl": "https://supplier.example.com/vw-olds-wht",
    "supplierCost": 17,
    "price": 29.6,
    "compareAtPrice": 34.93,
    "sku": "VW-OLDS-WHT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "vans wholesale"
    ],
    "badge": "Source catalog",
    "featured": false,
    "active": true,
    "seoTitle": "Vans Old Skool True White",
    "seoDescription": "The iconic Vans Old Skool with the original side stripe. Canvas and suede upper. Waffle outsole for superior traction. Padded collar for comfort. Internal "
  },
  {
    "id": "src-010",
    "title": "Reebok Classic Leather White",
    "slug": "reebok-classic-leather-white-10",
    "description": "Simple and iconic. Reebok Classic Leather in clean white. Full-grain leather upper. EVA midsole for cushioning. Low-cut silhouette. Die-cut midsole for lightweight cushioning. A timeless sneaker that has been in production since 1983.",
    "images": [
      "https://images.unsplash.com/photo-1584735175315-9d5df23be2c2?w=600"
    ],
    "category": "fashion",
    "supplierName": "ReebokDirect Supply",
    "supplierUrl": "https://supplier.example.com/rd-clsslth-wht",
    "supplierCost": 18.5,
    "price": 31.4,
    "compareAtPrice": 37.05,
    "sku": "RD-CLSSLTH-WHT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "reebokdirect supply"
    ],
    "badge": "Source catalog",
    "featured": false,
    "active": true,
    "seoTitle": "Reebok Classic Leather White",
    "seoDescription": "Simple and iconic. Reebok Classic Leather in clean white. Full-grain leather upper. EVA midsole for cushioning. Low-cut silhouette. Die-cut midsole for lig"
  },
  {
    "id": "src-011",
    "title": "Nike Air Max 90 White Infrared",
    "slug": "nike-air-max-90-white-infrared-11",
    "description": "The Air Max 90 in the original infrared colorway that defined a generation. Max Air cushioning in heel. Engineered mesh upper with leather overlays. Waffle-pattern rubber outsole. BRS 1000 carbon rubber outsole pods. A running classic turned streetwear icon.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-am90-infr",
    "supplierCost": 42,
    "price": 62,
    "compareAtPrice": 73.16,
    "sku": "KS-AM90-INFR",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "badge": "Source catalog",
    "featured": false,
    "active": true,
    "seoTitle": "Nike Air Max 90 White Infrared",
    "seoDescription": "The Air Max 90 in the original infrared colorway that defined a generation. Max Air cushioning in heel. Engineered mesh upper with leather overlays. Waffle"
  },
  {
    "id": "src-012",
    "title": "Adidas Superstar Shell Toe White Black",
    "slug": "adidas-superstar-shell-toe-white-black-12",
    "description": "Born in the 70s on the basketball court. Adidas Superstar with the iconic shell toe. Leather upper with 3-Stripes detail. Rubber shell toe protection. OrthoLite sockliner. Herringbone rubber outsole. Endorsed by Run-DMC. Still a cultural cornerstone.",
    "images": [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600"
    ],
    "category": "fashion",
    "supplierName": "Adidas Wholesale",
    "supplierUrl": "https://supplier.example.com/aw-supstr-wbk",
    "supplierCost": 24,
    "price": 38.6,
    "compareAtPrice": 45.55,
    "sku": "AW-SUPSTR-WBK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "adidas wholesale"
    ],
    "badge": "Source catalog",
    "featured": false,
    "active": true,
    "seoTitle": "Adidas Superstar Shell Toe White Black",
    "seoDescription": "Born in the 70s on the basketball court. Adidas Superstar with the iconic shell toe. Leather upper with 3-Stripes detail. Rubber shell toe protection. Orth"
  },
  {
    "id": "src-013",
    "title": "Nike SB Dunk High Pro Black",
    "slug": "nike-sb-dunk-high-pro-black-13",
    "description": "Skateboarding DNA meets street style. Nike SB Dunk High in classic black leather. Zoom Air insole for impact protection. Padded tongue and collar for ankle support. Herringbone-pattern outsole for grip. Gum rubber outsole for board feel.",
    "images": [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-sbdh-blk",
    "supplierCost": 44,
    "price": 65,
    "compareAtPrice": 76.7,
    "sku": "KS-SBDH-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike SB Dunk High Pro Black",
    "seoDescription": "Skateboarding DNA meets street style. Nike SB Dunk High in classic black leather. Zoom Air insole for impact protection. Padded tongue and collar for ankle"
  },
  {
    "id": "src-014",
    "title": "New Balance 990v5 Grey",
    "slug": "new-balance-990v5-grey-14",
    "description": "Made in USA premium running shoe elevated to lifestyle icon. 990v5 in classic grey. ENCAP midsole technology. Pigskin and mesh upper. Reflective details. Dual-density collar foam. Ground contact Blown rubber outsole. The pinnacle of New Balance craftsmanship.",
    "images": [
      "https://images.unsplash.com/photo-1584735175315-9d5df23be2c2?w=600"
    ],
    "category": "fashion",
    "supplierName": "NB Wholesale Hub",
    "supplierUrl": "https://supplier.example.com/nb-990v5-gry",
    "supplierCost": 68,
    "price": 95.6,
    "compareAtPrice": 112.81,
    "sku": "NB-990V5-GRY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "nb wholesale hub"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "New Balance 990v5 Grey",
    "seoDescription": "Made in USA premium running shoe elevated to lifestyle icon. 990v5 in classic grey. ENCAP midsole technology. Pigskin and mesh upper. Reflective details. D"
  },
  {
    "id": "src-015",
    "title": "ASICS Gel-Lyte III Cream",
    "slug": "asics-gel-lyte-iii-cream-15",
    "description": "Japanese running heritage meets global streetwear. Gel-Lyte III with split-tongue design in cream. ASICS GEL cushioning system. Suede and mesh upper. Removable sockliner. AHAR rubber outsole for durability. A cult favourite since 1990.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "ASICS Supply Japan",
    "supplierUrl": "https://supplier.example.com/asj-glt3-crm",
    "supplierCost": 34,
    "price": 51.8,
    "compareAtPrice": 61.12,
    "sku": "ASJ-GLT3-CRM",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "asics supply japan"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "ASICS Gel-Lyte III Cream",
    "seoDescription": "Japanese running heritage meets global streetwear. Gel-Lyte III with split-tongue design in cream. ASICS GEL cushioning system. Suede and mesh upper. Remov"
  },
  {
    "id": "src-016",
    "title": "Nike Zoom Freak 5 Giannis",
    "slug": "nike-zoom-freak-5-giannis-16",
    "description": "Giannis Antetokounmpo's signature performance shoe. Nike Zoom Freak 5 with dual Zoom Air units. Engineered textile upper for lockdown fit. Herringbone traction pattern. Wide base for lateral stability. Built for the Greek Freak's game.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "sports",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-zfk5-gia",
    "supplierCost": 46,
    "price": 67.4,
    "compareAtPrice": 79.53,
    "sku": "KS-ZFK5-GIA",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Zoom Freak 5 Giannis",
    "seoDescription": "Giannis Antetokounmpo's signature performance shoe. Nike Zoom Freak 5 with dual Zoom Air units. Engineered textile upper for lockdown fit. Herringbone trac"
  },
  {
    "id": "src-017",
    "title": "Adidas Ultraboost 23 Core Black",
    "slug": "adidas-ultraboost-23-core-black-17",
    "description": "The pinnacle of Adidas running innovation. Ultraboost 23 with responsive BOOST cushioning. Stretchweb outsole for natural flexibility. Primeknit+ upper. Linear Energy Push system. Zero dye upper for sustainability. A shoe that runs as good as it looks.",
    "images": [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600"
    ],
    "category": "sports",
    "supplierName": "Adidas Wholesale",
    "supplierUrl": "https://supplier.example.com/aw-ub23-cbk",
    "supplierCost": 52,
    "price": 74.6,
    "compareAtPrice": 88.03,
    "sku": "AW-UB23-CBK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "adidas wholesale"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Adidas Ultraboost 23 Core Black",
    "seoDescription": "The pinnacle of Adidas running innovation. Ultraboost 23 with responsive BOOST cushioning. Stretchweb outsole for natural flexibility. Primeknit+ upper. Li"
  },
  {
    "id": "src-018",
    "title": "Nike Air Jordan 4 Retro Bred",
    "slug": "nike-air-jordan-4-retro-bred-18",
    "description": "The legendary Air Jordan 4 in Bred colorway worn by Michael Jordan in 1989. Flight netting on the sides. Visible Air unit in heel. Molded eyelets. Lace-lock system. Solid black rubber outsole with circular pivot point.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-aj4-bred",
    "supplierCost": 72,
    "price": 101,
    "compareAtPrice": 119.18,
    "sku": "KS-AJ4-BRED",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Air Jordan 4 Retro Bred",
    "seoDescription": "The legendary Air Jordan 4 in Bred colorway worn by Michael Jordan in 1989. Flight netting on the sides. Visible Air unit in heel. Molded eyelets. Lace-loc"
  },
  {
    "id": "src-019",
    "title": "Nike Air Jordan 11 Retro Concord",
    "slug": "nike-air-jordan-11-retro-concord-19",
    "description": "Michael Jordan's own personal favourite. AJ11 Concord in iconic patent leather upper. Carbon fiber plate. Full-length Air sole unit. Translucent rubber outsole. Lace lock system. One of the most iconic basketball shoes ever made.",
    "images": [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-aj11-con",
    "supplierCost": 78,
    "price": 109.4,
    "compareAtPrice": 129.09,
    "sku": "KS-AJ11-CON",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Air Jordan 11 Retro Concord",
    "seoDescription": "Michael Jordan's own personal favourite. AJ11 Concord in iconic patent leather upper. Carbon fiber plate. Full-length Air sole unit. Translucent rubber out"
  },
  {
    "id": "src-020",
    "title": "Salehe Bembury New Balance 2002R",
    "slug": "salehe-bembury-new-balance-2002r-20",
    "description": "Collaboration between visionary designer Salehe Bembury and New Balance. 2002R with ABZORB DTS midsole. Suede and mesh upper in earthy tones. Unique traction outsole. Reflective branding details. A collector's grail.",
    "images": [
      "https://images.unsplash.com/photo-1584735175315-9d5df23be2c2?w=600"
    ],
    "category": "fashion",
    "supplierName": "NB Wholesale Hub",
    "supplierUrl": "https://supplier.example.com/nb-2002r-sal",
    "supplierCost": 58,
    "price": 83,
    "compareAtPrice": 97.94,
    "sku": "NB-2002R-SAL",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "nb wholesale hub"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Salehe Bembury New Balance 2002R",
    "seoDescription": "Collaboration between visionary designer Salehe Bembury and New Balance. 2002R with ABZORB DTS midsole. Suede and mesh upper in earthy tones. Unique tracti"
  },
  {
    "id": "src-021",
    "title": "Nike Air Max 1 OG Anniversary",
    "slug": "nike-air-max-1-og-anniversary-21",
    "description": "The shoe that started the Air Max revolution. Air Max 1 in OG anniversary colorway. Visible Max Air unit. Leather and mesh upper. Foam midsole. Herringbone rubber outsole. Tinker Hatfield's design masterpiece celebrating the original 1987 design.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-am1-ann",
    "supplierCost": 44,
    "price": 65,
    "compareAtPrice": 76.7,
    "sku": "KS-AM1-ANN",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Air Max 1 OG Anniversary",
    "seoDescription": "The shoe that started the Air Max revolution. Air Max 1 in OG anniversary colorway. Visible Max Air unit. Leather and mesh upper. Foam midsole. Herringbone"
  },
  {
    "id": "src-022",
    "title": "Adidas Forum Low Cloud White",
    "slug": "adidas-forum-low-cloud-white-22",
    "description": "Revived basketball classic from the 80s. Forum Low in clean cloud white. Leather upper with ankle strap. 3-Stripes branding. EVA midsole. Herringbone rubber outsole. Steeped in b-ball history and hip-hop culture. Available in full-family sizing.",
    "images": [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600"
    ],
    "category": "fashion",
    "supplierName": "Adidas Wholesale",
    "supplierUrl": "https://supplier.example.com/aw-forl-cwh",
    "supplierCost": 26,
    "price": 41.6,
    "compareAtPrice": 49.09,
    "sku": "AW-FORL-CWH",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "adidas wholesale"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Adidas Forum Low Cloud White",
    "seoDescription": "Revived basketball classic from the 80s. Forum Low in clean cloud white. Leather upper with ankle strap. 3-Stripes branding. EVA midsole. Herringbone rubbe"
  },
  {
    "id": "src-023",
    "title": "On Running Cloud 5 All White",
    "slug": "on-running-cloud-5-all-white-23",
    "description": "Swiss precision meets everyday comfort. On Cloud 5 with CloudTec sole technology. Engineered mesh upper. Zero-gravity foam cushioning. Helion superfoam. Speed Lace system available. The Swiss running brand loved by Roger Federer.",
    "images": [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600"
    ],
    "category": "sports",
    "supplierName": "OnRunning Direct",
    "supplierUrl": "https://supplier.example.com/ord-cld5-wht",
    "supplierCost": 49,
    "price": 71,
    "compareAtPrice": 83.78,
    "sku": "ORD-CLD5-WHT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "onrunning direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "On Running Cloud 5 All White",
    "seoDescription": "Swiss precision meets everyday comfort. On Cloud 5 with CloudTec sole technology. Engineered mesh upper. Zero-gravity foam cushioning. Helion superfoam. Sp"
  },
  {
    "id": "src-024",
    "title": "Hoka Clifton 9 Black",
    "slug": "hoka-clifton-9-black-24",
    "description": "Maximum cushioning for everyday miles. Hoka Clifton 9 with Meta-Rocker geometry. Early-stage Meta-Rocker for smooth transitions. Full-EVA midsole. Jacquard knit upper. Flat-waisted Hoka geometry for added stability. Runner's favourite for long-distance comfort.",
    "images": [
      "https://images.unsplash.com/photo-1584735175315-9d5df23be2c2?w=600"
    ],
    "category": "sports",
    "supplierName": "Hoka Supply Hub",
    "supplierUrl": "https://supplier.example.com/hsh-clft9-blk",
    "supplierCost": 54,
    "price": 77.6,
    "compareAtPrice": 91.57,
    "sku": "HSH-CLFT9-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "hoka supply hub"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Hoka Clifton 9 Black",
    "seoDescription": "Maximum cushioning for everyday miles. Hoka Clifton 9 with Meta-Rocker geometry. Early-stage Meta-Rocker for smooth transitions. Full-EVA midsole. Jacquard"
  },
  {
    "id": "src-025",
    "title": "Nike Pegasus 41 University Blue",
    "slug": "nike-pegasus-41-university-blue-25",
    "description": "Nike's most popular running shoe. Pegasus 41 with dual stacked Zoom Air units. ReactX foam midsole. Engineered mesh upper. Hyper-reactive midsole foam. Full-length Zoom Air. Available in university blue — ready for the road.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "sports",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-peg41-ubl",
    "supplierCost": 48,
    "price": 69.2,
    "compareAtPrice": 81.66,
    "sku": "KS-PEG41-UBL",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Pegasus 41 University Blue",
    "seoDescription": "Nike's most popular running shoe. Pegasus 41 with dual stacked Zoom Air units. ReactX foam midsole. Engineered mesh upper. Hyper-reactive midsole foam. Ful"
  },
  {
    "id": "src-026",
    "title": "Adidas Originals NMD R1 Core Black",
    "slug": "adidas-originals-nmd-r1-core-black-26",
    "description": "Street-ready lifestyle runner with Boost technology. NMD R1 in core black. BOOST midsole for ultimate energy return. Primeknit upper. EVA plugs inspired by archival Adidas runners. Sock-like fit. A modern Adidas staple.",
    "images": [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600"
    ],
    "category": "fashion",
    "supplierName": "Adidas Wholesale",
    "supplierUrl": "https://supplier.example.com/aw-nmdr1-cbk",
    "supplierCost": 39,
    "price": 57.8,
    "compareAtPrice": 68.2,
    "sku": "AW-NMDR1-CBK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "adidas wholesale"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Adidas Originals NMD R1 Core Black",
    "seoDescription": "Street-ready lifestyle runner with Boost technology. NMD R1 in core black. BOOST midsole for ultimate energy return. Primeknit upper. EVA plugs inspired by"
  },
  {
    "id": "src-027",
    "title": "Nike Air Jordan 3 Retro White Cement",
    "slug": "nike-air-jordan-3-retro-white-cement-27",
    "description": "The shoe that saved Michael Jordan's career. AJ3 White Cement with visible Air unit. Genuine leather upper. Elephant print overlays. Cement print Jumpman logo on tongue. Tumbled leather upper. A landmark in sneaker history.",
    "images": [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-aj3-wce",
    "supplierCost": 65,
    "price": 92,
    "compareAtPrice": 108.56,
    "sku": "KS-AJ3-WCE",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Air Jordan 3 Retro White Cement",
    "seoDescription": "The shoe that saved Michael Jordan's career. AJ3 White Cement with visible Air unit. Genuine leather upper. Elephant print overlays. Cement print Jumpman l"
  },
  {
    "id": "src-028",
    "title": "New Balance 327 White Sea Salt",
    "slug": "new-balance-327-white-sea-salt-28",
    "description": "Retro-inspired lifestyle runner with modern details. 327 in white and sea salt. N-ergy midsole cushioning. Soft textile lining. Split outsole for flexibility. Retro arrow branding. A collaboration of archive design and modern craftsmanship.",
    "images": [
      "https://images.unsplash.com/photo-1584735175315-9d5df23be2c2?w=600"
    ],
    "category": "fashion",
    "supplierName": "NB Wholesale Hub",
    "supplierUrl": "https://supplier.example.com/nb-327-wss",
    "supplierCost": 28,
    "price": 44,
    "compareAtPrice": 51.92,
    "sku": "NB-327-WSS",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "nb wholesale hub"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "New Balance 327 White Sea Salt",
    "seoDescription": "Retro-inspired lifestyle runner with modern details. 327 in white and sea salt. N-ergy midsole cushioning. Soft textile lining. Split outsole for flexibili"
  },
  {
    "id": "src-029",
    "title": "Saucony Jazz Original Vintage Navy",
    "slug": "saucony-jazz-original-vintage-navy-29",
    "description": "Boston-born running heritage. Saucony Jazz Original Vintage in navy. Pigskin and nylon upper. XT-900 carbon rubber outsole. Shock-absorbing EVA midsole. Durable construction. Tri-density EVA midsole. A classic that's been in production since 1981.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "Saucony Wholesale",
    "supplierUrl": "https://supplier.example.com/sw-jzzo-nvy",
    "supplierCost": 21,
    "price": 35,
    "compareAtPrice": 41.3,
    "sku": "SW-JZZO-NVY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "saucony wholesale"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Saucony Jazz Original Vintage Navy",
    "seoDescription": "Boston-born running heritage. Saucony Jazz Original Vintage in navy. Pigskin and nylon upper. XT-900 carbon rubber outsole. Shock-absorbing EVA midsole. Du"
  },
  {
    "id": "src-030",
    "title": "Brooks Ghost 16 Run Happy Blue",
    "slug": "brooks-ghost-16-run-happy-blue-30",
    "description": "Every-runner's dream shoe. Brooks Ghost 16 with DNA LOFT v3 cushioning. GuideRails holistic support system. 3D Fit Print upper. BioMoGo DNA midsole. Segmented Crash Pad outsole. Run Happy in blue — built for the long haul.",
    "images": [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600"
    ],
    "category": "sports",
    "supplierName": "Brooks Supply Direct",
    "supplierUrl": "https://supplier.example.com/bsd-ghst16-blu",
    "supplierCost": 52,
    "price": 74.6,
    "compareAtPrice": 88.03,
    "sku": "BSD-GHST16-BLU",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "brooks supply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Brooks Ghost 16 Run Happy Blue",
    "seoDescription": "Every-runner's dream shoe. Brooks Ghost 16 with DNA LOFT v3 cushioning. GuideRails holistic support system. 3D Fit Print upper. BioMoGo DNA midsole. Segmen"
  },
  {
    "id": "src-031",
    "title": "Merrell Moab 3 Mid GTX",
    "slug": "merrell-moab-3-mid-gtx-31",
    "description": "All-terrain hiking boot for serious adventurers. Moab 3 Mid GTX with GORE-TEX waterproofing. Vibram TC5+ outsole. Air cushion heel. M Select GRIP outsole. Kinetic Fit Advanced insole. Bellows tongue. Built for day hikes to multi-day treks.",
    "images": [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600"
    ],
    "category": "sports",
    "supplierName": "Merrell Trail Supply",
    "supplierUrl": "https://supplier.example.com/mts-mb3m-gtx",
    "supplierCost": 44,
    "price": 66.8,
    "compareAtPrice": 78.82,
    "sku": "MTS-MB3M-GTX",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "merrell trail supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Merrell Moab 3 Mid GTX",
    "seoDescription": "All-terrain hiking boot for serious adventurers. Moab 3 Mid GTX with GORE-TEX waterproofing. Vibram TC5+ outsole. Air cushion heel. M Select GRIP outsole. "
  },
  {
    "id": "src-032",
    "title": "Nike Tech Fleece Joggers Heather Grey",
    "slug": "nike-tech-fleece-joggers-heather-grey-32",
    "description": "Modern tech fleece jogger pants. Engineered with Nike Tech Fleece — a unique spacer fabric that's warmer and lighter than standard cotton fleece. Tapered leg with ribbed cuffs. Elastic waistband with internal drawcord. Side pockets and zip back pocket.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-ntfj-hgy",
    "supplierCost": 34,
    "price": 52.4,
    "compareAtPrice": 61.83,
    "sku": "KS-NTFJ-HGY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Tech Fleece Joggers Heather Grey",
    "seoDescription": "Modern tech fleece jogger pants. Engineered with Nike Tech Fleece — a unique spacer fabric that's warmer and lighter than standard cotton fleece. Tapered l"
  },
  {
    "id": "src-033",
    "title": "Adidas Adicolor Classics Firebird Tracksuit Black",
    "slug": "adidas-adicolor-classics-firebird-tracksuit-black-33",
    "description": "The Adidas Firebird tracksuit iconic since the 70s. Recycled polyester fabric. 3-Stripes branding down the arms and legs. Full-zip jacket with stand-up collar. Ribbed cuffs and waistband. Set sold as jacket + pants. Classic trefoil logo embroidery.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "Adidas Wholesale",
    "supplierUrl": "https://supplier.example.com/aw-fbird-blk",
    "supplierCost": 42,
    "price": 65,
    "compareAtPrice": 76.7,
    "sku": "AW-FBIRD-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "adidas wholesale"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Adidas Adicolor Classics Firebird Tracksuit Black",
    "seoDescription": "The Adidas Firebird tracksuit iconic since the 70s. Recycled polyester fabric. 3-Stripes branding down the arms and legs. Full-zip jacket with stand-up col"
  },
  {
    "id": "src-034",
    "title": "Nike Sportswear Club Fleece Tracksuit Navy",
    "slug": "nike-sportswear-club-fleece-tracksuit-navy-34",
    "description": "Comfortable and classic Nike Club Fleece tracksuit set. Brushed inside for warmth. Standard-fit hoodie with full-zip and adjustable hood. Pants with side pockets and zip back pocket. Navy colorway with embroidered Swoosh. Sold as matching set.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-cflts-nvy",
    "supplierCost": 38,
    "price": 59,
    "compareAtPrice": 69.62,
    "sku": "KS-CFLTS-NVY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Sportswear Club Fleece Tracksuit Navy",
    "seoDescription": "Comfortable and classic Nike Club Fleece tracksuit set. Brushed inside for warmth. Standard-fit hoodie with full-zip and adjustable hood. Pants with side p"
  },
  {
    "id": "src-035",
    "title": "Puma King Track Jacket Black Gold",
    "slug": "puma-king-track-jacket-black-gold-35",
    "description": "Heritage track jacket inspired by King football roots. Lightweight woven fabric. Full-zip with stand-up collar. Puma Cat logo at chest. Embroidered branding details. Slim fit silhouette. Black with gold trim detailing. A European football classic reborn for streetwear.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "Puma Direct Supply",
    "supplierUrl": "https://supplier.example.com/pd-kingj-bgd",
    "supplierCost": 29,
    "price": 45.8,
    "compareAtPrice": 54.04,
    "sku": "PD-KINGJ-BGD",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "puma direct supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Puma King Track Jacket Black Gold",
    "seoDescription": "Heritage track jacket inspired by King football roots. Lightweight woven fabric. Full-zip with stand-up collar. Puma Cat logo at chest. Embroidered brandin"
  },
  {
    "id": "src-036",
    "title": "Champion Reverse Weave Hoodie Oxford Grey",
    "slug": "champion-reverse-weave-hoodie-oxford-grey-36",
    "description": "The reverse weave construction reduces vertical shrinkage. Champion Reverse Weave Hoodie in oxford grey. Three-panel hood with drawcord. Pouch pocket. Ribbed cuffs and hem. Left chest C logo. A heritage piece since 1934. Built for athletes demanding longevity.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "Champion Supply Hub",
    "supplierUrl": "https://supplier.example.com/csh-rwho-oxg",
    "supplierCost": 22,
    "price": 38,
    "compareAtPrice": 44.84,
    "sku": "CSH-RWHO-OXG",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "champion supply hub"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Champion Reverse Weave Hoodie Oxford Grey",
    "seoDescription": "The reverse weave construction reduces vertical shrinkage. Champion Reverse Weave Hoodie in oxford grey. Three-panel hood with drawcord. Pouch pocket. Ribb"
  },
  {
    "id": "src-037",
    "title": "Nike Dri-FIT Academy Tracksuit Blue",
    "slug": "nike-dri-fit-academy-tracksuit-blue-37",
    "description": "Performance tracksuit for training. Dri-FIT technology wicks sweat away from the body. Slim fit jacket and pants. Stretch fabric for full range of motion. Small Swoosh design at chest. Side pockets. Available in team royal blue. Worn by pros around the world.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "sports",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-dfats-blu",
    "supplierCost": 28,
    "price": 45.2,
    "compareAtPrice": 53.34,
    "sku": "KS-DFATS-BLU",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Dri-FIT Academy Tracksuit Blue",
    "seoDescription": "Performance tracksuit for training. Dri-FIT technology wicks sweat away from the body. Slim fit jacket and pants. Stretch fabric for full range of motion. "
  },
  {
    "id": "src-038",
    "title": "Adidas Tiro 23 Training Tracksuit Black White",
    "slug": "adidas-tiro-23-training-tracksuit-black-white-38",
    "description": "The world's most popular training tracksuit. Tiro 23 with moisture-absorbing AEROREADY fabric. Zip fly with button. Elastic waistband with drawcord. Two side pockets. Straight-fit pants. 3-Stripes branding down the legs. Perfect for training or casual wear.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "sports",
    "supplierName": "Adidas Wholesale",
    "supplierUrl": "https://supplier.example.com/aw-tiro23-bwh",
    "supplierCost": 32,
    "price": 50.6,
    "compareAtPrice": 59.71,
    "sku": "AW-TIRO23-BWH",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "adidas wholesale"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Adidas Tiro 23 Training Tracksuit Black White",
    "seoDescription": "The world's most popular training tracksuit. Tiro 23 with moisture-absorbing AEROREADY fabric. Zip fly with button. Elastic waistband with drawcord. Two si"
  },
  {
    "id": "src-039",
    "title": "Under Armour Unstoppable Joggers Charcoal",
    "slug": "under-armour-unstoppable-joggers-charcoal-39",
    "description": "UA's most versatile training pant. Unstoppable joggers in charcoal. Woven stretch fabric for comfort and durability. UA Storm technology repels water without sacrificing breathability. Ribbed cuffs. Zippered side pockets. Drawcord waistband. Tapered fit.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "sports",
    "supplierName": "UA Direct Supply",
    "supplierUrl": "https://supplier.example.com/uads-unst-cha",
    "supplierCost": 36,
    "price": 54.8,
    "compareAtPrice": 64.66,
    "sku": "UADS-UNST-CHA",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "ua direct supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Under Armour Unstoppable Joggers Charcoal",
    "seoDescription": "UA's most versatile training pant. Unstoppable joggers in charcoal. Woven stretch fabric for comfort and durability. UA Storm technology repels water witho"
  },
  {
    "id": "src-040",
    "title": "Lululemon Surge Jogger Black",
    "slug": "lululemon-surge-jogger-black-40",
    "description": "Premium performance jogger from Lululemon. Surge Jogger in black with Swift fabric — light and breathable. Four-way stretch for unrestricted movement. Secure-zip pocket. Drawcord waistband. Anti-stink finish. Reflective details for low-light visibility. The athlete's daily jogger.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "sports",
    "supplierName": "LuluDirect Supply",
    "supplierUrl": "https://supplier.example.com/lds-surj-blk",
    "supplierCost": 48,
    "price": 68.6,
    "compareAtPrice": 80.95,
    "sku": "LDS-SURJ-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "luludirect supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Lululemon Surge Jogger Black",
    "seoDescription": "Premium performance jogger from Lululemon. Surge Jogger in black with Swift fabric — light and breathable. Four-way stretch for unrestricted movement. Secu"
  },
  {
    "id": "src-041",
    "title": "Gymshark Crest Tracksuit Ink Navy",
    "slug": "gymshark-crest-tracksuit-ink-navy-41",
    "description": "Gymshark's premium tracksuit set in ink navy. Crest collection designed for all-day versatility. Relaxed fit hoodie with kangaroo pocket. Matching jogger with side pockets. Soft French Terry fabric. Embroidered Gymshark logo at chest. The go-to matching set for gym and street.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "sports",
    "supplierName": "Gymshark Wholesale",
    "supplierUrl": "https://supplier.example.com/gw-crstts-ink",
    "supplierCost": 38,
    "price": 58.4,
    "compareAtPrice": 68.91,
    "sku": "GW-CRSTTS-INK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "gymshark wholesale"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Gymshark Crest Tracksuit Ink Navy",
    "seoDescription": "Gymshark's premium tracksuit set in ink navy. Crest collection designed for all-day versatility. Relaxed fit hoodie with kangaroo pocket. Matching jogger w"
  },
  {
    "id": "src-042",
    "title": "New Balance Athletics Woven Jacket Wind Blue",
    "slug": "new-balance-athletics-woven-jacket-wind-blue-42",
    "description": "Lightweight woven windbreaker from New Balance Athletics. Packable design for on-the-go use. Reflective NB logo. Stand-up collar. Full-zip with chin guard. Side pockets. Wind-resistant fabric. Wind blue colorway. Ideal for transitional weather and light workouts.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "sports",
    "supplierName": "NB Wholesale Hub",
    "supplierUrl": "https://supplier.example.com/nb-wovj-wbl",
    "supplierCost": 34,
    "price": 52.4,
    "compareAtPrice": 61.83,
    "sku": "NB-WOVJ-WBL",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "nb wholesale hub"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "New Balance Athletics Woven Jacket Wind Blue",
    "seoDescription": "Lightweight woven windbreaker from New Balance Athletics. Packable design for on-the-go use. Reflective NB logo. Stand-up collar. Full-zip with chin guard."
  },
  {
    "id": "src-043",
    "title": "Fila Settanta Vintage Track Jacket Red White Blue",
    "slug": "fila-settanta-vintage-track-jacket-red-white-blue-43",
    "description": "Retro Fila Settanta track jacket with vintage appeal. Iconic red white and blue tricolor design. Velour fabric. Embroidered Fila logo. Full-zip with fold-over collar. A favourite on the tennis courts in the 70s and back in full streetwear force.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "Fila Direct Supply",
    "supplierUrl": "https://supplier.example.com/fds-sett-rwb",
    "supplierCost": 36,
    "price": 55.4,
    "compareAtPrice": 65.37,
    "sku": "FDS-SETT-RWB",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "fila direct supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Fila Settanta Vintage Track Jacket Red White Blue",
    "seoDescription": "Retro Fila Settanta track jacket with vintage appeal. Iconic red white and blue tricolor design. Velour fabric. Embroidered Fila logo. Full-zip with fold-o"
  },
  {
    "id": "src-044",
    "title": "Kappa Banda Rastoria Tracksuit Black White",
    "slug": "kappa-banda-rastoria-tracksuit-black-white-44",
    "description": "The Italian sports brand known for its logo kiss design. Kappa Banda Rastoria tracksuit in black and white. Moisture-wicking fabric. Slim fit. Omini kiss logo on each thigh and arm. Full-zip jacket with stand-up collar. A vintage-inspired modern classic.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "Kappa Direct",
    "supplierUrl": "https://supplier.example.com/kd-brstr-bwh",
    "supplierCost": 31,
    "price": 48.8,
    "compareAtPrice": 57.58,
    "sku": "KD-BRSTR-BWH",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kappa direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Kappa Banda Rastoria Tracksuit Black White",
    "seoDescription": "The Italian sports brand known for its logo kiss design. Kappa Banda Rastoria tracksuit in black and white. Moisture-wicking fabric. Slim fit. Omini kiss l"
  },
  {
    "id": "src-045",
    "title": "Nike Therma-FIT Essential Tracksuit Smoke Grey",
    "slug": "nike-therma-fit-essential-tracksuit-smoke-grey-45",
    "description": "Winter-ready training tracksuit. Therma-FIT technology traps warm air next to your body. Pullover hoodie and tapered pants. Adjustable hood. Side pockets. Ribbed hem and cuffs. Smoke grey colorway with small Swoosh detail. Performance without compromising style.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "sports",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-tess-sgy",
    "supplierCost": 44,
    "price": 66.2,
    "compareAtPrice": 78.12,
    "sku": "KS-TESS-SGY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Therma-FIT Essential Tracksuit Smoke Grey",
    "seoDescription": "Winter-ready training tracksuit. Therma-FIT technology traps warm air next to your body. Pullover hoodie and tapered pants. Adjustable hood. Side pockets. "
  },
  {
    "id": "src-046",
    "title": "Stüssy Stock Logo Hoodie Ash Grey",
    "slug": "st-ssy-stock-logo-hoodie-ash-grey-46",
    "description": "Stussy Stock logo hoodie in ash grey. Heavyweight fleece construction. Kangaroo pocket. Adjustable drawcord hood. Ribbed cuffs and hem. Embroidered Stock logo at left chest. A streetwear staple since 1980. Relaxed fit for layering.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "StussyDirect",
    "supplierUrl": "https://supplier.example.com/sd-stklh-ash",
    "supplierCost": 34,
    "price": 53,
    "compareAtPrice": 62.54,
    "sku": "SD-STKLH-ASH",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "stussydirect"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Stüssy Stock Logo Hoodie Ash Grey",
    "seoDescription": "Stussy Stock logo hoodie in ash grey. Heavyweight fleece construction. Kangaroo pocket. Adjustable drawcord hood. Ribbed cuffs and hem. Embroidered Stock l"
  },
  {
    "id": "src-047",
    "title": "Supreme Box Logo Hoodie Black",
    "slug": "supreme-box-logo-hoodie-black-47",
    "description": "The most coveted hoodie in streetwear. Supreme Box Logo Hoodie in black. Premium heavyweight cotton blend. Front kangaroo pocket. Classic box logo screen print at chest. Ribbed hem and cuffs. Relaxed fit. Only available seasonally — this edition sells out immediately.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "StreetSupply Hub",
    "supplierUrl": "https://supplier.example.com/ssh-bxlh-blk",
    "supplierCost": 38,
    "price": 58.4,
    "compareAtPrice": 68.91,
    "sku": "SSH-BXLH-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "streetsupply hub"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Supreme Box Logo Hoodie Black",
    "seoDescription": "The most coveted hoodie in streetwear. Supreme Box Logo Hoodie in black. Premium heavyweight cotton blend. Front kangaroo pocket. Classic box logo screen p"
  },
  {
    "id": "src-048",
    "title": "Off-White Arrow Sweatpants Black",
    "slug": "off-white-arrow-sweatpants-black-48",
    "description": "Off-White signature sweatpants in black. Wavy diagonal arrow graphic down the leg. Elastic waistband with drawcord. Ribbed cuffs. Fleece-lined interior. Embroidered Industrial label detail on waistband. A luxury streetwear staple from Virgil Abloh's vision.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-owarr-blk",
    "supplierCost": 42,
    "price": 63.2,
    "compareAtPrice": 74.58,
    "sku": "LSS-OWARR-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Off-White Arrow Sweatpants Black",
    "seoDescription": "Off-White signature sweatpants in black. Wavy diagonal arrow graphic down the leg. Elastic waistband with drawcord. Ribbed cuffs. Fleece-lined interior. Em"
  },
  {
    "id": "src-049",
    "title": "Palm Angels Track Pants Classic White Black",
    "slug": "palm-angels-track-pants-classic-white-black-49",
    "description": "Italian luxury streetwear. Palm Angels Track Pants with bold logo racing stripes down each leg. Elasticated waistband. Slim tapered fit. Side pockets. Embroidered angel and palm logo. Premium stretch fabric. Worn by celebrities and athletes worldwide.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-palm-wbk",
    "supplierCost": 52,
    "price": 76.4,
    "compareAtPrice": 90.15,
    "sku": "LSS-PALM-WBK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Palm Angels Track Pants Classic White Black",
    "seoDescription": "Italian luxury streetwear. Palm Angels Track Pants with bold logo racing stripes down each leg. Elasticated waistband. Slim tapered fit. Side pockets. Embr"
  },
  {
    "id": "src-050",
    "title": "Sony WH-1000XM5 Wireless Headphones Black",
    "slug": "sony-wh-1000xm5-wireless-headphones-black-50",
    "description": "Industry-leading noise cancelling headphones. Sony WH-1000XM5 with 30 hours battery life. Multipoint connection for two devices simultaneously. Speak-to-Chat technology. Precise Voice Pickup for crystal-clear calls. 8 microphones. Foldable design for travel. USB-C charging.",
    "images": [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"
    ],
    "category": "electronics",
    "supplierName": "TechGear Direct",
    "supplierUrl": "https://supplier.example.com/tgd-wh1k5-blk",
    "supplierCost": 89,
    "price": 122,
    "compareAtPrice": 143.96,
    "sku": "TGD-WH1K5-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "techgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Sony WH-1000XM5 Wireless Headphones Black",
    "seoDescription": "Industry-leading noise cancelling headphones. Sony WH-1000XM5 with 30 hours battery life. Multipoint connection for two devices simultaneously. Speak-to-Ch"
  },
  {
    "id": "src-051",
    "title": "Apple AirPods Pro Gen 2 USB-C",
    "slug": "apple-airpods-pro-gen-2-usb-c-51",
    "description": "Apple's most advanced AirPods. AirPods Pro Gen 2 with Active Noise Cancellation up to 2x more powerful. Adaptive Audio. Personalized Spatial Audio. Conversation Awareness. IP54 dust and water resistant. USB-C charging case with Built-in Speaker.",
    "images": [
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600"
    ],
    "category": "electronics",
    "supplierName": "AppleDirect Supply",
    "supplierUrl": "https://supplier.example.com/ads-app2-usc",
    "supplierCost": 95,
    "price": 125,
    "compareAtPrice": 147.5,
    "sku": "ADS-APP2-USC",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "appledirect supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Apple AirPods Pro Gen 2 USB-C",
    "seoDescription": "Apple's most advanced AirPods. AirPods Pro Gen 2 with Active Noise Cancellation up to 2x more powerful. Adaptive Audio. Personalized Spatial Audio. Convers"
  },
  {
    "id": "src-052",
    "title": "Samsung Galaxy S25 Ultra Titanium Black",
    "slug": "samsung-galaxy-s25-ultra-titanium-black-52",
    "description": "Samsung's flagship ultra phone. Galaxy S25 Ultra with built-in S Pen. 200MP pro camera system with AI enhancements. Snapdragon 8 Elite processor. 5000mAh battery. 45W Super Fast Charging. 6.9-inch Dynamic AMOLED 2X display. Titanium frame.",
    "images": [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600"
    ],
    "category": "electronics",
    "supplierName": "TechGear Direct",
    "supplierUrl": "https://supplier.example.com/tgd-gxs25-tbk",
    "supplierCost": 148,
    "price": 193.4,
    "compareAtPrice": 228.21,
    "sku": "TGD-GXS25-TBK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "techgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Samsung Galaxy S25 Ultra Titanium Black",
    "seoDescription": "Samsung's flagship ultra phone. Galaxy S25 Ultra with built-in S Pen. 200MP pro camera system with AI enhancements. Snapdragon 8 Elite processor. 5000mAh b"
  },
  {
    "id": "src-053",
    "title": "Anker PowerCore 26800 Portable Charger",
    "slug": "anker-powercore-26800-portable-charger-53",
    "description": "High-capacity portable charger for all your devices. Anker PowerCore 26800 with 26800mAh. Dual USB-A and USB-C outputs. Charges iPhone 15 Pro Max 5.5 times. PowerIQ and VoltageBoost technologies. Trickle-charging mode for small devices.",
    "images": [
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600"
    ],
    "category": "electronics",
    "supplierName": "AnkerDirect Supply",
    "supplierUrl": "https://supplier.example.com/ads-pc268-blk",
    "supplierCost": 24,
    "price": 39.2,
    "compareAtPrice": 46.26,
    "sku": "ADS-PC268-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "ankerdirect supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Anker PowerCore 26800 Portable Charger",
    "seoDescription": "High-capacity portable charger for all your devices. Anker PowerCore 26800 with 26800mAh. Dual USB-A and USB-C outputs. Charges iPhone 15 Pro Max 5.5 times"
  },
  {
    "id": "src-054",
    "title": "iPad Pro 13-inch M4 WiFi Space Black",
    "slug": "ipad-pro-13-inch-m4-wifi-space-black-54",
    "description": "Most powerful iPad ever. iPad Pro 13-inch with M4 chip. Ultra Retina XDR display with nano-texture glass. Apple Pencil Pro support. Magic Keyboard compatible. Outperforms most laptops. ProRes video recording. Thin at just 5.1mm — thinnest Apple product ever.",
    "images": [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600"
    ],
    "category": "electronics",
    "supplierName": "AppleDirect Supply",
    "supplierUrl": "https://supplier.example.com/ads-ipad13-sbk",
    "supplierCost": 138,
    "price": 180.2,
    "compareAtPrice": 212.64,
    "sku": "ADS-IPAD13-SBK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "appledirect supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "iPad Pro 13-inch M4 WiFi Space Black",
    "seoDescription": "Most powerful iPad ever. iPad Pro 13-inch with M4 chip. Ultra Retina XDR display with nano-texture glass. Apple Pencil Pro support. Magic Keyboard compatib"
  },
  {
    "id": "src-055",
    "title": "Bose QuietComfort 45 Headphones White Smoke",
    "slug": "bose-quietcomfort-45-headphones-white-smoke-55",
    "description": "Bose legendary noise cancellation. QuietComfort 45 with Quiet and Aware modes. 24-hour battery life. Clear calls even in noisy environments. Balanced audio performance. Lightweight folding design. USB-C and 2.5mm audio jack. White Smoke colorway.",
    "images": [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"
    ],
    "category": "electronics",
    "supplierName": "TechGear Direct",
    "supplierUrl": "https://supplier.example.com/tgd-bqc45-wsm",
    "supplierCost": 74,
    "price": 102.2,
    "compareAtPrice": 120.6,
    "sku": "TGD-BQC45-WSM",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "techgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Bose QuietComfort 45 Headphones White Smoke",
    "seoDescription": "Bose legendary noise cancellation. QuietComfort 45 with Quiet and Aware modes. 24-hour battery life. Clear calls even in noisy environments. Balanced audio"
  },
  {
    "id": "src-056",
    "title": "GoPro Hero 13 Black Action Camera",
    "slug": "gopro-hero-13-black-action-camera-56",
    "description": "The most versatile action camera. GoPro Hero 13 Black with 5.3K60 video. HyperSmooth 6.0 stabilization. 27MP photo. 30m waterproofing without a case. Enduro battery for 38% more performance in cold. Magnetic Swivel Clip included. The definitive adventure camera.",
    "images": [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600"
    ],
    "category": "electronics",
    "supplierName": "TechGear Direct",
    "supplierUrl": "https://supplier.example.com/tgd-hero13-blk",
    "supplierCost": 78,
    "price": 107.6,
    "compareAtPrice": 126.97,
    "sku": "TGD-HERO13-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "techgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "GoPro Hero 13 Black Action Camera",
    "seoDescription": "The most versatile action camera. GoPro Hero 13 Black with 5.3K60 video. HyperSmooth 6.0 stabilization. 27MP photo. 30m waterproofing without a case. Endur"
  },
  {
    "id": "src-057",
    "title": "Kindle Paperwhite Signature Edition",
    "slug": "kindle-paperwhite-signature-edition-57",
    "description": "The best Kindle ever. Kindle Paperwhite Signature Edition with 32GB storage. Auto-adjusting front light. Wireless charging. 6.8-inch 300ppi display. 12 weeks of battery. Adjustable warm light. IPX8 waterproof. Glare-free display. Reads like real paper in bright sunlight.",
    "images": [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600"
    ],
    "category": "electronics",
    "supplierName": "TechGear Direct",
    "supplierUrl": "https://supplier.example.com/tgd-kwpe-sig",
    "supplierCost": 38,
    "price": 56.6,
    "compareAtPrice": 66.79,
    "sku": "TGD-KWPE-SIG",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "techgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Kindle Paperwhite Signature Edition",
    "seoDescription": "The best Kindle ever. Kindle Paperwhite Signature Edition with 32GB storage. Auto-adjusting front light. Wireless charging. 6.8-inch 300ppi display. 12 wee"
  },
  {
    "id": "src-058",
    "title": "JBL Charge 5 Portable Speaker Blue",
    "slug": "jbl-charge-5-portable-speaker-blue-58",
    "description": "Powerful portable Bluetooth speaker with IP67 waterproof rating. JBL Charge 5 with 20 hours playtime. JBL Pro Sound. Powerful bass from passive radiators. PartyBoost for speaker pairing. USB-C charging. Power bank feature to charge your devices.",
    "images": [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600"
    ],
    "category": "electronics",
    "supplierName": "TechGear Direct",
    "supplierUrl": "https://supplier.example.com/tgd-jblc5-blu",
    "supplierCost": 52,
    "price": 74.6,
    "compareAtPrice": 88.03,
    "sku": "TGD-JBLC5-BLU",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "techgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "JBL Charge 5 Portable Speaker Blue",
    "seoDescription": "Powerful portable Bluetooth speaker with IP67 waterproof rating. JBL Charge 5 with 20 hours playtime. JBL Pro Sound. Powerful bass from passive radiators. "
  },
  {
    "id": "src-059",
    "title": "Logitech MX Master 3S Wireless Mouse",
    "slug": "logitech-mx-master-3s-wireless-mouse-59",
    "description": "The master of mice. MX Master 3S with 8K DPI Darkfield sensor. MagSpeed Electromagnetic scrolling. Quiet Click. 3 device multi-pairing. USB-C charging. Ergonomic design reduces muscle strain. App-specific customisations. For power users and creatives.",
    "images": [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600"
    ],
    "category": "electronics",
    "supplierName": "TechGear Direct",
    "supplierUrl": "https://supplier.example.com/tgd-mxms3-gry",
    "supplierCost": 42,
    "price": 61.4,
    "compareAtPrice": 72.45,
    "sku": "TGD-MXMS3-GRY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "techgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Logitech MX Master 3S Wireless Mouse",
    "seoDescription": "The master of mice. MX Master 3S with 8K DPI Darkfield sensor. MagSpeed Electromagnetic scrolling. Quiet Click. 3 device multi-pairing. USB-C charging. Erg"
  },
  {
    "id": "src-060",
    "title": "Apple Watch Series 9 GPS 45mm Midnight",
    "slug": "apple-watch-series-9-gps-45mm-midnight-60",
    "description": "The most powerful Apple Watch yet. Series 9 with the S9 chip and Double Tap gesture. Always-On Retina display. Blood Oxygen app. Advanced heart rate monitoring. Crash Detection. ECG app. 18-hour battery. Carbon neutral option.",
    "images": [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
    ],
    "category": "electronics",
    "supplierName": "AppleDirect Supply",
    "supplierUrl": "https://supplier.example.com/ads-aws9-mid",
    "supplierCost": 98,
    "price": 129.8,
    "compareAtPrice": 153.16,
    "sku": "ADS-AWS9-MID",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "appledirect supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Apple Watch Series 9 GPS 45mm Midnight",
    "seoDescription": "The most powerful Apple Watch yet. Series 9 with the S9 chip and Double Tap gesture. Always-On Retina display. Blood Oxygen app. Advanced heart rate monito"
  },
  {
    "id": "src-061",
    "title": "Samsung 49-inch Odyssey OLED Curved Monitor",
    "slug": "samsung-49-inch-odyssey-oled-curved-monitor-61",
    "description": "Curved ultrawide gaming monitor. Odyssey OLED G9 with 0.03ms response time. 240Hz refresh rate. VESA DisplayHDR True Black 400. Matte Anti-glare display. AMD FreeSync Premium Pro. NVIDIA G-Sync compatible. USB-C, DisplayPort, HDMI inputs.",
    "images": [
      "https://images.unsplash.com/photo-1527443224154-c4a573d5f5ef?w=600"
    ],
    "category": "electronics",
    "supplierName": "TechGear Direct",
    "supplierUrl": "https://supplier.example.com/tgd-odsg9-49",
    "supplierCost": 128,
    "price": 180.2,
    "compareAtPrice": 212.64,
    "sku": "TGD-ODSG9-49",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "techgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Samsung 49-inch Odyssey OLED Curved Monitor",
    "seoDescription": "Curved ultrawide gaming monitor. Odyssey OLED G9 with 0.03ms response time. 240Hz refresh rate. VESA DisplayHDR True Black 400. Matte Anti-glare display. A"
  },
  {
    "id": "src-062",
    "title": "Dyson V15 Detect Absolute Vacuum",
    "slug": "dyson-v15-detect-absolute-vacuum-62",
    "description": "Laser reveals invisible dust. Dyson V15 Detect with piezo sensor counts and sizes microscopic particles. 60-minute battery. HEPA filtration captures allergens. High Torque XL cleaner head automatically adapts to different floor types. 11 accessories included.",
    "images": [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"
    ],
    "category": "home-garden",
    "supplierName": "HomeVibe Supply",
    "supplierUrl": "https://supplier.example.com/hv-dyv15-abs",
    "supplierCost": 118,
    "price": 161,
    "compareAtPrice": 189.98,
    "sku": "HV-DYV15-ABS",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "home & garden",
      "homevibe supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Dyson V15 Detect Absolute Vacuum",
    "seoDescription": "Laser reveals invisible dust. Dyson V15 Detect with piezo sensor counts and sizes microscopic particles. 60-minute battery. HEPA filtration captures allerg"
  },
  {
    "id": "src-063",
    "title": "Nespresso Vertuo Next Capsule Machine",
    "slug": "nespresso-vertuo-next-capsule-machine-63",
    "description": "New generation of Nespresso with Centrifusion technology. Vertuo Next reads the barcode on each capsule for perfect extraction. 5 cup sizes from Espresso to Alto. WiFi connectivity. 40-second heat-up time. Recyclable aluminium capsules.",
    "images": [
      "https://images.unsplash.com/photo-1521302200778-33500d0f5587?w=600"
    ],
    "category": "home-garden",
    "supplierName": "HomeVibe Supply",
    "supplierUrl": "https://supplier.example.com/hv-nesv-nxt",
    "supplierCost": 58,
    "price": 84.8,
    "compareAtPrice": 100.06,
    "sku": "HV-NESV-NXT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "home & garden",
      "homevibe supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nespresso Vertuo Next Capsule Machine",
    "seoDescription": "New generation of Nespresso with Centrifusion technology. Vertuo Next reads the barcode on each capsule for perfect extraction. 5 cup sizes from Espresso t"
  },
  {
    "id": "src-064",
    "title": "Ninja Foodi 6-in-1 Air Fryer",
    "slug": "ninja-foodi-6-in-1-air-fryer-64",
    "description": "6 appliances in one compact unit. Ninja Foodi with Air Fry, Air Roast, Bake, Reheat, Dehydrate and Whole Roast. 5.6-litre capacity. Up to 75% less fat than deep frying. Ceramic non-stick basket. Dishwasher-safe parts. Heats up in 3 minutes.",
    "images": [
      "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600"
    ],
    "category": "home-garden",
    "supplierName": "HomeVibe Supply",
    "supplierUrl": "https://supplier.example.com/hv-ninj-6n1",
    "supplierCost": 64,
    "price": 93.8,
    "compareAtPrice": 110.68,
    "sku": "HV-NINJ-6N1",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "home & garden",
      "homevibe supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Ninja Foodi 6-in-1 Air Fryer",
    "seoDescription": "6 appliances in one compact unit. Ninja Foodi with Air Fry, Air Roast, Bake, Reheat, Dehydrate and Whole Roast. 5.6-litre capacity. Up to 75% less fat than"
  },
  {
    "id": "src-065",
    "title": "Vitamix 5200 Professional Blender",
    "slug": "vitamix-5200-professional-blender-65",
    "description": "Professional-grade blender for home use. Vitamix 5200 with variable speed control. 64-oz container. Self-cleaning in 30-60 seconds. 10-year full warranty. Hardened stainless steel blades create friction heat to blend ingredients. Hot soups to frozen desserts.",
    "images": [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600"
    ],
    "category": "home-garden",
    "supplierName": "HomeVibe Supply",
    "supplierUrl": "https://supplier.example.com/hv-vtm52-blk",
    "supplierCost": 82,
    "price": 120.2,
    "compareAtPrice": 141.84,
    "sku": "HV-VTM52-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "home & garden",
      "homevibe supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Vitamix 5200 Professional Blender",
    "seoDescription": "Professional-grade blender for home use. Vitamix 5200 with variable speed control. 64-oz container. Self-cleaning in 30-60 seconds. 10-year full warranty. "
  },
  {
    "id": "src-066",
    "title": "Instant Pot Duo 7-in-1 Electric Pressure Cooker",
    "slug": "instant-pot-duo-7-in-1-electric-pressure-cooker-66",
    "description": "The world's best-selling multi-cooker. Instant Pot Duo 7-in-1 with Pressure Cook, Slow Cook, Sauté, Steam, Warm, and more. 6-quart capacity. 10+ safety features. Stainless steel inner pot. Delay start up to 24 hours. Dishwasher-safe lid.",
    "images": [
      "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600"
    ],
    "category": "home-garden",
    "supplierName": "HomeVibe Supply",
    "supplierUrl": "https://supplier.example.com/hv-instpd-7n1",
    "supplierCost": 48,
    "price": 73.4,
    "compareAtPrice": 86.61,
    "sku": "HV-INSTPD-7N1",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "home & garden",
      "homevibe supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Instant Pot Duo 7-in-1 Electric Pressure Cooker",
    "seoDescription": "The world's best-selling multi-cooker. Instant Pot Duo 7-in-1 with Pressure Cook, Slow Cook, Sauté, Steam, Warm, and more. 6-quart capacity. 10+ safety fea"
  },
  {
    "id": "src-067",
    "title": "Philips Hue Starter Kit White and Color Ambiance",
    "slug": "philips-hue-starter-kit-white-and-color-ambiance-67",
    "description": "Smart lighting that transforms any room. Philips Hue Starter Kit with 3 A19 color bulbs and Hue Bridge. 16 million colors. Control via app, voice, or switch. Works with Alexa, Google Home, Apple HomeKit. Set scenes, routines, timers. Entertainment sync for gaming and movies.",
    "images": [
      "https://images.unsplash.com/photo-1558002038-1ad4a06e90e5?w=600"
    ],
    "category": "home-garden",
    "supplierName": "HomeVibe Supply",
    "supplierUrl": "https://supplier.example.com/hv-phhs-wca",
    "supplierCost": 54,
    "price": 77,
    "compareAtPrice": 90.86,
    "sku": "HV-PHHS-WCA",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "home & garden",
      "homevibe supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Philips Hue Starter Kit White and Color Ambiance",
    "seoDescription": "Smart lighting that transforms any room. Philips Hue Starter Kit with 3 A19 color bulbs and Hue Bridge. 16 million colors. Control via app, voice, or switc"
  },
  {
    "id": "src-068",
    "title": "Casper Original Foam Mattress Queen",
    "slug": "casper-original-foam-mattress-queen-68",
    "description": "America's most popular foam mattress. Casper Original Queen with three foam layers. Breathable open-cell foam. Adaptive supportive foam. Durable base foam. 100-night free trial. 10-year warranty. CertiPUR-US certified. Ships compressed in a box.",
    "images": [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"
    ],
    "category": "home-garden",
    "supplierName": "HomeVibe Supply",
    "supplierUrl": "https://supplier.example.com/hv-casp-qfm",
    "supplierCost": 120,
    "price": 179,
    "compareAtPrice": 211.22,
    "sku": "HV-CASP-QFM",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "home & garden",
      "homevibe supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Casper Original Foam Mattress Queen",
    "seoDescription": "America's most popular foam mattress. Casper Original Queen with three foam layers. Breathable open-cell foam. Adaptive supportive foam. Durable base foam."
  },
  {
    "id": "src-069",
    "title": "YETI Rambler 30 oz Tumbler Navy",
    "slug": "yeti-rambler-30-oz-tumbler-navy-69",
    "description": "Double-wall vacuum insulation keeps drinks cold 24 hours and hot 6 hours. YETI Rambler 30 oz with MagSlider Lid. BPA-free 18/8 stainless steel. DuraCoat color that won't peel or fade. Dishwasher safe. Fits most car cup holders. Navy blue.",
    "images": [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600"
    ],
    "category": "home-garden",
    "supplierName": "HomeVibe Supply",
    "supplierUrl": "https://supplier.example.com/hv-yeti30-nvy",
    "supplierCost": 24,
    "price": 39.8,
    "compareAtPrice": 46.96,
    "sku": "HV-YETI30-NVY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "home & garden",
      "homevibe supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "YETI Rambler 30 oz Tumbler Navy",
    "seoDescription": "Double-wall vacuum insulation keeps drinks cold 24 hours and hot 6 hours. YETI Rambler 30 oz with MagSlider Lid. BPA-free 18/8 stainless steel. DuraCoat co"
  },
  {
    "id": "src-070",
    "title": "Le Creuset Signature Round Dutch Oven 5.5qt Marseille Blue",
    "slug": "le-creuset-signature-round-dutch-oven-5-5qt-marseille-blue-70",
    "description": "The finest French cookware. Le Creuset 5.5qt Dutch Oven in Marseille Blue. Enameled cast iron. Superior heat distribution. Compatible with all cooktops including induction. Oven-safe to 500°F. Chip-resistant enamel. Lifetime guarantee. A kitchen heirloom.",
    "images": [
      "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600"
    ],
    "category": "home-garden",
    "supplierName": "HomeVibe Supply",
    "supplierUrl": "https://supplier.example.com/hv-lecs-5qt",
    "supplierCost": 94,
    "price": 135.8,
    "compareAtPrice": 160.24,
    "sku": "HV-LECS-5QT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "home & garden",
      "homevibe supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Le Creuset Signature Round Dutch Oven 5.5qt Marseille Blue",
    "seoDescription": "The finest French cookware. Le Creuset 5.5qt Dutch Oven in Marseille Blue. Enameled cast iron. Superior heat distribution. Compatible with all cooktops inc"
  },
  {
    "id": "src-071",
    "title": "Roomba i7+ Self-Empty Robot Vacuum",
    "slug": "roomba-i7-self-empty-robot-vacuum-71",
    "description": "Robot vacuum that empties itself. Roomba i7+ with Clean Base Automatic Dirt Disposal. Learns your home. Smart Mapping navigates room by room. 10x suction with Power Boost. Works with Alexa and Google Assistant. Cliff Detect sensors. Dual rubber brushes.",
    "images": [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600"
    ],
    "category": "home-garden",
    "supplierName": "HomeVibe Supply",
    "supplierUrl": "https://supplier.example.com/hv-rmbai7-blk",
    "supplierCost": 128,
    "price": 175.4,
    "compareAtPrice": 206.97,
    "sku": "HV-RMBAI7-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "home & garden",
      "homevibe supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Roomba i7+ Self-Empty Robot Vacuum",
    "seoDescription": "Robot vacuum that empties itself. Roomba i7+ with Clean Base Automatic Dirt Disposal. Learns your home. Smart Mapping navigates room by room. 10x suction w"
  },
  {
    "id": "src-072",
    "title": "Theragun Prime Percussive Therapy Device",
    "slug": "theragun-prime-percussive-therapy-device-72",
    "description": "The professional-grade recovery tool. Theragun Prime with 5 built-in speeds and 16mm amplitude. QuietForce Technology. Smart app integration. 2-hour battery life. 3 attachments. Ergonomic triangle handle. Relieves muscle soreness and stiffness. Used by athletes worldwide.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "health",
    "supplierName": "Sports Recovery Direct",
    "supplierUrl": "https://supplier.example.com/srd-thgp-prm",
    "supplierCost": 64,
    "price": 91.4,
    "compareAtPrice": 107.85,
    "sku": "SRD-THGP-PRM",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "health",
      "sports recovery direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Theragun Prime Percussive Therapy Device",
    "seoDescription": "The professional-grade recovery tool. Theragun Prime with 5 built-in speeds and 16mm amplitude. QuietForce Technology. Smart app integration. 2-hour batter"
  },
  {
    "id": "src-073",
    "title": "Whoop 4.0 Health Monitor Strap Black",
    "slug": "whoop-4-0-health-monitor-strap-black-73",
    "description": "24/7 health monitoring for athletes. WHOOP 4.0 tracks strain, recovery, and sleep. Heart rate variability. Blood oxygen. Skin temperature. Respiratory rate. Waterproof to 10m. Haptic alarm. Any-wear technology — wear on wrist, bicep, or body. Subscription-based coaching.",
    "images": [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
    ],
    "category": "health",
    "supplierName": "Sports Recovery Direct",
    "supplierUrl": "https://supplier.example.com/srd-whop4-blk",
    "supplierCost": 44,
    "price": 63.8,
    "compareAtPrice": 75.28,
    "sku": "SRD-WHOP4-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "health",
      "sports recovery direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Whoop 4.0 Health Monitor Strap Black",
    "seoDescription": "24/7 health monitoring for athletes. WHOOP 4.0 tracks strain, recovery, and sleep. Heart rate variability. Blood oxygen. Skin temperature. Respiratory rate"
  },
  {
    "id": "src-074",
    "title": "Garmin Forerunner 965 Running Watch Black",
    "slug": "garmin-forerunner-965-running-watch-black-74",
    "description": "The ultimate running watch. Garmin Forerunner 965 with AMOLED touchscreen. Training Readiness feature. Running Dynamics. Predicted race times. Multi-band GPS. On-device training plans. 31-day battery in smartwatch mode. Music storage for 2000 songs.",
    "images": [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
    ],
    "category": "sports",
    "supplierName": "Sports Recovery Direct",
    "supplierUrl": "https://supplier.example.com/srd-grfr96-blk",
    "supplierCost": 94,
    "price": 126.8,
    "compareAtPrice": 149.62,
    "sku": "SRD-GRFR96-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "sports recovery direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Garmin Forerunner 965 Running Watch Black",
    "seoDescription": "The ultimate running watch. Garmin Forerunner 965 with AMOLED touchscreen. Training Readiness feature. Running Dynamics. Predicted race times. Multi-band G"
  },
  {
    "id": "src-075",
    "title": "Nike Training Pro 3.0 Shorts Volt",
    "slug": "nike-training-pro-3-0-shorts-volt-75",
    "description": "Lightweight training shorts for intense workouts. Nike Pro 3.0 with Dri-FIT technology. Compression fit. Elastic waistband with internal drawcord. Small logo hit at left thigh. Inseam gusset for range of motion. Flat seams for zero-chafing comfort. Volt colorway.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-nktp3-vlt",
    "supplierCost": 18,
    "price": 30.8,
    "compareAtPrice": 36.34,
    "sku": "KS-NKTP3-VLT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Training Pro 3.0 Shorts Volt",
    "seoDescription": "Lightweight training shorts for intense workouts. Nike Pro 3.0 with Dri-FIT technology. Compression fit. Elastic waistband with internal drawcord. Small lo"
  },
  {
    "id": "src-076",
    "title": "Adidas Designed 4 Training T-Shirt Grey",
    "slug": "adidas-designed-4-training-t-shirt-grey-76",
    "description": "High-performance training tee. HEAT.RDY technology pulls moisture away and keeps you cool. Slim fit. Stretch fabric for unrestricted movement. Graphic on chest. Recycled materials. Flatlock seams. Reflective elements. Available in multiple colors.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "Adidas Wholesale",
    "supplierUrl": "https://supplier.example.com/aw-d4tt-gry",
    "supplierCost": 14,
    "price": 25.4,
    "compareAtPrice": 29.97,
    "sku": "AW-D4TT-GRY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "adidas wholesale"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Adidas Designed 4 Training T-Shirt Grey",
    "seoDescription": "High-performance training tee. HEAT.RDY technology pulls moisture away and keeps you cool. Slim fit. Stretch fabric for unrestricted movement. Graphic on c"
  },
  {
    "id": "src-077",
    "title": "Gymshark Vital Seamless Leggings Black",
    "slug": "gymshark-vital-seamless-leggings-black-77",
    "description": "Seamless construction eliminates chafing and irritation. Gymshark Vital Seamless 2.0 Leggings in black. Four-way stretch fabric. High waist design. Gusset construction for full range of motion. Moisture-wicking. Textured knit pattern. The perfect gym legging.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "Gymshark Wholesale",
    "supplierUrl": "https://supplier.example.com/gw-vsl2-blk",
    "supplierCost": 24,
    "price": 39.2,
    "compareAtPrice": 46.26,
    "sku": "GW-VSL2-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "gymshark wholesale"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Gymshark Vital Seamless Leggings Black",
    "seoDescription": "Seamless construction eliminates chafing and irritation. Gymshark Vital Seamless 2.0 Leggings in black. Four-way stretch fabric. High waist design. Gusset "
  },
  {
    "id": "src-078",
    "title": "Lululemon Align Pant 25-inch Black",
    "slug": "lululemon-align-pant-25-inch-black-78",
    "description": "Lululemon's iconic Align Pant. Buttery-soft Nulu fabric. Four-way stretch. 25-inch inseam. High rise waistband. Naked sensation — feels like nothing. Available in multiple colorways. Machine washable. Perfect for yoga, pilates, or all-day wear.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "LuluDirect Supply",
    "supplierUrl": "https://supplier.example.com/lds-algp-blk",
    "supplierCost": 38,
    "price": 56,
    "compareAtPrice": 66.08,
    "sku": "LDS-ALGP-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "luludirect supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Lululemon Align Pant 25-inch Black",
    "seoDescription": "Lululemon's iconic Align Pant. Buttery-soft Nulu fabric. Four-way stretch. 25-inch inseam. High rise waistband. Naked sensation — feels like nothing. Avail"
  },
  {
    "id": "src-079",
    "title": "Nike Air Zoom Pegasus 40 Black",
    "slug": "nike-air-zoom-pegasus-40-black-79",
    "description": "Versatile everyday trainer with responsive cushioning. Pegasus 40 with Air Zoom unit in forefoot. ReactX midsole foam. Engineered mesh upper. Durable rubber outsole. Versatile for easy runs and longer efforts. The Pegasus series has served runners for over 35 years.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "sports",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-peg40-blk",
    "supplierCost": 46,
    "price": 67.4,
    "compareAtPrice": 79.53,
    "sku": "KS-PEG40-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Air Zoom Pegasus 40 Black",
    "seoDescription": "Versatile everyday trainer with responsive cushioning. Pegasus 40 with Air Zoom unit in forefoot. ReactX midsole foam. Engineered mesh upper. Durable rubbe"
  },
  {
    "id": "src-080",
    "title": "TRX GO Suspension Trainer System",
    "slug": "trx-go-suspension-trainer-system-80",
    "description": "Build strength anywhere. TRX GO suspension trainer with door anchor. Over 300 exercises for every fitness level. Compact — fits in your travel bag. Adjustable for all heights. Handles with foam padding for comfort. Used by military and professional athletes. Training app included.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "Sports Recovery Direct",
    "supplierUrl": "https://supplier.example.com/srd-trxgo-blk",
    "supplierCost": 36,
    "price": 55.4,
    "compareAtPrice": 65.37,
    "sku": "SRD-TRXGO-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "sports recovery direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "TRX GO Suspension Trainer System",
    "seoDescription": "Build strength anywhere. TRX GO suspension trainer with door anchor. Over 300 exercises for every fitness level. Compact — fits in your travel bag. Adjusta"
  },
  {
    "id": "src-081",
    "title": "Bowflex SelectTech 552 Adjustable Dumbbells",
    "slug": "bowflex-selecttech-552-adjustable-dumbbells-81",
    "description": "Replace 15 sets of weights. Bowflex SelectTech 552 adjusts from 5-52.5 lbs. Dial selector system for quick weight changes. Molded handles for balanced feel. Easy-change weight system. Space-saving design. Sold as pair. Ideal for home gym setups.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "Sports Recovery Direct",
    "supplierUrl": "https://supplier.example.com/srd-bfst52-adj",
    "supplierCost": 88,
    "price": 140.6,
    "compareAtPrice": 165.91,
    "sku": "SRD-BFST52-ADJ",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "sports recovery direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Bowflex SelectTech 552 Adjustable Dumbbells",
    "seoDescription": "Replace 15 sets of weights. Bowflex SelectTech 552 adjusts from 5-52.5 lbs. Dial selector system for quick weight changes. Molded handles for balanced feel"
  },
  {
    "id": "src-082",
    "title": "Peloton Yoga Mat 6mm Slate",
    "slug": "peloton-yoga-mat-6mm-slate-82",
    "description": "Premium studio-quality yoga mat. Peloton Yoga Mat in slate — 6mm thickness for cushioning and joint support. Non-slip surface. Alignment lines. Carrying strap included. Suitable for yoga, pilates, and floor workouts. Easy to clean. 68 x 24 inches.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "Sports Recovery Direct",
    "supplierUrl": "https://supplier.example.com/srd-pelo-6slt",
    "supplierCost": 28,
    "price": 45.2,
    "compareAtPrice": 53.34,
    "sku": "SRD-PELO-6SLT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "sports recovery direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Peloton Yoga Mat 6mm Slate",
    "seoDescription": "Premium studio-quality yoga mat. Peloton Yoga Mat in slate — 6mm thickness for cushioning and joint support. Non-slip surface. Alignment lines. Carrying st"
  },
  {
    "id": "src-083",
    "title": "CeraVe Moisturizing Cream 16oz",
    "slug": "cerave-moisturizing-cream-16oz-83",
    "description": "Developed with dermatologists. CeraVe Moisturizing Cream with three essential ceramides. MVE Technology for 24-hour hydration. Non-greasy formula. Fragrance-free and paraben-free. For normal to dry skin. Suitable for the entire body. Clinically tested.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-cerv-16mc",
    "supplierCost": 14,
    "price": 25.4,
    "compareAtPrice": 29.97,
    "sku": "BT-CERV-16MC",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "CeraVe Moisturizing Cream 16oz",
    "seoDescription": "Developed with dermatologists. CeraVe Moisturizing Cream with three essential ceramides. MVE Technology for 24-hour hydration. Non-greasy formula. Fragranc"
  },
  {
    "id": "src-084",
    "title": "The Ordinary Niacinamide 10% + Zinc 1%",
    "slug": "the-ordinary-niacinamide-10-zinc-1-84",
    "description": "Bestselling serum for blemish control and visible shine reduction. The Ordinary Niacinamide 10% + Zinc 1%. Water-based formula. Reduces sebum production. Fades post-acne marks. Vegan and cruelty-free. 30ml. Pairs with moisturizer. The internet's favourite serum.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-ordn-n10z",
    "supplierCost": 5.5,
    "price": 14.6,
    "compareAtPrice": 17.23,
    "sku": "BT-ORDN-N10Z",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "The Ordinary Niacinamide 10% + Zinc 1%",
    "seoDescription": "Bestselling serum for blemish control and visible shine reduction. The Ordinary Niacinamide 10% + Zinc 1%. Water-based formula. Reduces sebum production. F"
  },
  {
    "id": "src-085",
    "title": "Drunk Elephant T.L.C. Sukari Babyfacial",
    "slug": "drunk-elephant-t-l-c-sukari-babyfacial-85",
    "description": "Award-winning weekly facial treatment. Drunk Elephant Babyfacial with 25% AHA and 2% BHA blend. Removes dead skin cells. Improves skin texture. Refines pores. Cruelty-free. 2oz. Use once a week. Compatible with Drunk Elephant's milieu routine.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-drnk-bfcl",
    "supplierCost": 18,
    "price": 30.8,
    "compareAtPrice": 36.34,
    "sku": "BT-DRNK-BFCL",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Drunk Elephant T.L.C. Sukari Babyfacial",
    "seoDescription": "Award-winning weekly facial treatment. Drunk Elephant Babyfacial with 25% AHA and 2% BHA blend. Removes dead skin cells. Improves skin texture. Refines por"
  },
  {
    "id": "src-086",
    "title": "Charlotte Tilbury Flawless Filter Serum SPF20",
    "slug": "charlotte-tilbury-flawless-filter-serum-spf20-86",
    "description": "Glow-giving foundation with SPF20. Charlotte Tilbury Flawless Filter in 4 Medium. Hybrid SPF serum-foundation. Buildable coverage. Rose extract and hyaluronic acid. Blurs pores and imperfections. Luminous finish. Vegan-friendly.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-ctff-4med",
    "supplierCost": 22,
    "price": 36.2,
    "compareAtPrice": 42.72,
    "sku": "BT-CTFF-4MED",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Charlotte Tilbury Flawless Filter Serum SPF20",
    "seoDescription": "Glow-giving foundation with SPF20. Charlotte Tilbury Flawless Filter in 4 Medium. Hybrid SPF serum-foundation. Buildable coverage. Rose extract and hyaluro"
  },
  {
    "id": "src-087",
    "title": "Fenty Beauty Gloss Bomb Universal Lip Luminizer",
    "slug": "fenty-beauty-gloss-bomb-universal-lip-luminizer-87",
    "description": "Rihanna's iconic lip gloss. Fenty Gloss Bomb in Fenty Glow — a universal pink nude. Non-sticky formula. Mirror-like shine. Scented with peach-vanilla. 9ml pump applicator. Flatters all skin tones. One of the most popular lip products ever created.",
    "images": [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-fent-glbm",
    "supplierCost": 12,
    "price": 22.4,
    "compareAtPrice": 26.43,
    "sku": "BT-FENT-GLBM",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Fenty Beauty Gloss Bomb Universal Lip Luminizer",
    "seoDescription": "Rihanna's iconic lip gloss. Fenty Gloss Bomb in Fenty Glow — a universal pink nude. Non-sticky formula. Mirror-like shine. Scented with peach-vanilla. 9ml "
  },
  {
    "id": "src-088",
    "title": "MAC Pro Longwear Concealer NC15",
    "slug": "mac-pro-longwear-concealer-nc15-88",
    "description": "Full-coverage concealer that lasts all day. MAC Pro Longwear Concealer in NC15. 15-hour wear. Buildable coverage. Satin finish. Covers dark circles and blemishes. Dermatologist tested. Paraben-free. Available in 24 shades. Waterproof formula.",
    "images": [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-mac-plwnc",
    "supplierCost": 16,
    "price": 27.8,
    "compareAtPrice": 32.8,
    "sku": "BT-MAC-PLWNC",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "MAC Pro Longwear Concealer NC15",
    "seoDescription": "Full-coverage concealer that lasts all day. MAC Pro Longwear Concealer in NC15. 15-hour wear. Buildable coverage. Satin finish. Covers dark circles and ble"
  },
  {
    "id": "src-089",
    "title": "Urban Decay All Nighter Setting Spray",
    "slug": "urban-decay-all-nighter-setting-spray-89",
    "description": "The ultimate setting spray. Urban Decay All Nighter with Temperature Control Technology. Micro-fine mist sets makeup for 16 hours. Keeps foundation fresh through sweat and humidity. Oil-free formula. Works with all skin types and makeup formulas. 4 oz.",
    "images": [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-udec-anss",
    "supplierCost": 13,
    "price": 24.2,
    "compareAtPrice": 28.56,
    "sku": "BT-UDEC-ANSS",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Urban Decay All Nighter Setting Spray",
    "seoDescription": "The ultimate setting spray. Urban Decay All Nighter with Temperature Control Technology. Micro-fine mist sets makeup for 16 hours. Keeps foundation fresh t"
  },
  {
    "id": "src-090",
    "title": "NARS Soft Matte Complete Concealer Vanilla",
    "slug": "nars-soft-matte-complete-concealer-vanilla-90",
    "description": "Full coverage concealer with a soft matte finish. NARS SMCC in Vanilla. Creamy formula. Covers blemishes, dark circles, and discolouration. Crease-resistant. Non-comedogenic. 12-hour wear. Available in 30+ shades.",
    "images": [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-nars-smcc",
    "supplierCost": 18.5,
    "price": 30.8,
    "compareAtPrice": 36.34,
    "sku": "BT-NARS-SMCC",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "NARS Soft Matte Complete Concealer Vanilla",
    "seoDescription": "Full coverage concealer with a soft matte finish. NARS SMCC in Vanilla. Creamy formula. Covers blemishes, dark circles, and discolouration. Crease-resistan"
  },
  {
    "id": "src-091",
    "title": "Dyson Airwrap Complete Multi-Styler Prussian Blue",
    "slug": "dyson-airwrap-complete-multi-styler-prussian-blue-91",
    "description": "The Dyson Airwrap uses controlled airflow to style and dry hair simultaneously without extreme heat. Complete set with 6 attachments for curling, waving, smoothing, and volumising. Intelligent heat control. Long case included. Prussian blue and rich copper colorway.",
    "images": [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-dysaw-pbl",
    "supplierCost": 128,
    "price": 170.6,
    "compareAtPrice": 201.31,
    "sku": "BT-DYSAW-PBL",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Dyson Airwrap Complete Multi-Styler Prussian Blue",
    "seoDescription": "The Dyson Airwrap uses controlled airflow to style and dry hair simultaneously without extreme heat. Complete set with 6 attachments for curling, waving, s"
  },
  {
    "id": "src-092",
    "title": "Olaplex No.3 Hair Perfector Treatment",
    "slug": "olaplex-no-3-hair-perfector-treatment-92",
    "description": "The number-one selling prestige haircare product in the world. Olaplex No.3 re-links broken hair bonds for stronger, shinier hair. Use as a weekly pre-shampoo treatment. 100ml. Safe for all hair types. Cruelty-free. Vegan. Formaldehyde-free. Fragrance-free.",
    "images": [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-olap-n3hp",
    "supplierCost": 16,
    "price": 28.4,
    "compareAtPrice": 33.51,
    "sku": "BT-OLAP-N3HP",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Olaplex No.3 Hair Perfector Treatment",
    "seoDescription": "The number-one selling prestige haircare product in the world. Olaplex No.3 re-links broken hair bonds for stronger, shinier hair. Use as a weekly pre-sham"
  },
  {
    "id": "src-093",
    "title": "Sunday Riley Good Genes All-in-One Lactic Acid Treatment",
    "slug": "sunday-riley-good-genes-all-in-one-lactic-acid-treatment-93",
    "description": "Cult lactic acid serum that instantly resurfaces skin. Sunday Riley Good Genes with purified lactic acid. Visibly plumps fine lines. Improves hyperpigmentation. Refines pores. 1.7oz. Results visible after first use. Clean formulation. Cruelty-free. Apply before moisturiser.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-srgg-lac",
    "supplierCost": 28,
    "price": 43.4,
    "compareAtPrice": 51.21,
    "sku": "BT-SRGG-LAC",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Sunday Riley Good Genes All-in-One Lactic Acid Treatment",
    "seoDescription": "Cult lactic acid serum that instantly resurfaces skin. Sunday Riley Good Genes with purified lactic acid. Visibly plumps fine lines. Improves hyperpigmenta"
  },
  {
    "id": "src-094",
    "title": "Augustinus Bader The Rich Cream",
    "slug": "augustinus-bader-the-rich-cream-94",
    "description": "Luxury skincare with TFC8 technology. Augustinus Bader The Rich Cream — moisturiser for dry and sensitive skin. Deeply nourishing formula. Stimulates natural cell renewal. 50ml. Developed by a leading stem cell scientist. Used by celebrities and models globally.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-abdr-rich",
    "supplierCost": 58,
    "price": 81.8,
    "compareAtPrice": 96.52,
    "sku": "BT-ABDR-RICH",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Augustinus Bader The Rich Cream",
    "seoDescription": "Luxury skincare with TFC8 technology. Augustinus Bader The Rich Cream — moisturiser for dry and sensitive skin. Deeply nourishing formula. Stimulates natur"
  },
  {
    "id": "src-095",
    "title": "Tom Ford Oud Wood Eau de Parfum",
    "slug": "tom-ford-oud-wood-eau-de-parfum-95",
    "description": "One of the most iconic fragrances in luxury perfumery. Tom Ford Oud Wood with rare oud wood, sandalwood, and earthy vetiver. A rich, smoky oriental fragrance. 50ml EDP. Longevity on skin 8-10 hours. Suitable for any occasion. Gender-neutral.",
    "images": [
      "https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"
    ],
    "category": "beauty",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-tford-oud",
    "supplierCost": 78,
    "price": 107,
    "compareAtPrice": 126.26,
    "sku": "LSS-TFORD-OUD",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Tom Ford Oud Wood Eau de Parfum",
    "seoDescription": "One of the most iconic fragrances in luxury perfumery. Tom Ford Oud Wood with rare oud wood, sandalwood, and earthy vetiver. A rich, smoky oriental fragran"
  },
  {
    "id": "src-096",
    "title": "Chanel No. 5 Eau de Parfum 50ml",
    "slug": "chanel-no-5-eau-de-parfum-50ml-96",
    "description": "The world's most iconic fragrance. Chanel No. 5 EDP with the signature aldehyde floral composition. Notes of May Rose, Jasmine, Sandalwood, Vetiver, Amber. Created in 1921 by Ernest Beaux. 50ml. The ultimate luxury gift. A symbol of femininity and elegance.",
    "images": [
      "https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"
    ],
    "category": "beauty",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-chan5-50ml",
    "supplierCost": 84,
    "price": 114.8,
    "compareAtPrice": 135.46,
    "sku": "LSS-CHAN5-50ML",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Chanel No. 5 Eau de Parfum 50ml",
    "seoDescription": "The world's most iconic fragrance. Chanel No. 5 EDP with the signature aldehyde floral composition. Notes of May Rose, Jasmine, Sandalwood, Vetiver, Amber."
  },
  {
    "id": "src-097",
    "title": "Creed Aventus Eau de Parfum",
    "slug": "creed-aventus-eau-de-parfum-97",
    "description": "The king of men's fragrances. Creed Aventus with top notes of blackcurrant, apple, bergamot, and pineapple. Heart of birch, jasmine, rose, and dry patchouli. Base of musk, oakmoss, ambergris, and vanilla. 100ml. Unparalleled longevity and projection.",
    "images": [
      "https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"
    ],
    "category": "beauty",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-cravt-edp",
    "supplierCost": 92,
    "price": 125,
    "compareAtPrice": 147.5,
    "sku": "LSS-CRAVT-EDP",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Creed Aventus Eau de Parfum",
    "seoDescription": "The king of men's fragrances. Creed Aventus with top notes of blackcurrant, apple, bergamot, and pineapple. Heart of birch, jasmine, rose, and dry patchoul"
  },
  {
    "id": "src-098",
    "title": "Maison Margiela Replica Jazz Club EDT",
    "slug": "maison-margiela-replica-jazz-club-edt-98",
    "description": "A walk into a New York jazz club. Replica Jazz Club with tobacco leaf, rum, and wood notes. 100ml EDT. A cozy, warming masculine fragrance. Suitable for evening and cooler months. Among Maison Margiela's most popular memory-inspired scents.",
    "images": [
      "https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"
    ],
    "category": "beauty",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-mmrj-jaz",
    "supplierCost": 58,
    "price": 82.4,
    "compareAtPrice": 97.23,
    "sku": "LSS-MMRJ-JAZ",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Maison Margiela Replica Jazz Club EDT",
    "seoDescription": "A walk into a New York jazz club. Replica Jazz Club with tobacco leaf, rum, and wood notes. 100ml EDT. A cozy, warming masculine fragrance. Suitable for ev"
  },
  {
    "id": "src-099",
    "title": "Dior Sauvage Eau de Toilette 100ml",
    "slug": "dior-sauvage-eau-de-toilette-100ml-99",
    "description": "The world's best-selling men's fragrance. Dior Sauvage EDT with Calabrian bergamot and ambroxan. Fresh, woody, and masculine. 100ml EDT. Intense projection. 6-8 hour longevity. Designed by François Demachy. Worn by Johnny Depp in campaigns.",
    "images": [
      "https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"
    ],
    "category": "beauty",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-diors-100",
    "supplierCost": 68,
    "price": 95,
    "compareAtPrice": 112.1,
    "sku": "LSS-DIORS-100",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Dior Sauvage Eau de Toilette 100ml",
    "seoDescription": "The world's best-selling men's fragrance. Dior Sauvage EDT with Calabrian bergamot and ambroxan. Fresh, woody, and masculine. 100ml EDT. Intense projection"
  },
  {
    "id": "src-100",
    "title": "Sol de Janeiro Brazilian Bum Bum Cream 240ml",
    "slug": "sol-de-janeiro-brazilian-bum-bum-cream-240ml-100",
    "description": "Viral body cream loved globally. Sol de Janeiro Bum Bum Cream with caffeine, guaraná, cupuaçu butter, and coconut oil. Firming, smoothing, and fast-absorbing. Addictive pistachio and salted caramel scent. 240ml. Loved by TikTok and dermatologists alike.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-sdjan-bbcr",
    "supplierCost": 22,
    "price": 36.2,
    "compareAtPrice": 42.72,
    "sku": "BT-SDJAN-BBCR",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Sol de Janeiro Brazilian Bum Bum Cream 240ml",
    "seoDescription": "Viral body cream loved globally. Sol de Janeiro Bum Bum Cream with caffeine, guaraná, cupuaçu butter, and coconut oil. Firming, smoothing, and fast-absorbi"
  },
  {
    "id": "src-101",
    "title": "Versace Eros Eau de Toilette 100ml",
    "slug": "versace-eros-eau-de-toilette-100ml-101",
    "description": "Inspired by the Greek god of love. Versace Eros EDT with mint leaves, Italian lemon, and green apple. Heart of Madagascar vanilla and tonka beans. Base of oakmoss, vetiver, and Atlas cedar. 100ml. Strong sillage. A bold masculine statement.",
    "images": [
      "https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"
    ],
    "category": "beauty",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-vrseros-100",
    "supplierCost": 54,
    "price": 77,
    "compareAtPrice": 90.86,
    "sku": "LSS-VRSEROS-100",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Versace Eros Eau de Toilette 100ml",
    "seoDescription": "Inspired by the Greek god of love. Versace Eros EDT with mint leaves, Italian lemon, and green apple. Heart of Madagascar vanilla and tonka beans. Base of "
  },
  {
    "id": "src-102",
    "title": "Clinique Dramatically Different Moisturising Lotion+ 125ml",
    "slug": "clinique-dramatically-different-moisturising-lotion-125ml-102",
    "description": "The original moisture surge. Clinique DDML+ 125ml refillable formula. Dermatologist-developed. Allergy-tested. 100% fragrance free. Contains hyaluronic acid and sunflower seed cake. A bestseller since 1968. Suitable for combination to oily skin.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-clin-ddml",
    "supplierCost": 16.5,
    "price": 28.4,
    "compareAtPrice": 33.51,
    "sku": "BT-CLIN-DDML",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Clinique Dramatically Different Moisturising Lotion+ 125ml",
    "seoDescription": "The original moisture surge. Clinique DDML+ 125ml refillable formula. Dermatologist-developed. Allergy-tested. 100% fragrance free. Contains hyaluronic aci"
  },
  {
    "id": "src-103",
    "title": "Nike Air Huarache Run Sail Collegiate Navy",
    "slug": "nike-air-huarache-run-sail-collegiate-navy-103",
    "description": "The Nike Air Huarache with modern street appeal. Sail and collegiate navy colorway. Dynamic-fit inner sleeve hugs the foot. Rubberised outsole. Exposed foam collar. Lightweight neoprene and rubber construction. First designed by Tinker Hatfield in 1992.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-nhur-scn",
    "supplierCost": 36,
    "price": 54.8,
    "compareAtPrice": 64.66,
    "sku": "KS-NHUR-SCN",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Air Huarache Run Sail Collegiate Navy",
    "seoDescription": "The Nike Air Huarache with modern street appeal. Sail and collegiate navy colorway. Dynamic-fit inner sleeve hugs the foot. Rubberised outsole. Exposed foa"
  },
  {
    "id": "src-104",
    "title": "Jordan Jumpman Jack TR Training Shoe",
    "slug": "jordan-jumpman-jack-tr-training-shoe-104",
    "description": "New lightweight training shoe from Jordan Brand. Jumpman Jack TR with containment cage. Forefoot strap. Articulated outsole. Engineered mesh upper. Zoom Air heel cushioning. Designed for explosive multi-directional movements. First training shoe under the Jumpman Jack franchise.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "sports",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-jjktr-blk",
    "supplierCost": 52,
    "price": 75.2,
    "compareAtPrice": 88.74,
    "sku": "KS-JJKTR-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Jordan Jumpman Jack TR Training Shoe",
    "seoDescription": "New lightweight training shoe from Jordan Brand. Jumpman Jack TR with containment cage. Forefoot strap. Articulated outsole. Engineered mesh upper. Zoom Ai"
  },
  {
    "id": "src-105",
    "title": "Adidas Handball Spezial Blue Gum",
    "slug": "adidas-handball-spezial-blue-gum-105",
    "description": "German handball shoe gone streetwear icon. Adidas Handball Spezial in blue with gum sole. Suede upper. Adilight PRIMEGREEN material. Low-profile silhouette. Midsole-integrated three stripes. Herringbone outsole. One of the most sought-after Adidas classics.",
    "images": [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600"
    ],
    "category": "fashion",
    "supplierName": "Adidas Wholesale",
    "supplierUrl": "https://supplier.example.com/aw-hnds-blgm",
    "supplierCost": 34,
    "price": 52.4,
    "compareAtPrice": 61.83,
    "sku": "AW-HNDS-BLGM",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "adidas wholesale"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Adidas Handball Spezial Blue Gum",
    "seoDescription": "German handball shoe gone streetwear icon. Adidas Handball Spezial in blue with gum sole. Suede upper. Adilight PRIMEGREEN material. Low-profile silhouette"
  },
  {
    "id": "src-106",
    "title": "Nike Blazer Mid 77 Vintage White",
    "slug": "nike-blazer-mid-77-vintage-white-106",
    "description": "Retro basketball shoe with vintage sole details. Blazer Mid 77 in white with faded heel. Leather and suede upper. Nike Sole vintage-yellowed outsole. Padded collar. Nike Swoosh branding. A classic from the 1970s basketball courts.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-blzm77-wht",
    "supplierCost": 32,
    "price": 49.4,
    "compareAtPrice": 58.29,
    "sku": "KS-BLZM77-WHT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Blazer Mid 77 Vintage White",
    "seoDescription": "Retro basketball shoe with vintage sole details. Blazer Mid 77 in white with faded heel. Leather and suede upper. Nike Sole vintage-yellowed outsole. Padde"
  },
  {
    "id": "src-107",
    "title": "Asics Gel-Nimbus 25 Illuminate Yellow",
    "slug": "asics-gel-nimbus-25-illuminate-yellow-107",
    "description": "Asics' most cushioned running shoe. Gel-Nimbus 25 with FF BLAST+ ECO foam. ASICS GEL Technology. Engineered mesh knit upper. LITETRUSS stability element. Illuminate yellow colorway. 12mm heel drop. For easy and long-distance running. Daily trainer.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "sports",
    "supplierName": "ASICS Supply Japan",
    "supplierUrl": "https://supplier.example.com/asj-gnb25-iyl",
    "supplierCost": 58,
    "price": 83,
    "compareAtPrice": 97.94,
    "sku": "ASJ-GNB25-IYL",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "asics supply japan"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Asics Gel-Nimbus 25 Illuminate Yellow",
    "seoDescription": "Asics' most cushioned running shoe. Gel-Nimbus 25 with FF BLAST+ ECO foam. ASICS GEL Technology. Engineered mesh knit upper. LITETRUSS stability element. I"
  },
  {
    "id": "src-108",
    "title": "Carhartt WIP Chase Hoodie Black Gold",
    "slug": "carhartt-wip-chase-hoodie-black-gold-108",
    "description": "Workwear heritage meets streetwear culture. Carhartt WIP Chase Hoodie in black with gold signature. Heavyweight 320g fabric. Kangaroo pocket. Adjustable hood. Ribbed hem and cuffs. Front zip. Embroidered script logo. Loose fit for streetwear layering.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "CarharttDirect",
    "supplierUrl": "https://supplier.example.com/cd-cwip-chh",
    "supplierCost": 38,
    "price": 57.8,
    "compareAtPrice": 68.2,
    "sku": "CD-CWIP-CHH",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "carharttdirect"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Carhartt WIP Chase Hoodie Black Gold",
    "seoDescription": "Workwear heritage meets streetwear culture. Carhartt WIP Chase Hoodie in black with gold signature. Heavyweight 320g fabric. Kangaroo pocket. Adjustable ho"
  },
  {
    "id": "src-109",
    "title": "Fear of God Essentials Relaxed Hoodie Cream",
    "slug": "fear-of-god-essentials-relaxed-hoodie-cream-109",
    "description": "Jerry Lorenzo's mainline streetwear. Fear of God Essentials Hoodie in cream. Relaxed oversized fit. Dropped shoulders. Rubber logo branding at chest and hood. Drawstring hood. Front pocket. 100% cotton. Clean minimalist design.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-foges-crm",
    "supplierCost": 44,
    "price": 65.6,
    "compareAtPrice": 77.41,
    "sku": "LSS-FOGES-CRM",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Fear of God Essentials Relaxed Hoodie Cream",
    "seoDescription": "Jerry Lorenzo's mainline streetwear. Fear of God Essentials Hoodie in cream. Relaxed oversized fit. Dropped shoulders. Rubber logo branding at chest and ho"
  },
  {
    "id": "src-110",
    "title": "Stone Island Compass Rose Tee White",
    "slug": "stone-island-compass-rose-tee-white-110",
    "description": "The most copied logo in streetwear. Stone Island classic compass rose graphic tee in white. 100% cotton jersey. Garment dyed. Regular fit. Embroidered compass patch at left chest. Made in Italy. A staple for streetwear enthusiasts.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-stni-crte",
    "supplierCost": 32,
    "price": 50,
    "compareAtPrice": 59,
    "sku": "LSS-STNI-CRTE",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Stone Island Compass Rose Tee White",
    "seoDescription": "The most copied logo in streetwear. Stone Island classic compass rose graphic tee in white. 100% cotton jersey. Garment dyed. Regular fit. Embroidered comp"
  },
  {
    "id": "src-111",
    "title": "The North Face Nuptse Jacket Black 700-Fill",
    "slug": "the-north-face-nuptse-jacket-black-700-fill-111",
    "description": "The most iconic down jacket in outdoor fashion. TNF Nuptse 700-fill down jacket in black. Baffled design with recycled down. Elastic cuffs and hem. Two hand pockets with snap closure. Logo on chest. Packable into hand pocket for travel. Warm to -15°C.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-tnfn-blk",
    "supplierCost": 74,
    "price": 105.8,
    "compareAtPrice": 124.84,
    "sku": "OGD-TNFN-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "The North Face Nuptse Jacket Black 700-Fill",
    "seoDescription": "The most iconic down jacket in outdoor fashion. TNF Nuptse 700-fill down jacket in black. Baffled design with recycled down. Elastic cuffs and hem. Two han"
  },
  {
    "id": "src-112",
    "title": "Canada Goose Expedition Parka Graphite",
    "slug": "canada-goose-expedition-parka-graphite-112",
    "description": "Protection at -30°C and below. Canada Goose Expedition Parka with 625 fill power white duck down. Fixed 4-way adjustable hood. Two-way locking front zipper. Internal security pocket. Storm cuffs. Recessed back hem. Sold in Graphite with Arctic Tech shell.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-cgex-grf",
    "supplierCost": 148,
    "price": 204.2,
    "compareAtPrice": 240.96,
    "sku": "OGD-CGEX-GRF",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Canada Goose Expedition Parka Graphite",
    "seoDescription": "Protection at -30°C and below. Canada Goose Expedition Parka with 625 fill power white duck down. Fixed 4-way adjustable hood. Two-way locking front zipper"
  },
  {
    "id": "src-113",
    "title": "Patagonia Nano Puff Jacket Navy Blue",
    "slug": "patagonia-nano-puff-jacket-navy-blue-113",
    "description": "Award-winning insulation jacket. Patagonia Nano Puff with PrimaLoft Gold insulation. Weather-resistant DWR finish. Stuff sack with carabiner clip. Stuffs into chest pocket. 100% recycled shell and liner. Incredibly warm for its weight. Packable to golf-ball size.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-pnpf-nvy",
    "supplierCost": 68,
    "price": 97.4,
    "compareAtPrice": 114.93,
    "sku": "OGD-PNPF-NVY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Patagonia Nano Puff Jacket Navy Blue",
    "seoDescription": "Award-winning insulation jacket. Patagonia Nano Puff with PrimaLoft Gold insulation. Weather-resistant DWR finish. Stuff sack with carabiner clip. Stuffs i"
  },
  {
    "id": "src-114",
    "title": "Arc'teryx Beta AR Jacket Orca",
    "slug": "arc-teryx-beta-ar-jacket-orca-114",
    "description": "The benchmark waterproof jacket. Arc'teryx Beta AR with GORE-TEX Pro. 3-layer construction. Advanced CR-3000 zipper system. Laminated N80p-X Pac fabric. Drop hood. Motion SL fit. Orca colourway. The one jacket for all-weather alpine conditions.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-arbt-orc",
    "supplierCost": 138,
    "price": 189.8,
    "compareAtPrice": 223.96,
    "sku": "OGD-ARBT-ORC",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Arc'teryx Beta AR Jacket Orca",
    "seoDescription": "The benchmark waterproof jacket. Arc'teryx Beta AR with GORE-TEX Pro. 3-layer construction. Advanced CR-3000 zipper system. Laminated N80p-X Pac fabric. Dr"
  },
  {
    "id": "src-115",
    "title": "Balenciaga Triple S Sneaker Black White",
    "slug": "balenciaga-triple-s-sneaker-black-white-115",
    "description": "The original chunky sneaker that started the dad shoe revolution. Balenciaga Triple S in black and white. Combination leather and mesh upper. Triple-sole construction. Heavyweight outsole. Embossed Balenciaga logo. A luxury sneaker icon since 2017.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-balts-bwh",
    "supplierCost": 118,
    "price": 161,
    "compareAtPrice": 189.98,
    "sku": "LSS-BALTS-BWH",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Balenciaga Triple S Sneaker Black White",
    "seoDescription": "The original chunky sneaker that started the dad shoe revolution. Balenciaga Triple S in black and white. Combination leather and mesh upper. Triple-sole c"
  },
  {
    "id": "src-116",
    "title": "Alexander McQueen Oversized Sneaker White",
    "slug": "alexander-mcqueen-oversized-sneaker-white-116",
    "description": "The luxury brand's most iconic silhouette. Alexander McQueen Oversized Sneaker in white leather. Genuine leather upper. Gold-tone embossed branding. Padded ankle collar. Oversized rubber outsole. Subtle McQ logo on outsole. Timeless and versatile.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-amcos-wht",
    "supplierCost": 108,
    "price": 149,
    "compareAtPrice": 175.82,
    "sku": "LSS-AMCOS-WHT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Alexander McQueen Oversized Sneaker White",
    "seoDescription": "The luxury brand's most iconic silhouette. Alexander McQueen Oversized Sneaker in white leather. Genuine leather upper. Gold-tone embossed branding. Padded"
  },
  {
    "id": "src-117",
    "title": "Gucci Ace Sneaker GG Canvas",
    "slug": "gucci-ace-sneaker-gg-canvas-117",
    "description": "Gucci's iconic leather low-top sneaker with GG canvas detail. Gucci Ace with interlocking GG patch at heel. Web stripe detail. Rubber cupsole. Embroidered flower motif on toe. Leather lining. GG canvas panel on sides. A luxury everyday sneaker.",
    "images": [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-gucc-acegg",
    "supplierCost": 128,
    "price": 175.4,
    "compareAtPrice": 206.97,
    "sku": "LSS-GUCC-ACEGG",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Gucci Ace Sneaker GG Canvas",
    "seoDescription": "Gucci's iconic leather low-top sneaker with GG canvas detail. Gucci Ace with interlocking GG patch at heel. Web stripe detail. Rubber cupsole. Embroidered "
  },
  {
    "id": "src-118",
    "title": "Louis Vuitton Run Away Sneaker White",
    "slug": "louis-vuitton-run-away-sneaker-white-118",
    "description": "LV's most popular casual sneaker. Louis Vuitton Run Away in white perforated leather. LV monogram embossed on side. Bold red LV signature tab. Padded collar. Rubber sole with LV print. Box calfskin leather lining. The ultimate luxury sneaker statement.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-lvrun-wht",
    "supplierCost": 134,
    "price": 182.6,
    "compareAtPrice": 215.47,
    "sku": "LSS-LVRUN-WHT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Louis Vuitton Run Away Sneaker White",
    "seoDescription": "LV's most popular casual sneaker. Louis Vuitton Run Away in white perforated leather. LV monogram embossed on side. Bold red LV signature tab. Padded colla"
  },
  {
    "id": "src-119",
    "title": "Common Projects Achilles Low White",
    "slug": "common-projects-achilles-low-white-119",
    "description": "Minimalism at its finest. Common Projects Achilles Low in white pebbled leather. Gold-stamped serial number at heel. Clean, logo-free upper. Perforated toe cap. The understated luxury sneaker beloved by architects, designers, and tastemakers.",
    "images": [
      "https://images.unsplash.com/photo-1584735175315-9d5df23be2c2?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-cpach-wht",
    "supplierCost": 98,
    "price": 134.6,
    "compareAtPrice": 158.83,
    "sku": "LSS-CPACH-WHT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Common Projects Achilles Low White",
    "seoDescription": "Minimalism at its finest. Common Projects Achilles Low in white pebbled leather. Gold-stamped serial number at heel. Clean, logo-free upper. Perforated toe"
  },
  {
    "id": "src-120",
    "title": "Adidas Yeezy Boost 700 Wave Runner",
    "slug": "adidas-yeezy-boost-700-wave-runner-120",
    "description": "Kanye's retro-dad aesthetic brought to life. Yeezy 700 Wave Runner in multi-color. Mesh and suede upper. BOOST midsole for cushioning. Rubberized midsole details. Rope lacing system. A 2017 release still dominating resale and street style.",
    "images": [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600"
    ],
    "category": "fashion",
    "supplierName": "YeezySource Co",
    "supplierUrl": "https://supplier.example.com/ys-700-wrun",
    "supplierCost": 74,
    "price": 103.4,
    "compareAtPrice": 122.01,
    "sku": "YS-700-WRUN",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "yeezysource co"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Adidas Yeezy Boost 700 Wave Runner",
    "seoDescription": "Kanye's retro-dad aesthetic brought to life. Yeezy 700 Wave Runner in multi-color. Mesh and suede upper. BOOST midsole for cushioning. Rubberized midsole d"
  },
  {
    "id": "src-121",
    "title": "New Balance 2002R Protection Pack Quartz Grey",
    "slug": "new-balance-2002r-protection-pack-quartz-grey-121",
    "description": "New Balance's premium 2002R silhouette in Quartz Grey. ABZORB SBS foam in the midsole. C-CAP midsole. Suede and mesh upper. N-Ergy heel cushioning. Protection Pack colourway — muted and sophisticated. A grail for NB collectors.",
    "images": [
      "https://images.unsplash.com/photo-1584735175315-9d5df23be2c2?w=600"
    ],
    "category": "fashion",
    "supplierName": "NB Wholesale Hub",
    "supplierUrl": "https://supplier.example.com/nb-2002r-qgy",
    "supplierCost": 54,
    "price": 77.6,
    "compareAtPrice": 91.57,
    "sku": "NB-2002R-QGY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "nb wholesale hub"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "New Balance 2002R Protection Pack Quartz Grey",
    "seoDescription": "New Balance's premium 2002R silhouette in Quartz Grey. ABZORB SBS foam in the midsole. C-CAP midsole. Suede and mesh upper. N-Ergy heel cushioning. Protect"
  },
  {
    "id": "src-122",
    "title": "Nike Cortez Black White Nylon",
    "slug": "nike-cortez-black-white-nylon-122",
    "description": "The shoe that started Nike. Nike Cortez in black and white nylon. Lightweight nylon upper with leather swoosh overlay. Waffle rubber outsole. Foam wedge midsole. Padded collar. First Nike shoe ever sold — designed by Bill Bowerman and Phil Knight in 1972.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-cort-bwn",
    "supplierCost": 26,
    "price": 41.6,
    "compareAtPrice": 49.09,
    "sku": "KS-CORT-BWN",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Cortez Black White Nylon",
    "seoDescription": "The shoe that started Nike. Nike Cortez in black and white nylon. Lightweight nylon upper with leather swoosh overlay. Waffle rubber outsole. Foam wedge mi"
  },
  {
    "id": "src-123",
    "title": "Adidas Campus 00s Cream White Cloud White",
    "slug": "adidas-campus-00s-cream-white-cloud-white-123",
    "description": "Retro campus shoe with 90s aesthetics. Adidas Campus 00s in cream white. Suede upper. 3-Stripes branding. Trefoil logo on tongue. Gum rubber outsole. Flat lace system. A favourite among vintage Adidas collectors revived for the modern era.",
    "images": [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600"
    ],
    "category": "fashion",
    "supplierName": "Adidas Wholesale",
    "supplierUrl": "https://supplier.example.com/aw-camp00-cwh",
    "supplierCost": 28,
    "price": 44.6,
    "compareAtPrice": 52.63,
    "sku": "AW-CAMP00-CWH",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "adidas wholesale"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Adidas Campus 00s Cream White Cloud White",
    "seoDescription": "Retro campus shoe with 90s aesthetics. Adidas Campus 00s in cream white. Suede upper. 3-Stripes branding. Trefoil logo on tongue. Gum rubber outsole. Flat "
  },
  {
    "id": "src-124",
    "title": "Salomon XT-6 Black Phantom",
    "slug": "salomon-xt-6-black-phantom-124",
    "description": "Trail running technology brought to the streets. Salomon XT-6 in black and phantom. Contagrip rubber outsole. Quicklace system. Protective toe cap. Energy Cell midsole. A collaboration favourite with Dover Street Market and Palace.",
    "images": [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600"
    ],
    "category": "sports",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-salo-xt6",
    "supplierCost": 58,
    "price": 83,
    "compareAtPrice": 97.94,
    "sku": "OGD-SALO-XT6",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Salomon XT-6 Black Phantom",
    "seoDescription": "Trail running technology brought to the streets. Salomon XT-6 in black and phantom. Contagrip rubber outsole. Quicklace system. Protective toe cap. Energy "
  },
  {
    "id": "src-125",
    "title": "Saucony Endorphin Speed 4 Black Vizigold",
    "slug": "saucony-endorphin-speed-4-black-vizigold-125",
    "description": "Super shoe for everyday runners. Saucony Endorphin Speed 4 with PWRRUN PB foam. Speedroll technology. Carbon fiber plate. Engineered mesh upper. Vizigold reflective details in black. 5mm offset. Race-day performance for training budgets.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "sports",
    "supplierName": "Saucony Wholesale",
    "supplierUrl": "https://supplier.example.com/sw-esped4-bgd",
    "supplierCost": 64,
    "price": 90.2,
    "compareAtPrice": 106.44,
    "sku": "SW-ESPED4-BGD",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "saucony wholesale"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Saucony Endorphin Speed 4 Black Vizigold",
    "seoDescription": "Super shoe for everyday runners. Saucony Endorphin Speed 4 with PWRRUN PB foam. Speedroll technology. Carbon fiber plate. Engineered mesh upper. Vizigold r"
  },
  {
    "id": "src-126",
    "title": "Wilson Pro Staff RF97 Autograph Tennis Racket",
    "slug": "wilson-pro-staff-rf97-autograph-tennis-racket-126",
    "description": "Roger Federer's signature racket. Wilson Pro Staff RF97 Autograph. 97 sq-in head. 340g unstrung. Braided Graphite and Basalt construction. X2 Ergo Handle for comfort. 16x19 string pattern. Comes strung with Wilson Natural Gut.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "SportsGear Direct",
    "supplierUrl": "https://supplier.example.com/sgd-wils-rf97",
    "supplierCost": 88,
    "price": 125,
    "compareAtPrice": 147.5,
    "sku": "SGD-WILS-RF97",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "sportsgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Wilson Pro Staff RF97 Autograph Tennis Racket",
    "seoDescription": "Roger Federer's signature racket. Wilson Pro Staff RF97 Autograph. 97 sq-in head. 340g unstrung. Braided Graphite and Basalt construction. X2 Ergo Handle f"
  },
  {
    "id": "src-127",
    "title": "Callaway Rogue ST Max Driver 10.5°",
    "slug": "callaway-rogue-st-max-driver-10-5-127",
    "description": "Maximum forgiveness from the fairway. Callaway Rogue ST Max Driver with Jailbreak AI Speed Frame. Flash Face SS21. Triaxial Carbon Crown. NEOS Sliding 16-gram Weight. 10.5-degree loft. Regular flex Project X Hzrdus shaft. For high handicappers wanting distance.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "SportsGear Direct",
    "supplierUrl": "https://supplier.example.com/sgd-call-rgst",
    "supplierCost": 118,
    "price": 164.6,
    "compareAtPrice": 194.23,
    "sku": "SGD-CALL-RGST",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "sportsgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Callaway Rogue ST Max Driver 10.5°",
    "seoDescription": "Maximum forgiveness from the fairway. Callaway Rogue ST Max Driver with Jailbreak AI Speed Frame. Flash Face SS21. Triaxial Carbon Crown. NEOS Sliding 16-g"
  },
  {
    "id": "src-128",
    "title": "Trek Marlin 7 Mountain Bike 29-inch",
    "slug": "trek-marlin-7-mountain-bike-29-inch-128",
    "description": "A capable, well-equipped mountain bike. Trek Marlin 7 with RockShox 30 Silver TK suspension fork. Shimano Deore 10-speed drivetrain. Hydraulic disc brakes. 29-inch wheels. Aluminum Alpha frame. Bontrager Satellite Plus saddle. SR Suntour lockout fork.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "SportsGear Direct",
    "supplierUrl": "https://supplier.example.com/sgd-trkm7-29",
    "supplierCost": 128,
    "price": 200.6,
    "compareAtPrice": 236.71,
    "sku": "SGD-TRKM7-29",
    "stock": 0,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "sportsgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Trek Marlin 7 Mountain Bike 29-inch",
    "seoDescription": "A capable, well-equipped mountain bike. Trek Marlin 7 with RockShox 30 Silver TK suspension fork. Shimano Deore 10-speed drivetrain. Hydraulic disc brakes."
  },
  {
    "id": "src-129",
    "title": "Babolat Pure Aero Tennis Racket",
    "slug": "babolat-pure-aero-tennis-racket-129",
    "description": "Used by Rafael Nadal. Babolat Pure Aero with Cortex Pure Feel. FSI Power technology. 100 sq-in head. 300g unstrung. 16x19 string pattern. Aeromodular2 frame for aerodynamics. Carbon fiber construction. Comes unstrung for personalization.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "SportsGear Direct",
    "supplierUrl": "https://supplier.example.com/sgd-babl-paer",
    "supplierCost": 82,
    "price": 117.8,
    "compareAtPrice": 139,
    "sku": "SGD-BABL-PAER",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "sportsgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Babolat Pure Aero Tennis Racket",
    "seoDescription": "Used by Rafael Nadal. Babolat Pure Aero with Cortex Pure Feel. FSI Power technology. 100 sq-in head. 300g unstrung. 16x19 string pattern. Aeromodular2 fram"
  },
  {
    "id": "src-130",
    "title": "Hydro Flask 32oz Wide Mouth Water Bottle Pacific",
    "slug": "hydro-flask-32oz-wide-mouth-water-bottle-pacific-130",
    "description": "Vacuum insulation keeps drinks cold 24 hours and hot 12 hours. Hydro Flask 32oz Wide Mouth in Pacific blue. TempShield double-wall insulation. 18/8 pro-grade stainless steel. Flex Cap included. Powder-coated for grip. BPA-free and phthalate-free. Lifetime warranty.",
    "images": [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600"
    ],
    "category": "sports",
    "supplierName": "HomeVibe Supply",
    "supplierUrl": "https://supplier.example.com/hv-hflk-32pc",
    "supplierCost": 24,
    "price": 39.8,
    "compareAtPrice": 46.96,
    "sku": "HV-HFLK-32PC",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "homevibe supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Hydro Flask 32oz Wide Mouth Water Bottle Pacific",
    "seoDescription": "Vacuum insulation keeps drinks cold 24 hours and hot 12 hours. Hydro Flask 32oz Wide Mouth in Pacific blue. TempShield double-wall insulation. 18/8 pro-gra"
  },
  {
    "id": "src-131",
    "title": "Levi's 501 Original Jeans Medium Stonewash",
    "slug": "levi-s-501-original-jeans-medium-stonewash-131",
    "description": "The original jean since 1873. Levi's 501 in medium stonewash. 100% cotton denim. Button fly. Straight leg cut. Five-pocket styling. The most influential garment in denim history. One size up if you're between sizes — the 501 runs true to vintage cuts.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "Levi's Supply Hub",
    "supplierUrl": "https://supplier.example.com/lsh-501-msw",
    "supplierCost": 28,
    "price": 46.4,
    "compareAtPrice": 54.75,
    "sku": "LSH-501-MSW",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "levi's supply hub"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Levi's 501 Original Jeans Medium Stonewash",
    "seoDescription": "The original jean since 1873. Levi's 501 in medium stonewash. 100% cotton denim. Button fly. Straight leg cut. Five-pocket styling. The most influential ga"
  },
  {
    "id": "src-132",
    "title": "Wrangler Cowboy Cut Slim Fit Jean Midnight Blue",
    "slug": "wrangler-cowboy-cut-slim-fit-jean-midnight-blue-132",
    "description": "Western-inspired slim-fit denim. Wrangler Cowboy Cut in midnight blue. 14oz denim. Boot cut leg opening for stacking over boots. Reinforced seat and thighs. Deep pockets for wallets and tools. 5-star right pocket for snuff can. A ranching icon.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "Wrangler Direct",
    "supplierUrl": "https://supplier.example.com/wd-cowct-mbl",
    "supplierCost": 24,
    "price": 41,
    "compareAtPrice": 48.38,
    "sku": "WD-COWCT-MBL",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "wrangler direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Wrangler Cowboy Cut Slim Fit Jean Midnight Blue",
    "seoDescription": "Western-inspired slim-fit denim. Wrangler Cowboy Cut in midnight blue. 14oz denim. Boot cut leg opening for stacking over boots. Reinforced seat and thighs"
  },
  {
    "id": "src-133",
    "title": "Tommy Hilfiger Classic Polo Navy White Stripe",
    "slug": "tommy-hilfiger-classic-polo-navy-white-stripe-133",
    "description": "Preppy American heritage polo. Tommy Hilfiger Classic Polo in navy and white stripe. Pique fabric. Two-button placket. Self-fabric collar. Embroidered Tommy flag logo at chest. Short sleeves with ribbed cuffs. Regular fit. A wardrobe staple since 1985.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "Tommy Direct Supply",
    "supplierUrl": "https://supplier.example.com/tds-clplo-nws",
    "supplierCost": 22,
    "price": 36.2,
    "compareAtPrice": 42.72,
    "sku": "TDS-CLPLO-NWS",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "tommy direct supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Tommy Hilfiger Classic Polo Navy White Stripe",
    "seoDescription": "Preppy American heritage polo. Tommy Hilfiger Classic Polo in navy and white stripe. Pique fabric. Two-button placket. Self-fabric collar. Embroidered Tomm"
  },
  {
    "id": "src-134",
    "title": "Ralph Lauren Custom Slim Fit Oxford Shirt White",
    "slug": "ralph-lauren-custom-slim-fit-oxford-shirt-white-134",
    "description": "Iconic Oxford cloth button-down. Ralph Lauren CSBD in white. 100% cotton Oxford weave. Button-down collar. Chest pocket. Embroidered pony at chest. Long sleeves with button cuffs. Slim fit for a tailored look. Machine washable.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "RL Direct Supply",
    "supplierUrl": "https://supplier.example.com/rlds-csobd-wht",
    "supplierCost": 28,
    "price": 44.6,
    "compareAtPrice": 52.63,
    "sku": "RLDS-CSOBD-WHT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "rl direct supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Ralph Lauren Custom Slim Fit Oxford Shirt White",
    "seoDescription": "Iconic Oxford cloth button-down. Ralph Lauren CSBD in white. 100% cotton Oxford weave. Button-down collar. Chest pocket. Embroidered pony at chest. Long sl"
  },
  {
    "id": "src-135",
    "title": "Lacoste L.12.12 Classic Polo White",
    "slug": "lacoste-l-12-12-classic-polo-white-135",
    "description": "The original polo shirt. Lacoste L.12.12 in white. 100% cotton petit piqué. Ribbed collar and sleeve bands. Signature crocodile embroidery at left chest. Regular fit. Two-button placket. Tail hem. A tennis court icon since René Lacoste in 1933.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "Lacoste Direct",
    "supplierUrl": "https://supplier.example.com/ld-l1212-wht",
    "supplierCost": 38,
    "price": 56.6,
    "compareAtPrice": 66.79,
    "sku": "LD-L1212-WHT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "lacoste direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Lacoste L.12.12 Classic Polo White",
    "seoDescription": "The original polo shirt. Lacoste L.12.12 in white. 100% cotton petit piqué. Ribbed collar and sleeve bands. Signature crocodile embroidery at left chest. R"
  },
  {
    "id": "src-136",
    "title": "Fred Perry Twin Tipped Polo Shirt Midnight",
    "slug": "fred-perry-twin-tipped-polo-shirt-midnight-136",
    "description": "Worn by mods, Britpop bands, and street culture icons. Fred Perry Twin Tipped Polo in midnight blue. Pique fabric. Laurel wreath embroidery at chest. Twin tipped collar and cuffs. Regular fit. Made in Portugal. The defining polo of British subculture.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "Fred Perry Direct",
    "supplierUrl": "https://supplier.example.com/fpd-ttpp-mid",
    "supplierCost": 34,
    "price": 51.8,
    "compareAtPrice": 61.12,
    "sku": "FPD-TTPP-MID",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "fred perry direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Fred Perry Twin Tipped Polo Shirt Midnight",
    "seoDescription": "Worn by mods, Britpop bands, and street culture icons. Fred Perry Twin Tipped Polo in midnight blue. Pique fabric. Laurel wreath embroidery at chest. Twin "
  },
  {
    "id": "src-137",
    "title": "Gucci GG Monogram Canvas Belt Black",
    "slug": "gucci-gg-monogram-canvas-belt-black-137",
    "description": "The most copied belt in fashion. Gucci GG Monogram Canvas Belt in black. Brass double G interlocking buckle. Beige and ebony GG canvas strap. 3.8cm width. Leather lining. Available in sizes 75-105. Made in Italy. The ultimate luxury accessory statement.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-gucc-gbblt",
    "supplierCost": 48,
    "price": 68.6,
    "compareAtPrice": 80.95,
    "sku": "LSS-GUCC-GBBLT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Gucci GG Monogram Canvas Belt Black",
    "seoDescription": "The most copied belt in fashion. Gucci GG Monogram Canvas Belt in black. Brass double G interlocking buckle. Beige and ebony GG canvas strap. 3.8cm width. "
  },
  {
    "id": "src-138",
    "title": "Louis Vuitton Damier Azur Canvas Wallet",
    "slug": "louis-vuitton-damier-azur-canvas-wallet-138",
    "description": "LV's iconic Damier Azur canvas compact wallet. 6 card slots. 1 ID window. Bill compartment. Cotton lining. Brass snap closure. Made in France. 11 x 9 x 2cm. A luxury everyday carry that signals taste without logos on every surface.",
    "images": [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-lvda-wllt",
    "supplierCost": 68,
    "price": 93.2,
    "compareAtPrice": 109.98,
    "sku": "LSS-LVDA-WLLT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Louis Vuitton Damier Azur Canvas Wallet",
    "seoDescription": "LV's iconic Damier Azur canvas compact wallet. 6 card slots. 1 ID window. Bill compartment. Cotton lining. Brass snap closure. Made in France. 11 x 9 x 2cm"
  },
  {
    "id": "src-139",
    "title": "Rolex Submariner Date 41mm Black Dial",
    "slug": "rolex-submariner-date-41mm-black-dial-139",
    "description": "The benchmark luxury sports watch. Rolex Submariner Date in Oystersteel. 41mm case. Black Cerachrom bezel. Black dial with luminescent markers. 300m water resistance. Oyster bracelet. Self-winding perpetual calibre 3235. Certified chronometer. A timepiece for life.",
    "images": [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
    ],
    "category": "electronics",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-rol-subd",
    "supplierCost": 148,
    "price": 200.6,
    "compareAtPrice": 236.71,
    "sku": "LSS-ROL-SUBD",
    "stock": 0,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Rolex Submariner Date 41mm Black Dial",
    "seoDescription": "The benchmark luxury sports watch. Rolex Submariner Date in Oystersteel. 41mm case. Black Cerachrom bezel. Black dial with luminescent markers. 300m water "
  },
  {
    "id": "src-140",
    "title": "Ray-Ban Wayfarer Classic Black G-15",
    "slug": "ray-ban-wayfarer-classic-black-g-15-140",
    "description": "The most recognised sunglasses in history. Ray-Ban Wayfarer Classic in black with G-15 crystal lens. Acetate frame. UV400 protection. Polarized option available. Worn by James Dean, John Lennon, and Bob Dylan. 54mm lens width. 18mm bridge.",
    "images": [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600"
    ],
    "category": "fashion",
    "supplierName": "RayBan Direct",
    "supplierUrl": "https://supplier.example.com/rbd-wfcl-blk",
    "supplierCost": 32,
    "price": 49.4,
    "compareAtPrice": 58.29,
    "sku": "RBD-WFCL-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "rayban direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Ray-Ban Wayfarer Classic Black G-15",
    "seoDescription": "The most recognised sunglasses in history. Ray-Ban Wayfarer Classic in black with G-15 crystal lens. Acetate frame. UV400 protection. Polarized option avai"
  },
  {
    "id": "src-141",
    "title": "Oakley Radar EV Path Sunglasses Polished Black",
    "slug": "oakley-radar-ev-path-sunglasses-polished-black-141",
    "description": "The pinnacle of performance eyewear. Oakley Radar EV Path with Prizm Road lens technology. O-Matter frame. Unobtainium earsocks for grip. Three-point fit. Impact resistance meets optical clarity. Worn by Tour de France winners. UV protection.",
    "images": [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600"
    ],
    "category": "sports",
    "supplierName": "SportsGear Direct",
    "supplierUrl": "https://supplier.example.com/sgd-oak-revp",
    "supplierCost": 54,
    "price": 77,
    "compareAtPrice": 90.86,
    "sku": "SGD-OAK-REVP",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "sportsgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Oakley Radar EV Path Sunglasses Polished Black",
    "seoDescription": "The pinnacle of performance eyewear. Oakley Radar EV Path with Prizm Road lens technology. O-Matter frame. Unobtainium earsocks for grip. Three-point fit. "
  },
  {
    "id": "src-142",
    "title": "Titleist Pro V1 Golf Balls Dozen",
    "slug": "titleist-pro-v1-golf-balls-dozen-142",
    "description": "The world's most popular tour golf ball. Titleist Pro V1 Dozen. 2023 model with ZG process technology for softer feel. 352 dimple pattern. Drop-and-stop control around the greens. Low long game spin. Tour performance for all skill levels.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "SportsGear Direct",
    "supplierUrl": "https://supplier.example.com/sgd-titl-prv1",
    "supplierCost": 34,
    "price": 52.4,
    "compareAtPrice": 61.83,
    "sku": "SGD-TITL-PRV1",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "sportsgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Titleist Pro V1 Golf Balls Dozen",
    "seoDescription": "The world's most popular tour golf ball. Titleist Pro V1 Dozen. 2023 model with ZG process technology for softer feel. 352 dimple pattern. Drop-and-stop co"
  },
  {
    "id": "src-143",
    "title": "Fossil Gen 6 Smartwatch Brown Leather",
    "slug": "fossil-gen-6-smartwatch-brown-leather-143",
    "description": "Wear OS smartwatch with Snapdragon Wear 4100+ processor. Fossil Gen 6 in brown leather. Health and wellness tracking. 24-hour heart rate monitoring. Blood Oxygen sensor. Fast charging — 30 minutes for 80%. Customisable watch faces. Google Assistant.",
    "images": [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
    ],
    "category": "electronics",
    "supplierName": "TechGear Direct",
    "supplierUrl": "https://supplier.example.com/tgd-fss6-brn",
    "supplierCost": 58,
    "price": 81.8,
    "compareAtPrice": 96.52,
    "sku": "TGD-FSS6-BRN",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "techgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Fossil Gen 6 Smartwatch Brown Leather",
    "seoDescription": "Wear OS smartwatch with Snapdragon Wear 4100+ processor. Fossil Gen 6 in brown leather. Health and wellness tracking. 24-hour heart rate monitoring. Blood "
  },
  {
    "id": "src-144",
    "title": "Fitbit Charge 6 Activity Tracker Black Aluminium",
    "slug": "fitbit-charge-6-activity-tracker-black-aluminium-144",
    "description": "Google's most advanced Fitbit. Charge 6 with built-in Google Maps, Google Wallet, and YouTube Music. 60+ exercise modes. Heart rate tracking. Stress management score. EDA sensor. 7-day battery. GPS tracking. Water resistant to 50m. AMOLED display.",
    "images": [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
    ],
    "category": "electronics",
    "supplierName": "TechGear Direct",
    "supplierUrl": "https://supplier.example.com/tgd-ftbt6-blk",
    "supplierCost": 44,
    "price": 63.8,
    "compareAtPrice": 75.28,
    "sku": "TGD-FTBT6-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "techgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Fitbit Charge 6 Activity Tracker Black Aluminium",
    "seoDescription": "Google's most advanced Fitbit. Charge 6 with built-in Google Maps, Google Wallet, and YouTube Music. 60+ exercise modes. Heart rate tracking. Stress manage"
  },
  {
    "id": "src-145",
    "title": "Malin+Goetz Mojito Lip Balm",
    "slug": "malin-goetz-mojito-lip-balm-145",
    "description": "Cult-favourite vegan lip balm. Malin+Goetz Mojito Lip Balm with mint and citrus. SPF 9. Clear non-sticky formula. Moisturises and protects. Recyclable packaging. 4.3g. Free from parabens, sulfates, and synthetic fragrance. A bathroom shelf essential.",
    "images": [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-mgsz-mjlb",
    "supplierCost": 7.5,
    "price": 17,
    "compareAtPrice": 20.06,
    "sku": "BT-MGSZ-MJLB",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Malin+Goetz Mojito Lip Balm",
    "seoDescription": "Cult-favourite vegan lip balm. Malin+Goetz Mojito Lip Balm with mint and citrus. SPF 9. Clear non-sticky formula. Moisturises and protects. Recyclable pack"
  },
  {
    "id": "src-146",
    "title": "Aesop Resurrection Rinse-Free Hand Wash 500ml",
    "slug": "aesop-resurrection-rinse-free-hand-wash-500ml-146",
    "description": "Luxury hand sanitiser used by the world's finest hotels. Aesop Resurrection Rinse-Free Hand Wash 500ml. Mandarin rind, rosemary leaf, and cedar atlas blend. 64% alcohol. Non-drying botanical formula. Pump dispenser. Vegan.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-aeso-rrfhw",
    "supplierCost": 24,
    "price": 39.2,
    "compareAtPrice": 46.26,
    "sku": "BT-AESO-RRFHW",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Aesop Resurrection Rinse-Free Hand Wash 500ml",
    "seoDescription": "Luxury hand sanitiser used by the world's finest hotels. Aesop Resurrection Rinse-Free Hand Wash 500ml. Mandarin rind, rosemary leaf, and cedar atlas blend"
  },
  {
    "id": "src-147",
    "title": "Dr. Barbara Sturm Hyaluronic Acid Serum",
    "slug": "dr-barbara-sturm-hyaluronic-acid-serum-147",
    "description": "Celebrity-approved luxury serum. Dr. Barbara Sturm Hyaluronic Acid Serum with short and long-chain hyaluronic acid molecules. Intensely hydrating. Plumps skin. Reduces fine lines. 30ml dropper. Suitable for all skin types. Cruelty-free.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-dbst-hase",
    "supplierCost": 64,
    "price": 90.2,
    "compareAtPrice": 106.44,
    "sku": "BT-DBST-HASE",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Dr. Barbara Sturm Hyaluronic Acid Serum",
    "seoDescription": "Celebrity-approved luxury serum. Dr. Barbara Sturm Hyaluronic Acid Serum with short and long-chain hyaluronic acid molecules. Intensely hydrating. Plumps s"
  },
  {
    "id": "src-148",
    "title": "Tatcha The Water Cream Moisturizer",
    "slug": "tatcha-the-water-cream-moisturizer-148",
    "description": "Japan's most beloved moisturiser exported globally. Tatcha The Water Cream with Japanese botanicals. Hadasei-3 complex of green tea, rice, and algae. Oil-free. Anti-oxidant rich. 60ml. For oily to combination skin. Brightens and smooths. No silicones.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-tatc-twcm",
    "supplierCost": 32,
    "price": 49.4,
    "compareAtPrice": 58.29,
    "sku": "BT-TATC-TWCM",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Tatcha The Water Cream Moisturizer",
    "seoDescription": "Japan's most beloved moisturiser exported globally. Tatcha The Water Cream with Japanese botanicals. Hadasei-3 complex of green tea, rice, and algae. Oil-f"
  },
  {
    "id": "src-149",
    "title": "Glow Recipe Watermelon Glow Niacinamide Dew Drops",
    "slug": "glow-recipe-watermelon-glow-niacinamide-dew-drops-149",
    "description": "Viral TikTok serum in a glass bottle. Glow Recipe Watermelon Dew Drops with niacinamide and hyaluronic acid. Brightens and blurs. Buildable glow. Fragrance-free. Vegan. Cruelty-free. 40ml. Best worn under or over moisturiser.",
    "images": [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-glow-wgnd",
    "supplierCost": 14.5,
    "price": 26,
    "compareAtPrice": 30.68,
    "sku": "BT-GLOW-WGND",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Glow Recipe Watermelon Glow Niacinamide Dew Drops",
    "seoDescription": "Viral TikTok serum in a glass bottle. Glow Recipe Watermelon Dew Drops with niacinamide and hyaluronic acid. Brightens and blurs. Buildable glow. Fragrance"
  },
  {
    "id": "src-150",
    "title": "Cosrx Advanced Snail 96 Mucin Power Essence",
    "slug": "cosrx-advanced-snail-96-mucin-power-essence-150",
    "description": "Korean beauty's most iconic essence. Cosrx Snail 96 Power Essence with 96% snail mucin filtrate. Deeply hydrating. Repairs damaged skin barrier. Reduces redness. Fades acne scars. 100ml. Apply before moisturiser. Fragrance-free. Lightweight texture.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-csrx-sn96",
    "supplierCost": 9,
    "price": 18.8,
    "compareAtPrice": 22.18,
    "sku": "BT-CSRX-SN96",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Cosrx Advanced Snail 96 Mucin Power Essence",
    "seoDescription": "Korean beauty's most iconic essence. Cosrx Snail 96 Power Essence with 96% snail mucin filtrate. Deeply hydrating. Repairs damaged skin barrier. Reduces re"
  },
  {
    "id": "src-151",
    "title": "Murad Retinol Youth Renewal Serum",
    "slug": "murad-retinol-youth-renewal-serum-151",
    "description": "Clinical-grade retinol for at-home use. Murad Retinol Youth Renewal Serum with tri-active retinol complex. Accelerated retinol. Accelerated retinol SA. Retinol boosters to activate the molecule. Reduces wrinkles. Improves skin texture. 30ml. Hypoallergenic.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-murd-ryrs",
    "supplierCost": 42,
    "price": 62,
    "compareAtPrice": 73.16,
    "sku": "BT-MURD-RYRS",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Murad Retinol Youth Renewal Serum",
    "seoDescription": "Clinical-grade retinol for at-home use. Murad Retinol Youth Renewal Serum with tri-active retinol complex. Accelerated retinol. Accelerated retinol SA. Ret"
  },
  {
    "id": "src-152",
    "title": "EltaMD UV Clear Broad Spectrum SPF 46",
    "slug": "eltamd-uv-clear-broad-spectrum-spf-46-152",
    "description": "Dermatologist's #1 recommended sunscreen. EltaMD UV Clear SPF 46 with niacinamide. Oil-free formula. Leaves no white cast. Non-comedogenic. For acne-prone and sensitive skin. 48ml. Zinc oxide UVA/UVB protection. Safe for rosacea.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-elmd-uvcl",
    "supplierCost": 18,
    "price": 30.8,
    "compareAtPrice": 36.34,
    "sku": "BT-ELMD-UVCL",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "EltaMD UV Clear Broad Spectrum SPF 46",
    "seoDescription": "Dermatologist's #1 recommended sunscreen. EltaMD UV Clear SPF 46 with niacinamide. Oil-free formula. Leaves no white cast. Non-comedogenic. For acne-prone "
  },
  {
    "id": "src-153",
    "title": "Paula's Choice Skin Perfecting 2% BHA Liquid Exfoliant",
    "slug": "paula-s-choice-skin-perfecting-2-bha-liquid-exfoliant-153",
    "description": "The internet's most recommended exfoliant. Paula's Choice 2% BHA with salicylic acid. Penetrates and exfoliates inside the pore. Reduces blackheads. Smooths skin texture. Minimises pores. Fragrance-free. 118ml. Use every other day to start.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-plch-2bha",
    "supplierCost": 16.5,
    "price": 28.4,
    "compareAtPrice": 33.51,
    "sku": "BT-PLCH-2BHA",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Paula's Choice Skin Perfecting 2% BHA Liquid Exfoliant",
    "seoDescription": "The internet's most recommended exfoliant. Paula's Choice 2% BHA with salicylic acid. Penetrates and exfoliates inside the pore. Reduces blackheads. Smooth"
  },
  {
    "id": "src-154",
    "title": "Cetaphil Daily Facial Cleanser Normal to Oily Skin 237ml",
    "slug": "cetaphil-daily-facial-cleanser-normal-to-oily-skin-237ml-154",
    "description": "Dermatologist and pediatrician recommended. Cetaphil Daily Facial Cleanser for normal to oily skin. Non-comedogenic. Non-irritating. Fragrance-free. Removes makeup, oil, and impurities without stripping skin. 237ml. Clinically tested. Gentle daily use.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-ceph-dflc",
    "supplierCost": 11,
    "price": 21.2,
    "compareAtPrice": 25.02,
    "sku": "BT-CEPH-DFLC",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Cetaphil Daily Facial Cleanser Normal to Oily Skin 237ml",
    "seoDescription": "Dermatologist and pediatrician recommended. Cetaphil Daily Facial Cleanser for normal to oily skin. Non-comedogenic. Non-irritating. Fragrance-free. Remove"
  },
  {
    "id": "src-155",
    "title": "Aztec Secret Indian Healing Clay 1lb",
    "slug": "aztec-secret-indian-healing-clay-1lb-155",
    "description": "The world's most powerful facial. Aztec Secret Indian Healing Clay with 100% natural calcium bentonite clay. Deep pore cleansing. Draws out impurities. Tightens pores. 1lb. Mix with apple cider vinegar for maximum results. Cruelty-free.",
    "images": [
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600"
    ],
    "category": "beauty",
    "supplierName": "BeautyTech Direct",
    "supplierUrl": "https://supplier.example.com/bt-azsc-ihcl",
    "supplierCost": 8.5,
    "price": 18.8,
    "compareAtPrice": 22.18,
    "sku": "BT-AZSC-IHCL",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "beauty",
      "beautytech direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Aztec Secret Indian Healing Clay 1lb",
    "seoDescription": "The world's most powerful facial. Aztec Secret Indian Healing Clay with 100% natural calcium bentonite clay. Deep pore cleansing. Draws out impurities. Tig"
  },
  {
    "id": "src-156",
    "title": "Alo Yoga Airlift Legging Black",
    "slug": "alo-yoga-airlift-legging-black-156",
    "description": "Studio-to-street luxury activewear. Alo Yoga Airlift Legging in black. High-waist silhouette. Airlift fabric — four-way stretch. Sweat-wicking. Compression waistband. Interior pocket. Naked sensation. 25-inch inseam. The yoga legging favoured by celebrities.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "LuluDirect Supply",
    "supplierUrl": "https://supplier.example.com/lds-alo-airl",
    "supplierCost": 42,
    "price": 62,
    "compareAtPrice": 73.16,
    "sku": "LDS-ALO-AIRL",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "luludirect supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Alo Yoga Airlift Legging Black",
    "seoDescription": "Studio-to-street luxury activewear. Alo Yoga Airlift Legging in black. High-waist silhouette. Airlift fabric — four-way stretch. Sweat-wicking. Compression"
  },
  {
    "id": "src-157",
    "title": "Vuori Performance Jogger Heather Grey",
    "slug": "vuori-performance-jogger-heather-grey-157",
    "description": "Athleisure made for life outside the gym. Vuori Performance Jogger in heather grey. Pima cotton and polyester blend. Anti-odor finish. Two side pockets and a back zip pocket. Relaxed fit. Elastic waistband with drawcord. Moisture-wicking. Made to move.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "sports",
    "supplierName": "Vuori Direct",
    "supplierUrl": "https://supplier.example.com/vd-pfmj-hgy",
    "supplierCost": 34,
    "price": 51.8,
    "compareAtPrice": 61.12,
    "sku": "VD-PFMJ-HGY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "vuori direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Vuori Performance Jogger Heather Grey",
    "seoDescription": "Athleisure made for life outside the gym. Vuori Performance Jogger in heather grey. Pima cotton and polyester blend. Anti-odor finish. Two side pockets and"
  },
  {
    "id": "src-158",
    "title": "Rhone Reign Short 7-inch Black",
    "slug": "rhone-reign-short-7-inch-black-158",
    "description": "Performance shorts for elite training. Rhone Reign Short in black. 7-inch inseam. Moisture-wicking Swift-wick fabric. Anti-odor GoldFusion Technology. Internal brief with pocket. Reflective detailing. Machine washable.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "SportsGear Direct",
    "supplierUrl": "https://supplier.example.com/sgd-rhrg-7blk",
    "supplierCost": 26,
    "price": 41.6,
    "compareAtPrice": 49.09,
    "sku": "SGD-RHRG-7BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "sportsgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Rhone Reign Short 7-inch Black",
    "seoDescription": "Performance shorts for elite training. Rhone Reign Short in black. 7-inch inseam. Moisture-wicking Swift-wick fabric. Anti-odor GoldFusion Technology. Inte"
  },
  {
    "id": "src-159",
    "title": "Patagonia Better Sweater Fleece Jacket Navy",
    "slug": "patagonia-better-sweater-fleece-jacket-navy-159",
    "description": "Responsible outdoor fleece. Patagonia Better Sweater in navy. 100% recycled polyester fleece. Zip-up collar and full zip. Set-in sleeves. Side-seam hand pockets. Straight hem. Slim fit. Fair Trade Certified sewn. Sweater-knit exterior with anti-pill finish.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-pabs-nvy",
    "supplierCost": 56,
    "price": 81.8,
    "compareAtPrice": 96.52,
    "sku": "OGD-PABS-NVY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Patagonia Better Sweater Fleece Jacket Navy",
    "seoDescription": "Responsible outdoor fleece. Patagonia Better Sweater in navy. 100% recycled polyester fleece. Zip-up collar and full zip. Set-in sleeves. Side-seam hand po"
  },
  {
    "id": "src-160",
    "title": "Columbia Silver Ridge Lite Cargo Pants",
    "slug": "columbia-silver-ridge-lite-cargo-pants-160",
    "description": "Technical hiking pants for warm-weather adventure. Columbia Silver Ridge Lite Cargo Pants. Omni-Shade UPF 50+ sun protection. Omni-Wick moisture management. Lightweight ripstop fabric. Cargo pockets. Roll-up legs convert to shorts.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "sports",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-colsr-ltcp",
    "supplierCost": 34,
    "price": 53,
    "compareAtPrice": 62.54,
    "sku": "OGD-COLSR-LTCP",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Columbia Silver Ridge Lite Cargo Pants",
    "seoDescription": "Technical hiking pants for warm-weather adventure. Columbia Silver Ridge Lite Cargo Pants. Omni-Shade UPF 50+ sun protection. Omni-Wick moisture management"
  },
  {
    "id": "src-161",
    "title": "Fjällräven Kånken Classic Backpack Ox Red",
    "slug": "fj-llr-ven-k-nken-classic-backpack-ox-red-161",
    "description": "Sweden's most iconic backpack. Fjällräven Kånken in ox red. Vinylon F fabric — water-resistant and durable. 16L capacity. Laptop sleeve. Sit pad. Top and side handles. Comfortable Kånken fit with shoulder straps and hip belt. A generational classic.",
    "images": [
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600"
    ],
    "category": "fashion",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-fjkk-oxrd",
    "supplierCost": 44,
    "price": 66.2,
    "compareAtPrice": 78.12,
    "sku": "OGD-FJKK-OXRD",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Fjällräven Kånken Classic Backpack Ox Red",
    "seoDescription": "Sweden's most iconic backpack. Fjällräven Kånken in ox red. Vinylon F fabric — water-resistant and durable. 16L capacity. Laptop sleeve. Sit pad. Top and s"
  },
  {
    "id": "src-162",
    "title": "Herschel Little America Backpack Black",
    "slug": "herschel-little-america-backpack-black-162",
    "description": "Signature striped lining and magnetic buckle closure. Herschel Little America in black. 25L capacity. Laptop sleeve. Fleece-lined sunglasses pocket. Striped textile lining. Adjustable straps. Woven label. A heritage backpack brand's most popular style.",
    "images": [
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600"
    ],
    "category": "fashion",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-hscla-blk",
    "supplierCost": 38,
    "price": 59.6,
    "compareAtPrice": 70.33,
    "sku": "OGD-HSCLA-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Herschel Little America Backpack Black",
    "seoDescription": "Signature striped lining and magnetic buckle closure. Herschel Little America in black. 25L capacity. Laptop sleeve. Fleece-lined sunglasses pocket. Stripe"
  },
  {
    "id": "src-163",
    "title": "Peak Design Everyday Backpack 20L Black",
    "slug": "peak-design-everyday-backpack-20l-black-163",
    "description": "The most thoughtfully designed camera and everyday backpack. Peak Design Everyday Backpack 20L in black. FlexFold dividers for full customisation. MagLatch closure. Side access panel. Laptop sleeve. Luggage pass-through. Weather-sealed ripstop nylon. Lifetime warranty.",
    "images": [
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600"
    ],
    "category": "electronics",
    "supplierName": "TechGear Direct",
    "supplierUrl": "https://supplier.example.com/tgd-pkdeb-20bk",
    "supplierCost": 64,
    "price": 92.6,
    "compareAtPrice": 109.27,
    "sku": "TGD-PKDEB-20BK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "electronics",
      "techgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Peak Design Everyday Backpack 20L Black",
    "seoDescription": "The most thoughtfully designed camera and everyday backpack. Peak Design Everyday Backpack 20L in black. FlexFold dividers for full customisation. MagLatch"
  },
  {
    "id": "src-164",
    "title": "Diadora B.Elite Premium Sneaker White Navy",
    "slug": "diadora-b-elite-premium-sneaker-white-navy-164",
    "description": "Italian sporting heritage. Diadora B.Elite Premium in white and navy. Full-grain leather upper. Padded tongue and collar. D-logo heel tab. OrthoLite insole. Gum rubber outsole. Classic low-top silhouette from one of Italy's most storied sports brands.",
    "images": [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-diob-whnv",
    "supplierCost": 28,
    "price": 44.6,
    "compareAtPrice": 52.63,
    "sku": "KS-DIOB-WHNV",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Diadora B.Elite Premium Sneaker White Navy",
    "seoDescription": "Italian sporting heritage. Diadora B.Elite Premium in white and navy. Full-grain leather upper. Padded tongue and collar. D-logo heel tab. OrthoLite insole"
  },
  {
    "id": "src-165",
    "title": "Li-Ning Way of Wade 11 Infinity White Gold",
    "slug": "li-ning-way-of-wade-11-infinity-white-gold-165",
    "description": "Chinese basketball legend Dwyane Wade's signature. Li-Ning WOW 11 Infinity. Full-length Li-Ning Boom cushioning. Anti-torsion plate. Premium leather and mesh upper. Gold accents. Comes in special packaging with Wade signature card. Premium performance at competitive pricing.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "sports",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-linw11-wgd",
    "supplierCost": 48,
    "price": 71,
    "compareAtPrice": 83.78,
    "sku": "KS-LINW11-WGD",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Li-Ning Way of Wade 11 Infinity White Gold",
    "seoDescription": "Chinese basketball legend Dwyane Wade's signature. Li-Ning WOW 11 Infinity. Full-length Li-Ning Boom cushioning. Anti-torsion plate. Premium leather and me"
  },
  {
    "id": "src-166",
    "title": "Reebok Question Mid White Collegiate Royal",
    "slug": "reebok-question-mid-white-collegiate-royal-166",
    "description": "Allen Iverson's first signature shoe. Reebok Question Mid in white and collegiate royal. Full-grain leather upper. Classic Reebok Hexalite hexagon cushioning in the heel. Leather toe box. 76ers-inspired colorway. A grail for Philly fans and sneaker historians.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-reqm-wcr",
    "supplierCost": 46,
    "price": 67.4,
    "compareAtPrice": 79.53,
    "sku": "KS-REQM-WCR",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Reebok Question Mid White Collegiate Royal",
    "seoDescription": "Allen Iverson's first signature shoe. Reebok Question Mid in white and collegiate royal. Full-grain leather upper. Classic Reebok Hexalite hexagon cushioni"
  },
  {
    "id": "src-167",
    "title": "Anta Kyrie Irving KT9 Black Gold",
    "slug": "anta-kyrie-irving-kt9-black-gold-167",
    "description": "Chinese sportswear brand's flagship basketball shoe. Anta KT9 with Nitroedge outsole for traction. A-FlashFoam cushioning. Figure-8 lace system. Textile and leather upper. Enhanced ankle support. Black and gold colorway.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "sports",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-antkt9-bkg",
    "supplierCost": 44,
    "price": 66.2,
    "compareAtPrice": 78.12,
    "sku": "KS-ANTKT9-BKG",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Anta Kyrie Irving KT9 Black Gold",
    "seoDescription": "Chinese sportswear brand's flagship basketball shoe. Anta KT9 with Nitroedge outsole for traction. A-FlashFoam cushioning. Figure-8 lace system. Textile an"
  },
  {
    "id": "src-168",
    "title": "Peak Performance Argon Light Puffer Jacket Black",
    "slug": "peak-performance-argon-light-puffer-jacket-black-168",
    "description": "Scandinavian lightweight puffer jacket. Peak Performance Argon Light in black. 90/10 recycled down. Ripstop face fabric. Water-resistant DWR. Fold-away hood. Slim fit silhouette. Stuffable into included stuff sack. Packable and ultralight at just 340g.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-pkpfl-blk",
    "supplierCost": 68,
    "price": 97.4,
    "compareAtPrice": 114.93,
    "sku": "OGD-PKPFL-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Peak Performance Argon Light Puffer Jacket Black",
    "seoDescription": "Scandinavian lightweight puffer jacket. Peak Performance Argon Light in black. 90/10 recycled down. Ripstop face fabric. Water-resistant DWR. Fold-away hoo"
  },
  {
    "id": "src-169",
    "title": "Represent Owners Club Hoodie Slate Grey",
    "slug": "represent-owners-club-hoodie-slate-grey-169",
    "description": "Manchester-born luxury streetwear. Represent Owners Club Hoodie in slate grey. Heavyweight 450gsm fleece. Kangaroo pocket. Embossed and printed logo. Dropped shoulders. Clean minimalist design for premium positioning. Relaxed oversized fit.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-repr-oclh",
    "supplierCost": 58,
    "price": 83.6,
    "compareAtPrice": 98.65,
    "sku": "LSS-REPR-OCLH",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Represent Owners Club Hoodie Slate Grey",
    "seoDescription": "Manchester-born luxury streetwear. Represent Owners Club Hoodie in slate grey. Heavyweight 450gsm fleece. Kangaroo pocket. Embossed and printed logo. Dropp"
  },
  {
    "id": "src-170",
    "title": "Kith Monday Program Hoodie Sage",
    "slug": "kith-monday-program-hoodie-sage-170",
    "description": "Ronnie Fieg's iconic Monday Program — a limited weekly Kith hoodie drop. Classic boxy fit. Heavyweight cotton. Embroidered Serif logo. Kangaroo pocket. Kith logo taping at hood. A collector's item that resells immediately every week.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-kith-mphs",
    "supplierCost": 62,
    "price": 88.4,
    "compareAtPrice": 104.31,
    "sku": "LSS-KITH-MPHS",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Kith Monday Program Hoodie Sage",
    "seoDescription": "Ronnie Fieg's iconic Monday Program — a limited weekly Kith hoodie drop. Classic boxy fit. Heavyweight cotton. Embroidered Serif logo. Kangaroo pocket. Kit"
  },
  {
    "id": "src-171",
    "title": "Adidas Originals Trefoil T-Shirt White",
    "slug": "adidas-originals-trefoil-t-shirt-white-171",
    "description": "Classic Adidas Originals tee with the iconic trefoil. 100% cotton. Regular fit. Screen-printed trefoil logo at chest. Crewneck. Short sleeves. The trefoil has been Adidas's logo since 1972. The definitive brand heritage tee.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "Adidas Wholesale",
    "supplierUrl": "https://supplier.example.com/aw-tref-twht",
    "supplierCost": 12,
    "price": 23,
    "compareAtPrice": 27.14,
    "sku": "AW-TREF-TWHT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "adidas wholesale"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Adidas Originals Trefoil T-Shirt White",
    "seoDescription": "Classic Adidas Originals tee with the iconic trefoil. 100% cotton. Regular fit. Screen-printed trefoil logo at chest. Crewneck. Short sleeves. The trefoil "
  },
  {
    "id": "src-172",
    "title": "Hoka Speedgoat 5 Black Castlerock",
    "slug": "hoka-speedgoat-5-black-castlerock-172",
    "description": "HOKA's most versatile trail runner. Speedgoat 5 with Vibram Megagrip outsole. 5mm multi-directional lugs. Breathable mesh upper with TPU reinforcements. 5mm stack drop. Gaiter trap. Technical terrain traction. Jay Barre's signature shoe. Built for UTMB.",
    "images": [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600"
    ],
    "category": "sports",
    "supplierName": "Hoka Supply Hub",
    "supplierUrl": "https://supplier.example.com/hsh-spgoa5-bck",
    "supplierCost": 56,
    "price": 80.6,
    "compareAtPrice": 95.11,
    "sku": "HSH-SPGOA5-BCK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "hoka supply hub"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Hoka Speedgoat 5 Black Castlerock",
    "seoDescription": "HOKA's most versatile trail runner. Speedgoat 5 with Vibram Megagrip outsole. 5mm multi-directional lugs. Breathable mesh upper with TPU reinforcements. 5m"
  },
  {
    "id": "src-173",
    "title": "New Balance Fresh Foam 1080v13 Black",
    "slug": "new-balance-fresh-foam-1080v13-black-173",
    "description": "Maximum comfort daily trainer. New Balance Fresh Foam 1080v13 with Fresh Foam X midsole. Ultra Heel design. Hypoknit upper for targeted support. OrthoLite Float insole. 10mm drop. Ideal for easy runs and recovery days.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "sports",
    "supplierName": "NB Wholesale Hub",
    "supplierUrl": "https://supplier.example.com/nb-ff1080v13-blk",
    "supplierCost": 62,
    "price": 87.8,
    "compareAtPrice": 103.6,
    "sku": "NB-FF1080V13-BLK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "nb wholesale hub"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "New Balance Fresh Foam 1080v13 Black",
    "seoDescription": "Maximum comfort daily trainer. New Balance Fresh Foam 1080v13 with Fresh Foam X midsole. Ultra Heel design. Hypoknit upper for targeted support. OrthoLite "
  },
  {
    "id": "src-174",
    "title": "Jordan Max Aura 5 Black Red",
    "slug": "jordan-max-aura-5-black-red-174",
    "description": "A streetwear spin on Jordan heritage. Jordan Max Aura 5 with Max Air heel cushioning. Leather and textile upper. Air Max units visible through outsole. Metallic Jumpman on tongue. Red and black colorway reminiscent of the Bred franchise.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-jmaur5-brd",
    "supplierCost": 44,
    "price": 65,
    "compareAtPrice": 76.7,
    "sku": "KS-JMAUR5-BRD",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Jordan Max Aura 5 Black Red",
    "seoDescription": "A streetwear spin on Jordan heritage. Jordan Max Aura 5 with Max Air heel cushioning. Leather and textile upper. Air Max units visible through outsole. Met"
  },
  {
    "id": "src-175",
    "title": "Adidas Samba OG Core Black Cloud White",
    "slug": "adidas-samba-og-core-black-cloud-white-175",
    "description": "The most-hyped sneaker since the Yeezy. Adidas Samba OG in core black with cloud white. Suede upper. Leather lining. Gum rubber outsole. Classic football-on-concrete DNA. Waffle-pattern grip outsole. T-toe overlay. Adidas's bestselling shoe of the decade.",
    "images": [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600"
    ],
    "category": "fashion",
    "supplierName": "Adidas Wholesale",
    "supplierUrl": "https://supplier.example.com/aw-samb-bcwh",
    "supplierCost": 34,
    "price": 52.4,
    "compareAtPrice": 61.83,
    "sku": "AW-SAMB-BCWH",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "adidas wholesale"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Adidas Samba OG Core Black Cloud White",
    "seoDescription": "The most-hyped sneaker since the Yeezy. Adidas Samba OG in core black with cloud white. Suede upper. Leather lining. Gum rubber outsole. Classic football-o"
  },
  {
    "id": "src-176",
    "title": "Gramicci G-Short Walnut Brown",
    "slug": "gramicci-g-short-walnut-brown-176",
    "description": "Japanese outdoor brand's most iconic piece. Gramicci G-Short in walnut brown. 100% cotton twill. Patented climbing waistband with stretch gusset. Drawstring and belt loops. Multi-pocket design. The original rock-climbing shorts adopted by streetwear.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-gram-gswb",
    "supplierCost": 32,
    "price": 50,
    "compareAtPrice": 59,
    "sku": "OGD-GRAM-GSWB",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Gramicci G-Short Walnut Brown",
    "seoDescription": "Japanese outdoor brand's most iconic piece. Gramicci G-Short in walnut brown. 100% cotton twill. Patented climbing waistband with stretch gusset. Drawstrin"
  },
  {
    "id": "src-177",
    "title": "Poler Napsack Wearable Sleeping Bag Forest Green",
    "slug": "poler-napsack-wearable-sleeping-bag-forest-green-177",
    "description": "The ultimate festival and camping companion. Poler Napsack — a sleeping bag you can wear. 4 oz ripstop shell. Footies included. Two zip pockets. Works as a sleeping bag at -7°C. Front and back zip for maximum versatility. Worn by bloggers and festival-goers worldwide.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "sports",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-polr-npsck",
    "supplierCost": 68,
    "price": 98.6,
    "compareAtPrice": 116.35,
    "sku": "OGD-POLR-NPSCK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Poler Napsack Wearable Sleeping Bag Forest Green",
    "seoDescription": "The ultimate festival and camping companion. Poler Napsack — a sleeping bag you can wear. 4 oz ripstop shell. Footies included. Two zip pockets. Works as a"
  },
  {
    "id": "src-178",
    "title": "Madhappy Los Angeles Hoodie Pacific Blue",
    "slug": "madhappy-los-angeles-hoodie-pacific-blue-178",
    "description": "The optimism brand's signature hoodie. Madhappy LA Hoodie in pacific blue. Heavyweight 500gsm French Terry. Embroidered Madhappy logo. Kangaroo pocket. Ribbed cuffs and hem. Regular fit. Mental health awareness messaging inside. A street culture phenomenon.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-madh-lahpb",
    "supplierCost": 54,
    "price": 78.2,
    "compareAtPrice": 92.28,
    "sku": "LSS-MADH-LAHPB",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Madhappy Los Angeles Hoodie Pacific Blue",
    "seoDescription": "The optimism brand's signature hoodie. Madhappy LA Hoodie in pacific blue. Heavyweight 500gsm French Terry. Embroidered Madhappy logo. Kangaroo pocket. Rib"
  },
  {
    "id": "src-179",
    "title": "Salehe Bembury Crocs Classic Clog Citrus Frequency",
    "slug": "salehe-bembury-crocs-classic-clog-citrus-frequency-179",
    "description": "The collaboration that made Crocs high fashion. Salehe Bembury x Crocs Classic Clog in Citrus Frequency. Custom wavy sole with finger-print texture. Designer Jibbitz. Limited edition colorway. Comfortable Croslite foam. A wearable art piece and investment piece.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-sbcrocs-ctf",
    "supplierCost": 28,
    "price": 44.6,
    "compareAtPrice": 52.63,
    "sku": "KS-SBCROCS-CTF",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Salehe Bembury Crocs Classic Clog Citrus Frequency",
    "seoDescription": "The collaboration that made Crocs high fashion. Salehe Bembury x Crocs Classic Clog in Citrus Frequency. Custom wavy sole with finger-print texture. Design"
  },
  {
    "id": "src-180",
    "title": "Gentle Monster Heizer Sunglasses Black",
    "slug": "gentle-monster-heizer-sunglasses-black-180",
    "description": "South Korean luxury eyewear brand loved by K-pop stars and fashion editors. Gentle Monster Heizer in black. Acetate frame. UV400 protection. Unique oversized architectural shape. Packaged in signature GM box.",
    "images": [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-gntl-hzr",
    "supplierCost": 88,
    "price": 119,
    "compareAtPrice": 140.42,
    "sku": "LSS-GNTL-HZR",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Gentle Monster Heizer Sunglasses Black",
    "seoDescription": "South Korean luxury eyewear brand loved by K-pop stars and fashion editors. Gentle Monster Heizer in black. Acetate frame. UV400 protection. Unique oversiz"
  },
  {
    "id": "src-181",
    "title": "Bottega Veneta Intrecciato Wallet Fondant",
    "slug": "bottega-veneta-intrecciato-wallet-fondant-181",
    "description": "Italian luxury leather goods. Bottega Veneta Intrecciato compact wallet in fondant (tan). Signature woven leather. 6 card slots. Bill compartment. Snap closure. Made in Italy. 11 x 9.5cm. No visible branding — the quiet luxury statement wallet.",
    "images": [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-bvint-wfon",
    "supplierCost": 84,
    "price": 114.2,
    "compareAtPrice": 134.76,
    "sku": "LSS-BVINT-WFON",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Bottega Veneta Intrecciato Wallet Fondant",
    "seoDescription": "Italian luxury leather goods. Bottega Veneta Intrecciato compact wallet in fondant (tan). Signature woven leather. 6 card slots. Bill compartment. Snap clo"
  },
  {
    "id": "src-182",
    "title": "Acne Studios Logo Cap Baseball Navy",
    "slug": "acne-studios-logo-cap-baseball-navy-182",
    "description": "Swedish fashion house's most approachable piece. Acne Studios Logo Cap in navy. Cotton twill. Adjustable strap. Embroidered logo at front. A structured crown. 6-panel construction. Understated Scandinavian luxury.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-acne-lcnvy",
    "supplierCost": 34,
    "price": 51.8,
    "compareAtPrice": 61.12,
    "sku": "LSS-ACNE-LCNVY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Acne Studios Logo Cap Baseball Navy",
    "seoDescription": "Swedish fashion house's most approachable piece. Acne Studios Logo Cap in navy. Cotton twill. Adjustable strap. Embroidered logo at front. A structured cro"
  },
  {
    "id": "src-183",
    "title": "Moose Knuckles Stirling Parka Black",
    "slug": "moose-knuckles-stirling-parka-black-183",
    "description": "Canadian luxury outerwear. Moose Knuckles Stirling Parka in black. 625 fill power duck down. Wind-resistant and water-resistant shell. Fur-trimmed hood. Two-way zipper. Banded cuffs. Side pockets. The parka for extreme Canadian winters.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-mkst-pkbk",
    "supplierCost": 138,
    "price": 192.2,
    "compareAtPrice": 226.8,
    "sku": "OGD-MKST-PKBK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Moose Knuckles Stirling Parka Black",
    "seoDescription": "Canadian luxury outerwear. Moose Knuckles Stirling Parka in black. 625 fill power duck down. Wind-resistant and water-resistant shell. Fur-trimmed hood. Tw"
  },
  {
    "id": "src-184",
    "title": "Essentials Fear of God Sweatshort Taupe",
    "slug": "essentials-fear-of-god-sweatshort-taupe-184",
    "description": "Jerry Lorenzo's essential wardrobe builder. FOG Essentials Sweatshort in taupe. Heavyweight cotton-polyester blend. Drawcord waistband. Reflective rubber logo. Relaxed fit. 5-inch inseam. Side pockets. The most versatile short in modern streetwear.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-foges-sstpe",
    "supplierCost": 28,
    "price": 44.6,
    "compareAtPrice": 52.63,
    "sku": "LSS-FOGES-SSTPE",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Essentials Fear of God Sweatshort Taupe",
    "seoDescription": "Jerry Lorenzo's essential wardrobe builder. FOG Essentials Sweatshort in taupe. Heavyweight cotton-polyester blend. Drawcord waistband. Reflective rubber l"
  },
  {
    "id": "src-185",
    "title": "Human Made Graphic T-Shirt White Duck",
    "slug": "human-made-graphic-t-shirt-white-duck-185",
    "description": "NIGO's Japanese street brand with heritage workwear DNA. Human Made Graphic Tee in white with the signature duck motif. 100% cotton. Vintage-inspired print. Regular fit. Screen-printed graphics. Made in Japan. A collector's piece from the creator of A Bathing Ape.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-hmmd-grwdk",
    "supplierCost": 38,
    "price": 57.8,
    "compareAtPrice": 68.2,
    "sku": "LSS-HMMD-GRWDK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Human Made Graphic T-Shirt White Duck",
    "seoDescription": "NIGO's Japanese street brand with heritage workwear DNA. Human Made Graphic Tee in white with the signature duck motif. 100% cotton. Vintage-inspired print"
  },
  {
    "id": "src-186",
    "title": "Nanushka Cocoon Vegan Leather Jacket Camel",
    "slug": "nanushka-cocoon-vegan-leather-jacket-camel-186",
    "description": "Sustainable luxury fashion from Budapest. Nanushka Cocoon Jacket in camel. Vegan Appleskin leather — apple waste-derived material. Cocoon silhouette. No visible closures. Clean minimalist aesthetic. Lined interior. Gentle machine wash. A luxury investment with ethical credentials.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-nanu-cocam",
    "supplierCost": 88,
    "price": 122.6,
    "compareAtPrice": 144.67,
    "sku": "LSS-NANU-COCAM",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nanushka Cocoon Vegan Leather Jacket Camel",
    "seoDescription": "Sustainable luxury fashion from Budapest. Nanushka Cocoon Jacket in camel. Vegan Appleskin leather — apple waste-derived material. Cocoon silhouette. No vi"
  },
  {
    "id": "src-187",
    "title": "Brunello Cucinelli Cashmere Crewneck Sweater Beige",
    "slug": "brunello-cucinelli-cashmere-crewneck-sweater-beige-187",
    "description": "Italian luxury knitwear at its finest. Brunello Cucinelli 100% pure cashmere crewneck in beige. Ribbed collar, cuffs, and hem. Regular fit. Made in Italy. 14-gauge knit. The most coveted cashmere on earth.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-brnc-cswb",
    "supplierCost": 124,
    "price": 165.8,
    "compareAtPrice": 195.64,
    "sku": "LSS-BRNC-CSWB",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Brunello Cucinelli Cashmere Crewneck Sweater Beige",
    "seoDescription": "Italian luxury knitwear at its finest. Brunello Cucinelli 100% pure cashmere crewneck in beige. Ribbed collar, cuffs, and hem. Regular fit. Made in Italy. "
  },
  {
    "id": "src-188",
    "title": "Maison Kitsuné Fox Head T-Shirt White",
    "slug": "maison-kitsun-fox-head-t-shirt-white-188",
    "description": "Parisian streetwear with a Tokyo twist. Maison Kitsuné Fox Head Tee in white. 100% cotton. Embroidered gold fox head at left chest. Regular fit. Made in Portugal. The signature logo of the brand founded by Gildas Loaëc and Masaya Kuroki.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-mkfh-twht",
    "supplierCost": 34,
    "price": 52.4,
    "compareAtPrice": 61.83,
    "sku": "LSS-MKFH-TWHT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Maison Kitsuné Fox Head T-Shirt White",
    "seoDescription": "Parisian streetwear with a Tokyo twist. Maison Kitsuné Fox Head Tee in white. 100% cotton. Embroidered gold fox head at left chest. Regular fit. Made in Po"
  },
  {
    "id": "src-189",
    "title": "Diemme Roccia Vet Boot Anthracite",
    "slug": "diemme-roccia-vet-boot-anthracite-189",
    "description": "Italian mountain-inspired luxury boot. Diemme Roccia Vet in anthracite. Full-grain leather upper. Vibram sole with lug tread. YKK zipper entry. Padded collar. Made in Italy. Rugged mountain DNA meets Italian craft. Worn by street style insiders in New York and Milan.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-diem-rvant",
    "supplierCost": 78,
    "price": 110.6,
    "compareAtPrice": 130.51,
    "sku": "KS-DIEM-RVANT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Diemme Roccia Vet Boot Anthracite",
    "seoDescription": "Italian mountain-inspired luxury boot. Diemme Roccia Vet in anthracite. Full-grain leather upper. Vibram sole with lug tread. YKK zipper entry. Padded coll"
  },
  {
    "id": "src-190",
    "title": "Paraboot Chambord Derby Shoe Marron",
    "slug": "paraboot-chambord-derby-shoe-marron-190",
    "description": "French luxury shoe since 1908. Paraboot Chambord Derby in marron (brown). Norwegian welted construction. Full-grain calfskin. Natural rubber sole. Double stitched welt. Handcrafted in Romans, France. Will last a lifetime with proper care. Classic and refined.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-prbt-chmb",
    "supplierCost": 92,
    "price": 128.6,
    "compareAtPrice": 151.75,
    "sku": "KS-PRBT-CHMB",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Paraboot Chambord Derby Shoe Marron",
    "seoDescription": "French luxury shoe since 1908. Paraboot Chambord Derby in marron (brown). Norwegian welted construction. Full-grain calfskin. Natural rubber sole. Double s"
  },
  {
    "id": "src-191",
    "title": "Dr. Martens 1460 Patent Leather Boot Black",
    "slug": "dr-martens-1460-patent-leather-boot-black-191",
    "description": "The most iconic punk boot in history. Dr. Martens 1460 in black patent leather. AirWair sole with bounce. Goodyear welt construction. Grooved sides. Stitched in yellow. 8 eyelets. Pull tab with AirWair logo. Since 1960. Vegan Friendly patent option available.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-drm1460-bpt",
    "supplierCost": 46,
    "price": 69.8,
    "compareAtPrice": 82.36,
    "sku": "KS-DRM1460-BPT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Dr. Martens 1460 Patent Leather Boot Black",
    "seoDescription": "The most iconic punk boot in history. Dr. Martens 1460 in black patent leather. AirWair sole with bounce. Goodyear welt construction. Grooved sides. Stitch"
  },
  {
    "id": "src-192",
    "title": "Birkenstocks Boston Clog Oiled Leather Habana",
    "slug": "birkenstocks-boston-clog-oiled-leather-habana-192",
    "description": "The most sought-after clog in streetwear. Birkenstock Boston in habana oiled leather. Contoured cork footbed. Adjustable buckle. Natural latex padding. Suede lining. Habana — a rich warm tan that ages beautifully. Worn by Dua Lipa and featured in Vogue.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-bkst-boscl",
    "supplierCost": 48,
    "price": 71,
    "compareAtPrice": 83.78,
    "sku": "KS-BKST-BOSCL",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Birkenstocks Boston Clog Oiled Leather Habana",
    "seoDescription": "The most sought-after clog in streetwear. Birkenstock Boston in habana oiled leather. Contoured cork footbed. Adjustable buckle. Natural latex padding. Sue"
  },
  {
    "id": "src-193",
    "title": "UGG Classic Short Boot Chestnut",
    "slug": "ugg-classic-short-boot-chestnut-193",
    "description": "The world's most popular comfort boot. UGG Classic Short in chestnut. Grade A twinface sheepskin upper. Sheepskin insole for moisture management. Lightweight and flexible outsole. 7.5-inch shaft height. Seam-sealed construction. A California beach original turned global icon.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-ugg-clshch",
    "supplierCost": 58,
    "price": 84.8,
    "compareAtPrice": 100.06,
    "sku": "KS-UGG-CLSHCH",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "UGG Classic Short Boot Chestnut",
    "seoDescription": "The world's most popular comfort boot. UGG Classic Short in chestnut. Grade A twinface sheepskin upper. Sheepskin insole for moisture management. Lightweig"
  },
  {
    "id": "src-194",
    "title": "Loewe Puzzle Bag Mini Black Calfskin",
    "slug": "loewe-puzzle-bag-mini-black-calfskin-194",
    "description": "Spanish luxury leather goods at their finest. Loewe Puzzle Bag Mini in black calfskin. Jonathan Anderson's signature puzzle-cut design. Multiple ways to wear — shoulder strap, cross-body, handheld. Fully lined. Made in Spain. 24 x 10.5 x 16cm.",
    "images": [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-loew-pzbmn",
    "supplierCost": 138,
    "price": 185,
    "compareAtPrice": 218.3,
    "sku": "LSS-LOEW-PZBMN",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Loewe Puzzle Bag Mini Black Calfskin",
    "seoDescription": "Spanish luxury leather goods at their finest. Loewe Puzzle Bag Mini in black calfskin. Jonathan Anderson's signature puzzle-cut design. Multiple ways to we"
  },
  {
    "id": "src-195",
    "title": "Toteme N Scarf Coat Dark Brown",
    "slug": "toteme-n-scarf-coat-dark-brown-195",
    "description": "Stockholm's most copied coat silhouette. Totême Scarf Coat in dark brown double-face wool. Built-in scarf detail at neck. A-line silhouette. Hidden front buttons. Side pockets. Fully lined. Dry clean only. The Scandinavian fashion item that broke the internet in 2022.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-totm-scfct",
    "supplierCost": 118,
    "price": 163.4,
    "compareAtPrice": 192.81,
    "sku": "LSS-TOTM-SCFCT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Toteme N Scarf Coat Dark Brown",
    "seoDescription": "Stockholm's most copied coat silhouette. Totême Scarf Coat in dark brown double-face wool. Built-in scarf detail at neck. A-line silhouette. Hidden front b"
  },
  {
    "id": "src-196",
    "title": "Stray Rats Rat Logo Cap Black",
    "slug": "stray-rats-rat-logo-cap-black-196",
    "description": "New York underground streetwear. Stray Rats Rat Logo Cap in black. Structured 6-panel. Embroidered rat logo at front. Adjustable strap. Heavy cotton twill. A cult favourite among downtown NYC creatives and skaters.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-srts-rlcbk",
    "supplierCost": 18,
    "price": 30.8,
    "compareAtPrice": 36.34,
    "sku": "LSS-SRTS-RLCBK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Stray Rats Rat Logo Cap Black",
    "seoDescription": "New York underground streetwear. Stray Rats Rat Logo Cap in black. Structured 6-panel. Embroidered rat logo at front. Adjustable strap. Heavy cotton twill."
  },
  {
    "id": "src-197",
    "title": "Pangaia Flwrdwn Puffer Jacket Blueberry",
    "slug": "pangaia-flwrdwn-puffer-jacket-blueberry-197",
    "description": "Plant-based luxury puffer. Pangaia Flwrdwn Puffer in blueberry. Seaweed-based FLWRDWN fill — sustainable alternative to animal down. Durable Water Repellent finish. Ribbed cuffs. Drop-tail hem. Chest logo. Packable. B Corp certified brand.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-pngf-pjbb",
    "supplierCost": 82,
    "price": 116.6,
    "compareAtPrice": 137.59,
    "sku": "OGD-PNGF-PJBB",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Pangaia Flwrdwn Puffer Jacket Blueberry",
    "seoDescription": "Plant-based luxury puffer. Pangaia Flwrdwn Puffer in blueberry. Seaweed-based FLWRDWN fill — sustainable alternative to animal down. Durable Water Repellen"
  },
  {
    "id": "src-198",
    "title": "Snow Peak Titanium Single Wall Cup 450ml",
    "slug": "snow-peak-titanium-single-wall-cup-450ml-198",
    "description": "Japanese outdoor precision. Snow Peak Titanium Single Wall Cup 450ml. Ultra-lightweight at 82g. Seamless construction. Foldable handles. Nesting compatible. 10-year warranty. Handcrafted in Sanjo, Japan. The grail cup for ultralight campers.",
    "images": [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600"
    ],
    "category": "sports",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-snpk-tc450",
    "supplierCost": 28,
    "price": 44,
    "compareAtPrice": 51.92,
    "sku": "OGD-SNPK-TC450",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Snow Peak Titanium Single Wall Cup 450ml",
    "seoDescription": "Japanese outdoor precision. Snow Peak Titanium Single Wall Cup 450ml. Ultra-lightweight at 82g. Seamless construction. Foldable handles. Nesting compatible"
  },
  {
    "id": "src-199",
    "title": "Palmes Tennis Club Padded Jacket Forest Green",
    "slug": "palmes-tennis-club-padded-jacket-forest-green-199",
    "description": "Scandinavian tennis club culture translated into fashion. Palmes Tennis Club Padded Jacket in forest green. Lightweight padding. Branded chest embroidery. Snap buttons. Side pockets. Clean preppy aesthetic with ironic sportswear branding. A Copenhagen fashion week staple.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-plms-tcpfg",
    "supplierCost": 64,
    "price": 91.4,
    "compareAtPrice": 107.85,
    "sku": "LSS-PLMS-TCPFG",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Palmes Tennis Club Padded Jacket Forest Green",
    "seoDescription": "Scandinavian tennis club culture translated into fashion. Palmes Tennis Club Padded Jacket in forest green. Lightweight padding. Branded chest embroidery. "
  },
  {
    "id": "src-200",
    "title": "Sporty and Rich Wellness Hoodie Cream Pink",
    "slug": "sporty-and-rich-wellness-hoodie-cream-pink-200",
    "description": "Emily Obert's healthy lifestyle brand. Sporty and Rich Wellness Hoodie in cream with pink script. Heavyweight cotton fleece. Relaxed oversized fit. Kangaroo pocket. Ribbed hem. The hoodie that defined the 2021 it-girl aesthetic.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-sprc-wlhcp",
    "supplierCost": 48,
    "price": 70.4,
    "compareAtPrice": 83.07,
    "sku": "LSS-SPRC-WLHCP",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Sporty and Rich Wellness Hoodie Cream Pink",
    "seoDescription": "Emily Obert's healthy lifestyle brand. Sporty and Rich Wellness Hoodie in cream with pink script. Heavyweight cotton fleece. Relaxed oversized fit. Kangaro"
  },
  {
    "id": "src-201",
    "title": "Miu Miu Washed Denim Mini Skirt Blue",
    "slug": "miu-miu-washed-denim-mini-skirt-blue-201",
    "description": "The viral mini skirt that defined 2022-2024 fashion. Miu Miu Washed Denim Mini Skirt in faded blue. Low-rise. Front pockets. Iconic Miu Miu logo waistband detail. Zip fly with button. Made in Italy. The most photographed item of the fashion decade.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-miumi-wsdn",
    "supplierCost": 68,
    "price": 96.2,
    "compareAtPrice": 113.52,
    "sku": "LSS-MIUMI-WSDN",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Miu Miu Washed Denim Mini Skirt Blue",
    "seoDescription": "The viral mini skirt that defined 2022-2024 fashion. Miu Miu Washed Denim Mini Skirt in faded blue. Low-rise. Front pockets. Iconic Miu Miu logo waistband "
  },
  {
    "id": "src-202",
    "title": "Cotopaxi Fuego Down Jacket Tecu",
    "slug": "cotopaxi-fuego-down-jacket-tecu-202",
    "description": "Sustainable outdoor brand with a mission. Cotopaxi Fuego Down 800-fill in Tecu (terracotta). 100% recycled materials. Certified Responsible Down Standard. Zippered pockets. Elastic cuffs. 1% for the Planet. Gear for good. Lightweight at 255g.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "sports",
    "supplierName": "OutdoorGear Direct",
    "supplierUrl": "https://supplier.example.com/ogd-cotf-jtcu",
    "supplierCost": 72,
    "price": 102.2,
    "compareAtPrice": 120.6,
    "sku": "OGD-COTF-JTCU",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "outdoorgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Cotopaxi Fuego Down Jacket Tecu",
    "seoDescription": "Sustainable outdoor brand with a mission. Cotopaxi Fuego Down 800-fill in Tecu (terracotta). 100% recycled materials. Certified Responsible Down Standard. "
  },
  {
    "id": "src-203",
    "title": "Rapha Classic Bib Shorts Black",
    "slug": "rapha-classic-bib-shorts-black-203",
    "description": "The most celebrated cycling shorts in road cycling. Rapha Classic Bib Shorts in black. 245gsm Mura fabric. 8-panel construction. Rapha chamois. Stash pocket. Gripper hems. Minimal branding. Chosen by pro cyclists and weekend warriors alike.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "SportsGear Direct",
    "supplierUrl": "https://supplier.example.com/sgd-raph-cbbs",
    "supplierCost": 74,
    "price": 102.8,
    "compareAtPrice": 121.3,
    "sku": "SGD-RAPH-CBBS",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "sportsgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Rapha Classic Bib Shorts Black",
    "seoDescription": "The most celebrated cycling shorts in road cycling. Rapha Classic Bib Shorts in black. 245gsm Mura fabric. 8-panel construction. Rapha chamois. Stash pocke"
  },
  {
    "id": "src-204",
    "title": "Castore Teamwear Training Top Black",
    "slug": "castore-teamwear-training-top-black-204",
    "description": "Premium athletic brand founded by former pro tennis players. Castore Training Top in black. Lightweight MicroCool fabric. 4-way stretch. Moisture-wicking. UPF 30+ protection. Slim athletic fit. Worn by McLaren F1 and England Cricket teams.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "SportsGear Direct",
    "supplierUrl": "https://supplier.example.com/sgd-cast-trntop",
    "supplierCost": 38,
    "price": 57.2,
    "compareAtPrice": 67.5,
    "sku": "SGD-CAST-TRNTOP",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "sportsgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Castore Teamwear Training Top Black",
    "seoDescription": "Premium athletic brand founded by former pro tennis players. Castore Training Top in black. Lightweight MicroCool fabric. 4-way stretch. Moisture-wicking. "
  },
  {
    "id": "src-205",
    "title": "The Row Margaux Bag Black Calfskin",
    "slug": "the-row-margaux-bag-black-calfskin-205",
    "description": "The pinnacle of quiet luxury. The Row Margaux 15 bag in black calfskin. Clean architectural shape. Interior zip pocket. Top handle and shoulder strap. Made in Italy. The bag that made Mary-Kate and Ashley Olsen fashion's most respected designers.",
    "images": [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-thro-mgx15",
    "supplierCost": 144,
    "price": 194.6,
    "compareAtPrice": 229.63,
    "sku": "LSS-THRO-MGX15",
    "stock": 0,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "The Row Margaux Bag Black Calfskin",
    "seoDescription": "The pinnacle of quiet luxury. The Row Margaux 15 bag in black calfskin. Clean architectural shape. Interior zip pocket. Top handle and shoulder strap. Made"
  },
  {
    "id": "src-206",
    "title": "Loro Piana Babouche Cashmere Slippers Camel",
    "slug": "loro-piana-babouche-cashmere-slippers-camel-206",
    "description": "Italian cashmere excellence for the home. Loro Piana Babouche Slippers in camel cashmere. 100% pure cashmere upper. Natural rubber sole. Hand-crafted. Pull-on silhouette. The luxury loungewear gift chosen by the world's most discerning gift-givers.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-lopb-scam",
    "supplierCost": 128,
    "price": 170.6,
    "compareAtPrice": 201.31,
    "sku": "LSS-LOPB-SCAM",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Loro Piana Babouche Cashmere Slippers Camel",
    "seoDescription": "Italian cashmere excellence for the home. Loro Piana Babouche Slippers in camel cashmere. 100% pure cashmere upper. Natural rubber sole. Hand-crafted. Pull"
  },
  {
    "id": "src-207",
    "title": "New Era 59FIFTY Yankees Fitted Cap Navy",
    "slug": "new-era-59fifty-yankees-fitted-cap-navy-207",
    "description": "The official on-field cap of Major League Baseball. New Era 59FIFTY Yankees in navy. 100% wool. Structured crown. On-field logo. Embroidered NY logo. Fitted — order your exact size. The cap that defines New York street culture.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-neray-nvy",
    "supplierCost": 22,
    "price": 36.8,
    "compareAtPrice": 43.42,
    "sku": "KS-NERAY-NVY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "New Era 59FIFTY Yankees Fitted Cap Navy",
    "seoDescription": "The official on-field cap of Major League Baseball. New Era 59FIFTY Yankees in navy. 100% wool. Structured crown. On-field logo. Embroidered NY logo. Fitte"
  },
  {
    "id": "src-208",
    "title": "Kenzo Flower Logo Oversized Tee Black",
    "slug": "kenzo-flower-logo-oversized-tee-black-208",
    "description": "Paris-Tokyo creative fusion. Kenzo Flower Logo Oversized Tee in black. 100% cotton. Embroidered floral Kenzo logo at chest. Oversized dropped shoulders. Short sleeves. Made in Portugal. The hybrid East-West luxury streetwear brand's most approachable piece.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-knzo-flot",
    "supplierCost": 44,
    "price": 65,
    "compareAtPrice": 76.7,
    "sku": "LSS-KNZO-FLOT",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Kenzo Flower Logo Oversized Tee Black",
    "seoDescription": "Paris-Tokyo creative fusion. Kenzo Flower Logo Oversized Tee in black. 100% cotton. Embroidered floral Kenzo logo at chest. Oversized dropped shoulders. Sh"
  },
  {
    "id": "src-209",
    "title": "Givenchy 4G Logo Hoodie Black",
    "slug": "givenchy-4g-logo-hoodie-black-209",
    "description": "Luxury French fashion. Givenchy 4G Logo Hoodie in black. Embroidered 4G logo at chest. Drawstring hood. Kangaroo pocket. Relaxed fit. 100% cotton French Terry. Made in Portugal. The accessible entry point to Nicolas Di Felice's house vision.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-givnc-4glh",
    "supplierCost": 74,
    "price": 103.4,
    "compareAtPrice": 122.01,
    "sku": "LSS-GIVNC-4GLH",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Givenchy 4G Logo Hoodie Black",
    "seoDescription": "Luxury French fashion. Givenchy 4G Logo Hoodie in black. Embroidered 4G logo at chest. Drawstring hood. Kangaroo pocket. Relaxed fit. 100% cotton French Te"
  },
  {
    "id": "src-210",
    "title": "Moncler Maya Lightweight Down Jacket Black",
    "slug": "moncler-maya-lightweight-down-jacket-black-210",
    "description": "Luxury French-Italian outerwear. Moncler Maya 70 Lightweight Down Jacket in black. 90/10 down fill. Lisco Nylon shell. Packable down jacket. Banded hem and cuffs. Two zipped hand pockets. Moncler logo badge. Made in Romania.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-mncl-mayjk",
    "supplierCost": 148,
    "price": 204.2,
    "compareAtPrice": 240.96,
    "sku": "LSS-MNCL-MAYJK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Moncler Maya Lightweight Down Jacket Black",
    "seoDescription": "Luxury French-Italian outerwear. Moncler Maya 70 Lightweight Down Jacket in black. 90/10 down fill. Lisco Nylon shell. Packable down jacket. Banded hem and"
  },
  {
    "id": "src-211",
    "title": "Hermès Clic Clac H Bracelet Black",
    "slug": "herm-s-clic-clac-h-bracelet-black-211",
    "description": "Entry-level Hermès luxury. Clic Clac H Bracelet in black enamel with palladium hardware. Pop-on closure. Enamel on palladium. 2cm width. Made in France. The piece that opens the door to the world's most exclusive luxury house.",
    "images": [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-hrms-cchbk",
    "supplierCost": 128,
    "price": 168.2,
    "compareAtPrice": 198.48,
    "sku": "LSS-HRMS-CCHBK",
    "stock": 0,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Hermès Clic Clac H Bracelet Black",
    "seoDescription": "Entry-level Hermès luxury. Clic Clac H Bracelet in black enamel with palladium hardware. Pop-on closure. Enamel on palladium. 2cm width. Made in France. Th"
  },
  {
    "id": "src-212",
    "title": "Norda 001 Trail Running Shoe Blue",
    "slug": "norda-001-trail-running-shoe-blue-212",
    "description": "The world's most sustainable trail running shoe. Norda 001 with Dyneema upper — the world's strongest fiber. GORE-TEX waterproofing. Vibram Litebase megagrip outsole. Ortholite Float insole. Made in Canada. A luxury trail shoe for those who want the best.",
    "images": [
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600"
    ],
    "category": "sports",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-nord001-blu",
    "supplierCost": 118,
    "price": 161,
    "compareAtPrice": 189.98,
    "sku": "KS-NORD001-BLU",
    "stock": 0,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Norda 001 Trail Running Shoe Blue",
    "seoDescription": "The world's most sustainable trail running shoe. Norda 001 with Dyneema upper — the world's strongest fiber. GORE-TEX waterproofing. Vibram Litebase megagr"
  },
  {
    "id": "src-213",
    "title": "COS Relaxed Fit Cargo Trousers Khaki",
    "slug": "cos-relaxed-fit-cargo-trousers-khaki-213",
    "description": "Scandinavian minimalism with utility detail. COS Relaxed Cargo Trousers in khaki. Woven cotton-blend fabric. Side cargo pockets. Elastic waistband. Drawstring ankles. Relaxed straight fit. Clean, unfussy design for maximum wearability.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-cosrcg-khk",
    "supplierCost": 42,
    "price": 62.6,
    "compareAtPrice": 73.87,
    "sku": "LSS-COSRCG-KHK",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "COS Relaxed Fit Cargo Trousers Khaki",
    "seoDescription": "Scandinavian minimalism with utility detail. COS Relaxed Cargo Trousers in khaki. Woven cotton-blend fabric. Side cargo pockets. Elastic waistband. Drawstr"
  },
  {
    "id": "src-214",
    "title": "Asics Gel-Kayano 30 Midnight",
    "slug": "asics-gel-kayano-30-midnight-214",
    "description": "Asics' most supportive daily trainer. Gel-Kayano 30 in midnight. Dual-density stability. FF BLAST+ CUSHIONING. Dynamic DuoMax Support System. Engineered knit upper. LITETRUSS support structure. 10mm drop. For mild to moderate overpronation.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "sports",
    "supplierName": "ASICS Supply Japan",
    "supplierUrl": "https://supplier.example.com/asj-gkn30-mid",
    "supplierCost": 58,
    "price": 83,
    "compareAtPrice": 97.94,
    "sku": "ASJ-GKN30-MID",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "asics supply japan"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Asics Gel-Kayano 30 Midnight",
    "seoDescription": "Asics' most supportive daily trainer. Gel-Kayano 30 in midnight. Dual-density stability. FF BLAST+ CUSHIONING. Dynamic DuoMax Support System. Engineered kn"
  },
  {
    "id": "src-215",
    "title": "Undercover Jun Takahashi Graphic Tee White",
    "slug": "undercover-jun-takahashi-graphic-tee-white-215",
    "description": "Tokyo avant-garde. Undercover by Jun Takahashi graphic tee in white. Subtle screen-printed punk-inspired graphic. 100% cotton. Relaxed fit. Made in Japan. Limited seasonal production. A piece that blurs the line between fashion and art.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-undcv-grte",
    "supplierCost": 52,
    "price": 75.8,
    "compareAtPrice": 89.44,
    "sku": "LSS-UNDCV-GRTE",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Undercover Jun Takahashi Graphic Tee White",
    "seoDescription": "Tokyo avant-garde. Undercover by Jun Takahashi graphic tee in white. Subtle screen-printed punk-inspired graphic. 100% cotton. Relaxed fit. Made in Japan. "
  },
  {
    "id": "src-216",
    "title": "Reigning Champ Core Crewneck Navy",
    "slug": "reigning-champ-core-crewneck-navy-216",
    "description": "Vancouver-made premium athletic knitwear. Reigning Champ Core Crewneck in navy. 380gsm cotton fleece. Brushed interior. Ribbed collar, cuffs, and hem. Embroidered RC logo. Slim athletic fit. The crewneck that athletes and streetwear fans reach for daily.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-rchp-ccnvy",
    "supplierCost": 56,
    "price": 81.2,
    "compareAtPrice": 95.82,
    "sku": "LSS-RCHP-CCNVY",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Reigning Champ Core Crewneck Navy",
    "seoDescription": "Vancouver-made premium athletic knitwear. Reigning Champ Core Crewneck in navy. 380gsm cotton fleece. Brushed interior. Ribbed collar, cuffs, and hem. Embr"
  },
  {
    "id": "src-217",
    "title": "John Smedley Lundy Merino Polo Natural",
    "slug": "john-smedley-lundy-merino-polo-natural-217",
    "description": "Finest merino wool polos from England's oldest factory. John Smedley Lundy Polo in natural white. 100% Merino wool. Ultra-fine 30-gauge knit. Regular fit. Classic polo collar. Three-button placket. Made in Matlock, Derbyshire since 1784. A quiet luxury hallmark.",
    "images": [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"
    ],
    "category": "fashion",
    "supplierName": "LuxeStreet Supply",
    "supplierUrl": "https://supplier.example.com/lss-jsmed-lnpn",
    "supplierCost": 62,
    "price": 87.8,
    "compareAtPrice": 103.6,
    "sku": "LSS-JSMED-LNPN",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "luxestreet supply"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "John Smedley Lundy Merino Polo Natural",
    "seoDescription": "Finest merino wool polos from England's oldest factory. John Smedley Lundy Polo in natural white. 100% Merino wool. Ultra-fine 30-gauge knit. Regular fit. "
  },
  {
    "id": "src-218",
    "title": "Nike Killshot 2 Leather Court White Navy Gum",
    "slug": "nike-killshot-2-leather-court-white-navy-gum-218",
    "description": "Nike's cult tennis-court-to-street sneaker. Killshot 2 in white, navy, and gum. Leather upper. Perforated toe cap. Foam-padded collar. Gum rubber outsole. Understated Swoosh. A stealth pick for the sneaker purist. Limited seasonal availability.",
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
    ],
    "category": "fashion",
    "supplierName": "KickSupply Direct",
    "supplierUrl": "https://supplier.example.com/ks-nkks2-wng",
    "supplierCost": 36,
    "price": 54.8,
    "compareAtPrice": 64.66,
    "sku": "KS-NKKS2-WNG",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "kicksupply direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Nike Killshot 2 Leather Court White Navy Gum",
    "seoDescription": "Nike's cult tennis-court-to-street sneaker. Killshot 2 in white, navy, and gum. Leather upper. Perforated toe cap. Foam-padded collar. Gum rubber outsole. "
  },
  {
    "id": "src-219",
    "title": "Adidas Spezial SPZL Handball Spezial Blue Gum",
    "slug": "adidas-spezial-spzl-handball-spezial-blue-gum-219",
    "description": "The SPZL line — Adidas Originals archive reimagined. Handball Spezial SPZL in blue gum. Suede and nylon upper. Tonal lacing. Adilight-PRIMEGREEN recycled materials. The collector's version of the most-hyped Adidas release of recent years.",
    "images": [
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600"
    ],
    "category": "fashion",
    "supplierName": "Adidas Wholesale",
    "supplierUrl": "https://supplier.example.com/aw-spzl-hbspzl",
    "supplierCost": 38,
    "price": 57.8,
    "compareAtPrice": 68.2,
    "sku": "AW-SPZL-HBSPZL",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "fashion",
      "adidas wholesale"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Adidas Spezial SPZL Handball Spezial Blue Gum",
    "seoDescription": "The SPZL line — Adidas Originals archive reimagined. Handball Spezial SPZL in blue gum. Suede and nylon upper. Tonal lacing. Adilight-PRIMEGREEN recycled m"
  },
  {
    "id": "src-220",
    "title": "Satisfy Running Long Distance Tee Trail White",
    "slug": "satisfy-running-long-distance-tee-trail-white-220",
    "description": "The French brand for serious runners. Satisfy Long Distance Tee in white. Ultra-lightweight 80gsm jersey. Moth-eat texture for visual interest and airflow. Regular fit. Flatlock seams. Quick-dry. Available in earthy and trail-inspired colorways.",
    "images": [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ],
    "category": "sports",
    "supplierName": "SportsGear Direct",
    "supplierUrl": "https://supplier.example.com/sgd-satfy-ldtw",
    "supplierCost": 46,
    "price": 68,
    "compareAtPrice": 80.24,
    "sku": "SGD-SATFY-LDTW",
    "stock": 100,
    "shippingTime": "7-14 business days",
    "tags": [
      "sports",
      "sportsgear direct"
    ],
    "featured": false,
    "active": true,
    "seoTitle": "Satisfy Running Long Distance Tee Trail White",
    "seoDescription": "The French brand for serious runners. Satisfy Long Distance Tee in white. Ultra-lightweight 80gsm jersey. Moth-eat texture for visual interest and airflow."
  }
];
