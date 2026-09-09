import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Jewelry Try-On — Demo",
  description: "Standalone demo of the AI Jewelry Virtual Try-On module.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
