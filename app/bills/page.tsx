"use client"

import { useState, useEffect } from "react"
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
import ManageMembersModal from "../components/ManageMembersModal"
import ManageCategoriesModal from "../components/ManageCategoriesModal"
import { useBills } from "@/contexts/BillContext"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Bill } from "@/types"

export default function BillsPage() {
  const { user } = useAuth()
  const { bills, isLoading, createBill, fetchBills, setCurrentBillId } = useBills()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const filteredBills = bills
    .filter(bill => bill.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      // 默认账本排在最前面
      if (a.is_default && !b.is_default) return -1
      if (!a.is_default && b.is_default) return 1
      // 其他按创建时间排序（最新的在前）
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const getPermissionIcon = (permission?: string) => {
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

  const getPermissionText = (permission?: string) => {
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

  const getPermissionColor = (permission?: string) => {
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

  const handleCreateBill = async (billData: { name: string; description?: string }) => {
    setIsCreating(true)
    const result = await createBill(billData.name, billData.description)
    
    if (!result.error) {
      setShowCreateModal(false)
    }
    
    setIsCreating(false)
  }

  const handleEditBill = (bill: Bill) => {
    setSelectedBill(bill)
    setShowEditModal(true)
  }

  const handleUpdateBill = async (billData: { name: string; description?: string }) => {
    if (!selectedBill) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('bills')
        .update({
          name: billData.name,
          description: billData.description
        })
        .eq('id', selectedBill.id)

      if (error) {
        console.error('更新账本失败:', error)
        alert('更新账本失败')
        return
      }

      await fetchBills()
      setShowEditModal(false)
      setSelectedBill(null)
    } catch (error) {
      console.error('更新账本失败:', error)
      alert('更新账本失败')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleManageMembers = (bill: Bill) => {
    setSelectedBill(bill)
    setShowMembersModal(true)
  }

  const handleManageCategories = (bill: Bill) => {
    setSelectedBill(bill)
    setShowCategoriesModal(true)
  }

  const handleDeleteBill = async (bill: Bill) => {
    if (!confirm(`确定要删除账本"${bill.name}"吗？此操作不可撤销，将删除所有相关的交易记录和分类。`)) {
      return
    }

    try {
      // 删除账本（级联删除会自动删除相关的交易记录、分类和成员）
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', bill.id)

      if (error) {
        console.error('删除账本失败:', error)
        alert('删除账本失败')
        return
      }

      await fetchBills()
    } catch (error) {
      console.error('删除账本失败:', error)
      alert('删除账本失败')
    }
  }

  const handleSetDefault = async (bill: Bill) => {
    try {
      console.log('设置默认账本:', bill.name, bill.id)
      console.log('当前用户ID:', user!.id)
      
      // 使用单个查询来更新所有账本的默认状态
      // 首先将所有账本设为非默认
      const { error: resetError } = await supabase
        .from('bills')
        .update({ is_default: false })
        .eq('owner_id', user!.id)

      if (resetError) {
        console.error('重置默认账本失败:', resetError)
        alert('设置默认账本失败: ' + resetError.message)
        return
      }
      console.log('重置所有账本的默认状态成功')

      // 然后将选中的账本设为默认
      const { error: setError } = await supabase
        .from('bills')
        .update({ is_default: true })
        .eq('id', bill.id)
        .eq('owner_id', user!.id) // 额外的安全检查

      if (setError) {
        console.error('设置默认账本失败:', setError)
        alert('设置默认账本失败: ' + setError.message)
        return
      }
      console.log('设置账本为默认成功:', bill.name)

      // 验证设置是否成功
      const { data: verifyData, error: verifyError } = await supabase
        .from('bills')
        .select('id, name, is_default')
        .eq('owner_id', user!.id)

      if (verifyError) {
        console.error('验证设置失败:', verifyError)
      } else {
        console.log('验证结果 - 所有账本状态:', verifyData)
      }

      await fetchBills()
      
      // 强制设置当前选中的账本为默认账本
      setCurrentBillId(bill.id)
      
      console.log('刷新账本列表完成')
    } catch (error) {
      console.error('设置默认账本失败:', error)
      alert('设置默认账本失败')
    }
  }

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">加载中...</p>
        </div>
      </AppLayout>
    )
  }

  // 如果是新用户且没有账本，显示欢迎界面
  if (bills.length === 0) {
    return (
      <AppLayout>
        <div className="h-full flex flex-col items-center justify-center p-4 text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">创建您的第一个账本</h2>
          <p className="text-gray-500 mb-6 max-w-md">
            账本是您管理收支的基础。您可以为不同的用途创建不同的账本，比如个人账本、家庭账本等。
          </p>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            disabled={isCreating}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isCreating ? "创建中..." : "创建第一个账本"}
          </Button>
          
          <CreateBillModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateBill}
            isSubmitting={isCreating}
          />
        </div>
      </AppLayout>
    )
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
            disabled={isCreating}
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
                  <p className="text-sm text-purple-700 mb-1">参与的账本</p>
                  <p className="text-xl lg:text-2xl font-bold text-purple-600">
                    {bills.filter((bill) => bill.permission !== "owner").length}
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
                  <p className="text-sm text-orange-700 mb-1">总交易数</p>
                  <p className="text-xl lg:text-2xl font-bold text-orange-600">
                    {bills.reduce((total, bill) => total + (bill.transactions?.length || 0), 0)}
                  </p>
                </div>
                <Tag className="h-6 w-6 lg:h-8 lg:w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {filteredBills.length === 0 && searchTerm ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">未找到匹配的账本</h3>
            <p className="text-gray-500">尝试使用不同的关键词搜索</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {filteredBills.map((bill) => (
              <Card key={bill.id} className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {bill.name}
                      </CardTitle>
                      {bill.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{bill.description}</p>
                      )}
                    </div>
                    {bill.permission === "owner" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditBill(bill)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            编辑账本
                          </DropdownMenuItem>
                          {!bill.is_default && (
                            <DropdownMenuItem onClick={() => handleSetDefault(bill)}>
                              <Crown className="mr-2 h-4 w-4" />
                              设为默认
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleManageMembers(bill)}>
                            <Users className="mr-2 h-4 w-4" />
                            管理成员
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageCategories(bill)}>
                            <Tag className="mr-2 h-4 w-4" />
                            管理分类
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteBill(bill)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除账本
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${getPermissionColor(bill.permission)}`}>
                      {getPermissionIcon(bill.permission)}
                      <span className="ml-1">{getPermissionText(bill.permission)}</span>
                    </Badge>
                      {bill.is_default && (
                        <Badge className="text-xs bg-orange-100 text-orange-700">
                          默认
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {bill.transactions?.length || 0} 条记录
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {bill.categories?.length || 0} 个分类
                    </span>
                    <Link 
                      href={`/chat/${bill.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      进入账本 →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 模态框 */}
      <CreateBillModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBill}
        isSubmitting={isCreating}
      />

      <EditBillModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedBill(null)
        }}
        bill={selectedBill}
        onSubmit={handleUpdateBill}
        isSubmitting={isUpdating}
      />

      <ManageMembersModal
        isOpen={showMembersModal}
        onClose={() => {
          setShowMembersModal(false)
          setSelectedBill(null)
        }}
        bill={selectedBill}
        onRefresh={fetchBills}
      />

      <ManageCategoriesModal
        isOpen={showCategoriesModal}
        onClose={() => {
          setShowCategoriesModal(false)
          setSelectedBill(null)
        }}
        bill={selectedBill}
        onRefresh={fetchBills}
      />
    </AppLayout>
  )
}
