import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { BillProvider } from "@/contexts/BillContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "可记账 - 简单记录，智慧理财",
  description: "一个简洁优雅的记账应用，帮助您轻松管理收支，实现财务自由",
  generator: "v0.dev",
  keywords: "记账,理财,收支管理,财务管理",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <BillProvider>
              {children}
            </BillProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
