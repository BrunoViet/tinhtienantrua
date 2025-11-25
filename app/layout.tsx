import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quản Lí Tiền Ăn Trưa',
  description: 'Hệ thống quản lý tiền ăn trưa cho công ty',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}

