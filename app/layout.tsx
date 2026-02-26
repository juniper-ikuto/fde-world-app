import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "FDE World — The community for Forward Deployed Engineers",
  description:
    "The definitive community for Forward Deployed Engineers, Solutions Engineers, and client-facing technical talent. 1,600+ open roles updated daily.",
  openGraph: {
    title: "FDE World",
    description:
      "The definitive community for Forward Deployed Engineers, Solutions Engineers, and client-facing technical talent. 1,600+ open roles updated daily.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Runs before paint — prevents flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'){document.documentElement.dataset.theme='dark'}}catch(e){}})()`,
          }}
        />
        {/* Umami analytics — privacy-first, no cookies */}
        <script
          async
          src="https://umami-production-e13e.up.railway.app/script.js"
          data-website-id="7637b1a8-b348-4d69-b326-9fb94da25cf6"
        />
      </head>
      <body className="font-sans bg-bg-primary text-text-primary min-h-screen">
        {children}
      </body>
    </html>
  );
}
