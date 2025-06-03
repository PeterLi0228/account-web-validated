"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BookOpen, Plus, MoreHorizontal, Edit3, Share2, Trash2, Users, Search, Eye, Crown, Tag } from "lucide-react"
import Link from "next/link"
import AppLayout from "../components/AppLayout"
import CreateBillModal from "../components/CreateBillModal"
import EditBillModal from "../components/EditBillModal"
import ShareBillModal from "../components/ShareBillModal"
import ManageMembersModal from "../components/ManageMembersModal"
import ManageCategoriesModal from "../components/ManageCategoriesModal"
import { useBills } from "@/contexts/BillContext"
import type { Bill, Category } from "@/types"

export default function BillsPage() {
  const {
    bills,
    addBill,
    deleteBill,
    updateBillCategories,
  } = useBills()

  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)

  const filteredBills = bills.filter(
    (bill: Bill) =>
      bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.description && bill.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case "owner":
        return <Crown className="h-3 w-3" />
      case "edit_add":
        return <Edit3 className="h-3 w-3" />
      case "add_only":
        return <Plus className="h-3 w-3" />
      case "view_only":
        return <Eye className="h-3 w-3" />
      default:
        return <Eye className="h-3 w-3" />
    }
  }

  const getPermissionText = (permission: string) => {
    switch (permission) {
      case "owner":
        return "拥有者"
      case "edit_add":
        return "编辑权限"
      case "add_only":
        return "仅添加"
      case "view_only":
        return "仅查看"
      default:
        return "无权限"
    }
  }

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case "owner":
        return "bg-yellow-100 text-yellow-700"
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

  const handleCreateBill = (billData: { name: string; description: string }) => {
    addBill(billData)
    setShowCreateModal(false)
  }

  const handleEditBill = (billData: Partial<Omit<Bill, 'id' | 'categories' | 'transactions'>>) => {
    if (selectedBill) {
      console.log("Updating bill (via context if implemented):", selectedBill.id, billData)
    }
    setShowEditModal(false)
    setSelectedBill(null)
  }

  const handleDeleteBillFromContext = (billId: string) => {
    if (confirm("确定要删除这个账本吗？此操作不可恢复。")) {
      deleteBill(billId)
    }
  }

  const handleUpdateBillCategoriesFromContext = (billId: string, updatedCategories: Category[]) => {
    updateBillCategories(billId, updatedCategories)
    setShowCategoriesModal(false)
  }

  const openEditModal = (bill: Bill) => {
    setSelectedBill(bill)
    setShowEditModal(true)
  }

  const openShareModal = (bill: Bill) => {
    setSelectedBill(bill)
    setShowShareModal(true)
  }

  const openMembersModal = (bill: Bill) => {
    setSelectedBill(bill)
    setShowMembersModal(true)
  }

  const openCategoriesModal = (bill: Bill) => {
    setSelectedBill(bill)
    setShowCategoriesModal(true)
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索账本名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            创建账本
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 mb-1">总账本数</p>
                  <p className="text-xl lg:text-2xl font-bold text-blue-600">{bills.length}</p>
                </div>
                <BookOpen className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 mb-1">我创建的</p>
                  <p className="text-xl lg:text-2xl font-bold text-green-600">
                    {bills.filter((bill) => bill.permission === "owner").length}
                  </p>
                </div>
                <Crown className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200/50">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 mb-1">共享账本</p>
                  <p className="text-xl lg:text-2xl font-bold text-purple-600">
                    {bills.filter((bill) => bill.isShared).length}
                  </p>
                </div>
                <Share2 className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200/50">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 mb-1">总成员数</p>
                  <p className="text-xl lg:text-2xl font-bold text-orange-600">
                    {bills.reduce((sum, bill) => sum + bill.memberCount, 0)}
                  </p>
                </div>
                <Users className="h-6 w-6 lg:h-8 lg:w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredBills.map((bill) => (
            <Card key={bill.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-2 truncate">{bill.name}</CardTitle>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{bill.description || ''}</p>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={`text-xs ${getPermissionColor(bill.permission)}`}>
                        {getPermissionIcon(bill.permission)}
                        <span className="ml-1">{getPermissionText(bill.permission)}</span>
                      </Badge>

                      {bill.isShared && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          <Share2 className="h-3 w-3 mr-1" />
                          已共享
                        </Badge>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/chat/${bill.id}`}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          打开账本
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => openCategoriesModal(bill)}>
                        <Tag className="mr-2 h-4 w-4" />
                        管理分类
                      </DropdownMenuItem>

                      {bill.permission === "owner" && (
                        <>
                          <DropdownMenuItem onClick={() => openEditModal(bill)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            编辑账本
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openShareModal(bill)}>
                            <Share2 className="mr-2 h-4 w-4" />
                            分享账本
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuItem onClick={() => openMembersModal(bill)}>
                        <Users className="mr-2 h-4 w-4" />
                        管理成员
                      </DropdownMenuItem>

                      {bill.permission === "owner" && (
                        <DropdownMenuItem onClick={() => handleDeleteBillFromContext(bill.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除账本
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{bill.memberCount} 成员</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  <span>
                    创建者：{bill.owner} • {bill.createdAt}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBills.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{searchTerm ? "未找到匹配的账本" : "还没有账本"}</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? "尝试使用其他关键词搜索" : "创建你的第一个账本开始记账吧"}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                创建账本
              </Button>
            )}
          </div>
        )}
      </div>

      <CreateBillModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreateBill}
      />

      {selectedBill && (
        <>
          <EditBillModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setSelectedBill(null)
            }}
            bill={selectedBill}
            onConfirm={handleEditBill}
          />

          <ShareBillModal
            isOpen={showShareModal}
            onClose={() => {
              setShowShareModal(false)
              setSelectedBill(null)
            }}
            bill={selectedBill}
          />

          <ManageMembersModal
            isOpen={showMembersModal}
            onClose={() => {
              setShowMembersModal(false)
              setSelectedBill(null)
            }}
            bill={selectedBill}
          />

          <ManageCategoriesModal
            isOpen={showCategoriesModal}
            onClose={() => {
              setShowCategoriesModal(false)
              setSelectedBill(null)
            }}
            billName={selectedBill.name}
            categories={selectedBill.categories}
            onCategoriesChange={(updatedCategories) =>
              handleUpdateBillCategoriesFromContext(selectedBill.id, updatedCategories)
            }
          />
        </>
      )}
    </AppLayout>
  )
}
