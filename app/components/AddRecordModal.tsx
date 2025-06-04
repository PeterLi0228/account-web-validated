"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Calendar, DollarSign, MessageSquare, Tag } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBills } from "@/contexts/BillContext"
import { useAuth } from "@/contexts/AuthContext"
import type { Category } from "@/types"

interface AddRecordModalProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  billId: string
}

export default function AddRecordModal({ isOpen, onClose, categories, billId }: AddRecordModalProps) {
  const { addTransaction } = useBills()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    date: new Date().toISOString().split("T")[0],
    item: "",
    amount: "",
    note: "",
    category_id: "",
  })

  // 获取用户的display name
  const getUserDisplayName = () => {
    return user?.user_metadata?.display_name || user?.email?.split('@')[0] || "未知用户"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.item || !formData.amount || !formData.category_id) {
      return
    }

    setIsSubmitting(true)

    // 获取选中分类的原始ID
    const selectedCategory = categories.find(cat => cat.id === formData.category_id)
    const categoryId = selectedCategory?.original_id || formData.category_id

    const result = await addTransaction(billId, {
      type: formData.type,
      date: formData.date,
      item: formData.item,
      amount: Number.parseFloat(formData.amount),
      person: getUserDisplayName(), // 直接存储display name
      note: formData.note || undefined,
      category_id: categoryId, // 使用原始ID
    })

    if (!result.error) {
      // 重置表单
      setFormData({
        type: "expense",
        date: new Date().toISOString().split("T")[0],
        item: "",
        amount: "",
        note: "",
        category_id: "",
      })
      onClose()
    }

    setIsSubmitting(false)
  }

  const filteredCategories = categories.filter(cat => cat.type === formData.type)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {formData.type === "income" ? (
              <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="mr-2 h-5 w-5 text-red-600" />
            )}
            添加{formData.type === "income" ? "收入" : "支出"}记录
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 类型选择 */}
          <div className="grid grid-cols-2 gap-3">
            <Card
              className={`cursor-pointer transition-all ${
                formData.type === "income" ? "ring-2 ring-green-500 bg-green-50" : "hover:bg-gray-50"
              }`}
              onClick={() => setFormData({ ...formData, type: "income", category_id: "" })}
            >
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="font-medium text-green-700">收入</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all ${
                formData.type === "expense" ? "ring-2 ring-red-500 bg-red-50" : "hover:bg-gray-50"
              }`}
              onClick={() => setFormData({ ...formData, type: "expense", category_id: "" })}
            >
              <CardContent className="p-4 text-center">
                <TrendingDown className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <p className="font-medium text-red-700">支出</p>
              </CardContent>
            </Card>
          </div>

          {/* 日期 */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              日期
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* 分类 */}
          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center">
              <Tag className="mr-2 h-4 w-4" />
              分类
            </Label>
            <Select 
              value={formData.category_id} 
              onValueChange={(value) => {
                const category = categories.find(cat => cat.id === value)
                setFormData({ 
                  ...formData, 
                  category_id: value,
                  item: category?.name || ""
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.type === "income" ? "选择收入分类" : "选择支出分类"} />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 金额 */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              金额
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">¥</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-8"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="note" className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              备注（可选）
            </Label>
            <Textarea
              id="note"
              placeholder="添加备注信息..."
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          {/* 经办人显示（只读） */}
          <div className="space-y-2">
            <Label className="flex items-center text-sm text-gray-600">
              经办人: {getUserDisplayName()}
            </Label>
          </div>

          {/* 提交按钮 */}
          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              取消
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting || !formData.item || !formData.amount || !formData.category_id}
            >
              {isSubmitting ? "添加中..." : "确认添加"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
