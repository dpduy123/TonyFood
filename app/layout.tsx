import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TonyFood - Thực Phẩm Sỉ Toàn Miền Nam",
  description: "Cung cấp thịt bò, ba rọi heo, xúc xích, phô mai, viên thả lẩu giá sỉ tận xưởng.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className="h-full antialiased">
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans"
      >
        {children}
      </body>
    </html>
  );
}
