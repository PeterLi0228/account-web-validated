"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Wallet,
  Home,
  BookOpen,
  Bot,
  BarChart3,
  Download,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"

interface AppLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: string
}

const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "首页" },
  { href: "/bills", icon: BookOpen, label: "账本管理" },
  { href: "/chat/1", icon: Bot, label: "AI记账", badge: "智能" },
  { href: "/analytics", icon: BarChart3, label: "数据分析" },
  { href: "/export", icon: Download, label: "导出数据" },
]

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut, updateDisplayName } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showUserNameModal, setShowUserNameModal] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const pathname = usePathname()

  const userName = user?.user_metadata?.display_name || "用户"

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [user, router])

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  const closeMobileSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim()) return

    setIsUpdating(true)
    const result = await updateDisplayName(newDisplayName.trim())
    
    if (!result.error) {
      setShowUserNameModal(false)
      setNewDisplayName("")
    }
    
    setIsUpdating(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (!user) {
    return null
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex overflow-hidden">
      {/* 移动端遮罩 */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeMobileSidebar} />
      )}

      {/* 侧边导航栏 */}
      <div
        className={`
          ${isMobile ? "fixed" : "relative"} 
          ${isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"}
          ${!isMobile && sidebarCollapsed ? "w-16" : "w-64"}
          h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-50 flex flex-col
        `}
      >
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {(!isMobile && !sidebarCollapsed) || isMobile ? (
            <div className="flex items-center space-x-2">
              <Wallet className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                简记账
              </h1>
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          )}

          <Button variant="ghost" size="sm" onClick={toggleSidebar} className="lg:flex">
            {isMobile ? (
              <X className="h-4 w-4" />
            ) : sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* 导航菜单 */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors
                    ${isActive ? "bg-blue-100 text-blue-700 border border-blue-200" : "text-gray-700 hover:bg-gray-100"}
                  `}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-500"}`} />

                  {(!isMobile && !sidebarCollapsed) || isMobile ? (
                    <>
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge className="ml-auto bg-purple-100 text-purple-700 text-xs">{item.badge}</Badge>
                      )}
                    </>
                  ) : null}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* 侧边栏底部 */}
        <div className="border-t border-gray-200 p-3">
          {(!isMobile && !sidebarCollapsed) || isMobile ? (
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start px-3 py-2.5 text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setNewDisplayName(userName)
                  setShowUserNameModal(true)
                }}
              >
                <User className="h-5 w-5 mr-3 text-gray-500" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">{userName}</span>
                  <span className="text-xs text-gray-500">点击修改用户名</span>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:bg-gray-100"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5 mr-3 text-gray-500" />
                退出登录
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full p-2"
                onClick={() => {
                  setNewDisplayName(userName)
                  setShowUserNameModal(true)
                }}
              >
                <User className="h-5 w-5 text-gray-500" />
              </Button>
              <Button variant="ghost" size="sm" className="w-full p-2" onClick={handleSignOut}>
                <LogOut className="h-5 w-5 text-gray-500" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 移动端顶部栏 */}
        {isMobile && (
          <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Wallet className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                简记账
              </span>
            </div>
            <div className="w-9" /> {/* 占位符保持居中 */}
          </div>
        )}

        {/* 页面内容 */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      {/* 修改用户名对话框 */}
      <Dialog open={showUserNameModal} onOpenChange={setShowUserNameModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改用户名</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">新用户名</Label>
              <Input
                id="display-name"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="请输入新的用户名"
                disabled={isUpdating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserNameModal(false)} disabled={isUpdating}>
              取消
            </Button>
            <Button onClick={handleUpdateDisplayName} disabled={isUpdating || !newDisplayName.trim()}>
              {isUpdating ? "更新中..." : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
