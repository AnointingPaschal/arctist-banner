import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arc-tist Banner Generator",
  description: "Create your personalized Arc Community Twitter/X banner",
  openGraph: {
    title: "Arc-tist Banner Generator",
    description: "Create your personalized Arc Community Twitter/X banner",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
