import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TonyFood - Best Snacks For You",
  description: "Browse delicious snacks, chips and food collections.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
