import type { Metadata } from "next";
import "./globals.css";
import { templateStylePaths } from "@/constants/templateAssets";

export const metadata: Metadata = {
  title: "Habibi RSVP - Powered by Next.js",
  description:
    "Wedding landing page cloned from the Habibi theme with a live RSVP workflow backed by SQLite + email alerts.",
  metadataBase: new URL("https://are-you-attending.local"),
  openGraph: {
    title: "Habibi RSVP - Powered by Next.js",
    description:
      "Elegant wedding invite landing page with RSVP collection, SQLite storage, and email notifications.",
    url: "https://example.com",
    siteName: "Habibi RSVP",
    images: [
      {
        url: "/template-page-assets/images/html/tf/habibi/assets/images/slider/slide-1.jpg",
        width: 1200,
        height: 630,
        alt: "Wedding couple invitation preview",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="/template-assets/images/html/tf/habibi/assets/images/favicon.png"
          type="image/png"
        />
        {templateStylePaths.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
}
