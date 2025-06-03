"use client"

import { useState } from "react"
import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tag, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react"

interface Category {
  id: string
  name: string
  type: "income" | "expense"
  isDefault: boolean
}

interface ManageCategoriesModalProps {
  isOpen: boolean
  onClose: () => void
  billName?: string
  categories: Category[]
  onCategoriesChange: (updatedCategories: Category[]) => void
}

export default function ManageCategoriesModal({
  isOpen,
  onClose,
  billName,
  categories,
  onCategoriesChange,
}: ManageCategoriesModalProps) {
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense")

  const incomeCategories = categories.filter((cat) => cat.type === "income")
  const expenseCategories = categories.filter((cat) => cat.type === "expense")

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return

    const newCategory: Category = {
      id: `${newCategoryType}-${Date.now()}`,
      name: newCategoryName.trim(),
      type: newCategoryType,
      isDefault: false,
    }

    onCategoriesChange([...categories, newCategory])
    setNewCategoryName("")
  }

  const handleDeleteCategory = (categoryId: string) => {
    const categoryToDelete = categories.find((cat) => cat.id === categoryId)
    if (!categoryToDelete) return

    const sameTypeCategories = categories.filter((cat) => cat.type === categoryToDelete.type)
    if (sameTypeCategories.length <= 1) {
      alert(`${categoryToDelete.type === "income" ? "收入" : "支出"}分类至少需要保留一个`)
      return
    }

    if (confirm("确定要删除这个分类吗？")) {
      onCategoriesChange(categories.filter((cat) => cat.id !== categoryId))
    }
  }

  const handleSave = () => {
    console.log("Saving categories (changes already applied):", categories)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Tag className="mr-2 h-5 w-5 text-blue-600" />
            管理分类：{billName || "账本"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 添加新分类 */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                添加自定义分类
              </h3>

              <div className="flex space-x-3">
                <div className="flex-1">
                  <Label htmlFor="category-name" className="text-sm">
                    分类名称
                  </Label>
                  <Input
                    id="category-name"
                    placeholder="输入分类名称"
                    value={newCategoryName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategoryName(e.target.value)}
                  />
                </div>

                <div className="w-32">
                  <Label className="text-sm">类型</Label>
                  <Select
                    value={newCategoryType}
                    onValueChange={(value: "income" | "expense") => setNewCategoryType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">收入</SelectItem>
                      <SelectItem value="expense">支出</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                    <Plus className="h-4 w-4 mr-1" />
                    添加
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 分类列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 收入分类 */}
            <div>
              <h3 className="font-medium mb-3 flex items-center text-green-700">
                <TrendingUp className="mr-2 h-4 w-4" />
                收入分类 ({incomeCategories.length})
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {incomeCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{category.name}</span>
                      {category.isDefault && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          默认
                        </Badge>
                      )}
                    </div>

                    {!category.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 支出分类 */}
            <div>
              <h3 className="font-medium mb-3 flex items-center text-red-700">
                <TrendingDown className="mr-2 h-4 w-4" />
                支出分类 ({expenseCategories.length})
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {expenseCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{category.name}</span>
                      {category.isDefault && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          默认
                        </Badge>
                      )}
                    </div>

                    {!category.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 说明信息 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 分类管理说明</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• 每种类型至少需要保留一个分类。</div>
              <div>• 默认分类不可删除，可以添加自定义分类。</div>
              <div>• 自定义分类将应用到当前账本。</div>
              <div>• 删除自定义分类不会影响已使用该分类的记录（此功能待实现）。</div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              完成并关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
