import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sublim Cases — Özəl telefon kabroları",
  description:
    "Şəklini yüklə, telefon modelini seç və özəl dizayn telefon kabronu sifariş et.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
