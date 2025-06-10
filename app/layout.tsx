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
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" }
    ]
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  },
  themeColor: "#3b82f6",
  applicationName: "可记账",
  appleWebApp: {
    capable: true,
    title: "可记账",
    statusBarStyle: "default"
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="application-name" content="可记账" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="可记账" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
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
