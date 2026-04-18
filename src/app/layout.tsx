import type { Metadata } from "next";
import "./globals.css";
import { templateStylePaths } from "@/constants/templateAssets";

export const metadata: Metadata = {
  title: "Wedding Invitation",
  description: "Wedding invitation with RSVP details.",
  metadataBase: new URL("https://are-you-attending.local"),
  openGraph: {
    title: "Wedding Invitation",
    description: "Wedding invitation with RSVP details.",
    url: "https://example.com",
    siteName: "Wedding Invitation",
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
