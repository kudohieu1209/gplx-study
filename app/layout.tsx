import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lai-vung-600.trowel-81bourbonshqu.chatgpt.site"),
  title: "Lái Vững - Học 600 câu lý thuyết hạng B",
  description:
    "Học, ôn câu sai và thi thử với đầy đủ 600 câu hỏi sát hạch lái xe hạng B.",
  openGraph: {
    title: "Lái Vững - Thành thạo 600 câu lý thuyết Hạng B",
    description: "Học theo chương, tra cứu biển báo và thi thử Hạng B.",
    type: "website",
    images: [{ url: "/og.png", width: 1730, height: 909, alt: "Lái Vững - Thành thạo 600 câu lý thuyết Hạng B" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lái Vững - Thành thạo 600 câu lý thuyết Hạng B",
    description: "Học theo chương, tra cứu biển báo và thi thử Hạng B.",
    images: ["/og.png"],
  },
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
