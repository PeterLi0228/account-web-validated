import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { BillProvider } from "@/contexts/BillContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "简记账 - 简单记录，智慧理财",
  description: "一个简洁优雅的记账应用，帮助您轻松管理收支，实现财务自由",
  keywords: "记账,理财,收支管理,财务管理",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <BillProvider>
          {children}
        </BillProvider>
      </body>
    </html>
  )
}
