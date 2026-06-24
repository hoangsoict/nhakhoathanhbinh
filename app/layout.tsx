import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phòng Khám Đa Khoa Thanh Bình",
  description: "Đặt lịch khám nhanh bằng số điện thoại"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
