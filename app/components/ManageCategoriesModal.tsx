"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tag, Plus, Trash2, TrendingUp, TrendingDown, Edit3, Check, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Bill, Category } from "@/types"

interface ManageCategoriesModalProps {
  isOpen: boolean
  onClose: () => void
  bill: Bill | null
  onRefresh: () => void
}

interface ExpandedCategory {
  id: string
  originalId: string
  name: string
  type: "income" | "expense"
  created_at: string
}

export default function ManageCategoriesModal({ isOpen, onClose, bill, onRefresh }: ManageCategoriesModalProps) {
  const [expandedCategories, setExpandedCategories] = useState<ExpandedCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [activeTab, setActiveTab] = useState<"income" | "expense">("expense")
  const [isAdding, setIsAdding] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string>("")
  const [editCategoryName, setEditCategoryName] = useState("")

  const fetchCategories = async () => {
    if (!bill) return

    setIsLoading(true)
    try {
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('*')
        .eq('bill_id', bill.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('获取分类失败:', error)
        return
      }

      // 将合并的分类拆分成单独的分类项
      const expanded: ExpandedCategory[] = []
      if (categoriesData) {
        for (const category of categoriesData) {
          const categoryNames = category.name.split(';').map((name: string) => name.trim()).filter((name: string) => name)
          for (const name of categoryNames) {
            expanded.push({
              id: `${category.id}_${name}`, // 生成唯一ID
              originalId: category.id,
              name: name,
              type: category.type,
              created_at: category.created_at
            })
          }
        }
      }

      setExpandedCategories(expanded)
    } catch (error) {
      console.error('获取分类失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && bill) {
      fetchCategories()
    }
  }, [isOpen, bill])

  const handleAddCategory = async () => {
    if (!bill || !newCategoryName.trim()) return

    // 检查分类名称中是否包含分号
    if (newCategoryName.includes(';')) {
      alert('分类名称不能包含分号(;)字符')
      return
    }

    // 检查是否已存在同名分类
    const existingCategory = expandedCategories.find(cat => 
      cat.type === activeTab && cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    )
    if (existingCategory) {
      alert('该分类已存在')
      return
    }

    setIsAdding(true)
    try {
      // 查找该类型是否已有分类记录
      const { data: existingData, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('bill_id', bill.id)
        .eq('type', activeTab)

      if (fetchError) {
        console.error('查询分类失败:', fetchError)
        alert('添加分类失败')
        return
      }

      if (existingData && existingData.length > 0) {
        // 如果已存在该类型的分类，添加到现有记录
        const existingCategory = existingData[0]
        const currentNames = existingCategory.name.split(';').map((name: string) => name.trim()).filter((name: string) => name)
        currentNames.push(newCategoryName.trim())
        const updatedName = currentNames.join(';')

        const { error } = await supabase
          .from('categories')
          .update({ name: updatedName })
          .eq('id', existingCategory.id)

        if (error) {
          console.error('更新分类失败:', error)
          alert('添加分类失败')
          return
        }
      } else {
        // 如果不存在该类型的分类，创建新记录
        const { error } = await supabase
          .from('categories')
          .insert({
            bill_id: bill.id,
            user_id: bill.owner_id,
            name: newCategoryName.trim(),
            type: activeTab
          })

        if (error) {
          console.error('添加分类失败:', error)
          alert('添加分类失败')
          return
        }
      }

      setNewCategoryName("")
      await fetchCategories()
      onRefresh()
    } catch (error) {
      console.error('添加分类失败:', error)
      alert('添加分类失败')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteCategory = async (category: ExpandedCategory) => {
    if (!confirm(`确定要删除分类"${category.name}"吗？删除后相关的交易记录将变为未分类状态。`)) return

    try {
      // 获取原始分类记录
      const { data: originalCategory, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', category.originalId)
        .single()

      if (fetchError || !originalCategory) {
        console.error('获取原始分类失败:', fetchError)
        alert('删除分类失败')
        return
      }

      // 从合并的分类名称中移除该分类
      const categoryNames = originalCategory.name.split(';').map((name: string) => name.trim()).filter((name: string) => name)
      const updatedNames = categoryNames.filter((name: string) => name !== category.name)

      if (updatedNames.length === 0) {
        // 如果没有其他分类了，删除整个记录
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', category.originalId)

        if (error) {
          console.error('删除分类失败:', error)
          alert('删除分类失败')
          return
        }
      } else {
        // 如果还有其他分类，更新记录
        const { error } = await supabase
          .from('categories')
          .update({ name: updatedNames.join(';') })
          .eq('id', category.originalId)

        if (error) {
          console.error('更新分类失败:', error)
          alert('删除分类失败')
          return
        }
      }

      await fetchCategories()
      onRefresh()
    } catch (error) {
      console.error('删除分类失败:', error)
      alert('删除分类失败')
    }
  }

  const handleEditCategory = (category: ExpandedCategory) => {
    setEditingCategoryId(category.id)
    setEditCategoryName(category.name)
  }

  const handleSaveEdit = async (category: ExpandedCategory) => {
    if (!editCategoryName.trim()) return

    // 检查分类名称中是否包含分号
    if (editCategoryName.includes(';')) {
      alert('分类名称不能包含分号(;)字符')
      return
    }

    // 检查是否已存在同名分类（排除当前分类）
    const existingCategory = expandedCategories.find(cat => 
      cat.type === category.type && 
      cat.name.toLowerCase() === editCategoryName.trim().toLowerCase() &&
      cat.id !== category.id
    )
    if (existingCategory) {
      alert('该分类已存在')
      return
    }

    try {
      // 获取原始分类记录
      const { data: originalCategory, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', category.originalId)
        .single()

      if (fetchError || !originalCategory) {
        console.error('获取原始分类失败:', fetchError)
        alert('编辑分类失败')
        return
      }

      // 更新合并的分类名称
      const categoryNames = originalCategory.name.split(';').map((name: string) => name.trim()).filter((name: string) => name)
      const updatedNames = categoryNames.map((name: string) => name === category.name ? editCategoryName.trim() : name)

      const { error } = await supabase
        .from('categories')
        .update({ name: updatedNames.join(';') })
        .eq('id', category.originalId)

      if (error) {
        console.error('更新分类失败:', error)
        alert('编辑分类失败')
        return
      }

      setEditingCategoryId("")
      setEditCategoryName("")
      await fetchCategories()
      onRefresh()
    } catch (error) {
      console.error('编辑分类失败:', error)
      alert('编辑分类失败')
    }
  }

  const handleCancelEdit = () => {
    setEditingCategoryId("")
    setEditCategoryName("")
  }

  const renderCategoryList = (type: "income" | "expense") => {
    const categories = expandedCategories.filter(cat => cat.type === type)

    if (categories.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>暂无{type === 'income' ? '收入' : '支出'}分类</p>
          <p className="text-sm mt-1">添加第一个分类开始使用</p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1">
                  {type === 'income' ? (
                    <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                  )}
                  
                  {editingCategoryId === category.id ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <Input
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        placeholder="输入分类名称"
                        className="flex-1 h-8"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(category)
                          } else if (e.key === 'Escape') {
                            handleCancelEdit()
                          }
                        }}
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(category)}>
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 text-gray-600" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Badge 
                        variant="secondary" 
                        className={`${type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {category.name}
                      </Badge>
                      <div className="flex items-center space-x-1 ml-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Tag className="mr-2 h-5 w-5 text-blue-600" />
            管理分类 - {bill?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense" className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4" />
                <span>支出分类</span>
              </TabsTrigger>
              <TabsTrigger value="income" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>收入分类</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expense" className="space-y-4">
              {/* 添加新分类 */}
              <div className="flex space-x-2">
                <Input
                  placeholder="输入新的支出分类名称"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  disabled={isAdding}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCategory()
                    }
                  }}
                />
                <Button 
                  onClick={handleAddCategory} 
                  disabled={!newCategoryName.trim() || isAdding}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isAdding ? "添加中..." : "添加"}
                </Button>
              </div>

              {/* 分类列表 */}
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : (
                renderCategoryList("expense")
              )}
            </TabsContent>

            <TabsContent value="income" className="space-y-4">
              {/* 添加新分类 */}
              <div className="flex space-x-2">
                <Input
                  placeholder="输入新的收入分类名称"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  disabled={isAdding}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCategory()
                    }
                  }}
                />
                <Button 
                  onClick={handleAddCategory} 
                  disabled={!newCategoryName.trim() || isAdding}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isAdding ? "添加中..." : "添加"}
                </Button>
              </div>

              {/* 分类列表 */}
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : (
                renderCategoryList("income")
              )}
            </TabsContent>
          </Tabs>

          {/* 使用说明 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 使用说明</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• 每个分类都可以独立编辑和删除</div>
              <div>• 点击编辑图标可以修改分类名称</div>
              <div>• 删除分类不会删除相关的交易记录，但会将其标记为未分类</div>
              <div>• 分类名称不能包含分号(;)字符</div>
              <div>• 建议创建常用的分类，如：餐饮、交通、购物等</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
