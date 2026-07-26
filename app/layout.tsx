import type { Metadata, Viewport } from "next";
import AccessibilityMenu from "./AccessibilityMenu";
import LanguageController from "./LanguageController";
import profile from "../data/machine-profile.json";
import "./globals.css";

const canonicalBase = profile.person.homeUrl.replace(/\/$/, "");
const personId = `${canonicalBase}/serkon#person`;

export const metadata: Metadata = {
  metadataBase: new URL(canonicalBase),
  title: "Serkon 侯世康｜个人主页与作品档案",
  description: "Serkon 是侯世康长期使用的网络身份与创作名。这里记录他的 AI 创作、视觉作品、个人项目与成长。",
  alternates: { canonical: "/", types: { "application/rss+xml": "/feed.xml" } },
  applicationName: "Serkon 侯世康",
  authors: [{ name: "侯世康（Serkon）", url: "/serkon" }],
  creator: "Serkon 侯世康",
  category: "个人作品集",
  keywords: ["Serkon", "侯世康", "Serkon 侯世康", "侯世康 Serkon", "AI 创作", "个人网站", "视觉作品"],
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Serkon 侯世康｜个人主页与作品档案",
    description: "Serkon 是侯世康长期使用的网络身份与创作名。认识他的 AI 创作、作品与个人项目。",
    url: "/",
    siteName: "Serkon 侯世康",
    locale: "zh_CN",
    alternateLocale: ["en_US"],
    type: "website",
    images: [
      {
        url: "/serkon-share.jpg",
        width: 1200,
        height: 630,
        alt: "Serkon 侯世康",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Serkon 侯世康｜个人主页与作品档案",
    description: "Serkon 是侯世康长期使用的网络身份与创作名。",
    images: ["/serkon-share.jpg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f0e7",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": `${canonicalBase}/#website`,
              url: `${canonicalBase}/`,
              name: "Serkon 侯世康",
              alternateName: ["Serkon", "侯世康个人主页"],
              inLanguage: ["zh-CN", "en"],
              author: {
                "@type": "Person",
                "@id": personId,
                name: profile.person.name,
                alternateName: profile.person.alternateName,
                url: profile.person.profileUrl,
              },
            }).replaceAll("<", "\\u003c"),
          }}
        />
      </head>
      <body>
        {children}
        <LanguageController />
        <AccessibilityMenu />
      </body>
    </html>
  );
}
