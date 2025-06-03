"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, BookOpen, Plus, Edit3, Eye, Lock, User } from "lucide-react"

interface Bill {
  id: string
  name: string
  description: string
  permission: "edit_add" | "add_only" | "view_only"
  isActive: boolean
}

interface BillSidebarProps {
  bills: Bill[]
  currentBillId: string
  isOpen: boolean
  onToggle: () => void
  onBillChange: (billId: string) => void
}

export default function BillSidebar({ bills, currentBillId, isOpen, onToggle, onBillChange }: BillSidebarProps) {
  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case "edit_add":
        return <Edit3 className="h-3 w-3" />
      case "add_only":
        return <Plus className="h-3 w-3" />
      case "view_only":
        return <Eye className="h-3 w-3" />
      default:
        return <Lock className="h-3 w-3" />
    }
  }

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case "edit_add":
        return "bg-green-100 text-green-700"
      case "add_only":
        return "bg-blue-100 text-blue-700"
      case "view_only":
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-red-100 text-red-700"
    }
  }

  return (
    <>
      {/* 桌面端侧边栏 */}
      <div
        className={`hidden lg:flex flex-col bg-white border-r transition-all duration-300 ${isOpen ? "w-80" : "w-16"}`}
      >
        {/* 侧边栏头部 */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {isOpen && (
              <h2 className="font-semibold text-gray-900 flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-blue-600" />
                账本列表
              </h2>
            )}
            <Button variant="ghost" size="sm" onClick={onToggle}>
              {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* 账本列表 */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {bills.map((bill) => (
              <Card
                key={bill.id}
                className={`cursor-pointer transition-all hover:shadow-sm border ${
                  bill.id === currentBillId ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                }`}
                onClick={() => onBillChange(bill.id)}
              >
                <CardContent className="p-3">
                  {isOpen ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900 text-sm">{bill.name}</h3>
                        <Badge className={`text-xs ${getPermissionColor(bill.permission)}`}>
                          {getPermissionIcon(bill.permission)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{bill.description}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <User className="h-3 w-3 mr-1" />
                        <span>个人账本</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <BookOpen
                        className={`h-5 w-5 ${bill.id === currentBillId ? "text-blue-600" : "text-gray-400"}`}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* 底部操作 */}
        {isOpen && (
          <div className="p-4 border-t">
            <Button variant="outline" className="w-full" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              创建新账本
            </Button>
          </div>
        )}
      </div>

      {/* 移动端抽屉 */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={onToggle}>
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* 移动端头部 */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-blue-600" />
                  账本列表
                </h2>
                <Button variant="ghost" size="sm" onClick={onToggle}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 移动端账本列表 */}
            <ScrollArea className="h-full p-4 pb-20">
              <div className="space-y-3">
                {bills.map((bill) => (
                  <Card
                    key={bill.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      bill.id === currentBillId ? "ring-2 ring-blue-500 bg-blue-50" : ""
                    }`}
                    onClick={() => {
                      onBillChange(bill.id)
                      onToggle()
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{bill.name}</h3>
                        <Badge className={`text-xs ${getPermissionColor(bill.permission)}`}>
                          {getPermissionIcon(bill.permission)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{bill.description}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <User className="h-3 w-3 mr-1" />
                        <span>个人账本</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* 移动端底部操作 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
              <Button variant="outline" className="w-full" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                创建新账本
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
