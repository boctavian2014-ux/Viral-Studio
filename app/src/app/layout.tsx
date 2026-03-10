import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Viral Studio — AI Video Factory",
  description: "Trend-first content pipeline for short-form viral videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
