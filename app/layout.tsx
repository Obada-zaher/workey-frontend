import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Tajawal } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-english", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const tajawal = Tajawal({ variable: "--font-tajawal", subsets: ["arabic"], weight: ["400", "500", "700", "800"], display: "swap" });

const themeInitialization = `(function(){try{var theme=localStorage.getItem('workey-theme');if(theme==='light'||theme==='dark'){document.documentElement.dataset.theme=theme;}else{delete document.documentElement.dataset.theme;}}catch(e){}})();`;

export const metadata: Metadata = { title: "Workey | Discover your next opportunity", description: "Discover public opportunities and build your professional path with Workey.", openGraph: { title: "Workey | Discover your next opportunity", description: "A modern public job-seeker experience." } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${tajawal.variable}`}><body><Script id="workey-theme-initialization" strategy="beforeInteractive">{themeInitialization}</Script>{children}</body></html>;
}
