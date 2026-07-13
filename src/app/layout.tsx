import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/CartProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const siteUrl = "https://www.marketvibe1.com";
const siteTitle = "MarketVibe | Buyer-Intent Market Intelligence";
const siteDescription =
  "Review buyer-intent market signals with source context, fit notes, and a simple Proof Pack starting point for agencies, consultants, and growth teams.";
const previewImage = "/marketvibe-email-preview.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | MarketVibe",
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "MarketVibe",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: previewImage,
        width: 1200,
        height: 630,
        alt: "MarketVibe Proof Pack preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [previewImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
