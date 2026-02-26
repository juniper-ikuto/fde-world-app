import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "FDE World — Every FDE, SE and Solutions role. One place.",
  description:
    "The community for Forward Deployed Engineers, Solutions Engineers, and client-facing technical talent. 1,600+ open roles from Greenhouse, Lever, Ashby and more — updated daily.",
  metadataBase: new URL("https://www.fdeworld.com"),
  alternates: { canonical: "https://www.fdeworld.com" },
  openGraph: {
    title: "FDE World — Every FDE, SE and Solutions role. One place.",
    description: "The community for Forward Deployed Engineers, Solutions Engineers, and client-facing technical talent. 1,600+ open roles updated daily.",
    url: "https://www.fdeworld.com",
    siteName: "FDE World",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "FDE World" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FDE World — Every FDE, SE and Solutions role. One place.",
    description: "The community for FDEs and SEs. 1,600+ open roles updated daily.",
    images: ["/opengraph-image"],
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
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "FDE World",
              url: "https://www.fdeworld.com",
              description: "The community for Forward Deployed Engineers, Solutions Engineers, and client-facing technical talent. Curated job listings updated daily.",
              publisher: {
                "@type": "Organization",
                name: "Ikuto Group",
                url: "https://www.ikutogroup.com",
              },
              potentialAction: {
                "@type": "SearchAction",
                target: "https://www.fdeworld.com/feed?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
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
