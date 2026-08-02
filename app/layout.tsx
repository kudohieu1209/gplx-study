import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lái Vững - Học 600 câu lý thuyết hạng B",
  description:
    "Học, ôn câu sai và thi thử với đầy đủ 600 câu hỏi sát hạch lái xe hạng B.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
