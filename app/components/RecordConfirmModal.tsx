"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Calendar, FileText, DollarSign, User, MessageSquare, Sparkles, Tag as TagIcon } from "lucide-react"
import type { Transaction, Category } from "@/types"

type TransactionFormData = Omit<Transaction, 'id' | 'bill_id' | 'created_at' | 'category_name'>;

interface RecordConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  initialRecord: TransactionFormData
  categories: Category[]
  onConfirm: (record: TransactionFormData) => void
  billName?: string
}

export default function RecordConfirmModal({
  isOpen,
  onClose,
  initialRecord,
  categories,
  onConfirm,
  billName,
}: RecordConfirmModalProps) {
  const [formData, setFormData] = useState<TransactionFormData>(initialRecord)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableCategories = categories.filter(cat => cat.type === formData.type)

  useEffect(() => {
    setFormData(initialRecord)
    setIsSubmitting(false) // 重置提交状态
  }, [initialRecord])

  useEffect(() => {
    if (initialRecord) {
        const categoryExists = availableCategories.some(cat => cat.id === initialRecord.category_id);
        if (!categoryExists && availableCategories.length > 0) {
            setFormData((prev: TransactionFormData) => ({ ...prev, category_id: availableCategories[0].id }));
        } else if (!categoryExists && availableCategories.length === 0) {
            setFormData((prev: TransactionFormData) => ({ ...prev, category_id: "" }));
            console.warn(`No categories available for type: ${formData.type} in bill: ${billName}`);
        }
    }
  }, [initialRecord, availableCategories, formData.type, billName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.category_id || formData.category_id === "uncategorized" || formData.category_id === "" || isSubmitting) {
        if (!isSubmitting) {
          alert("请选择一个有效的分类。");
        }
        return;
    }

    setIsSubmitting(true)

    try {
      // 获取选中分类的原始ID
      const selectedCategory = availableCategories.find(cat => cat.id === formData.category_id)
      const categoryId = selectedCategory?.original_id || formData.category_id

      // 使用原始ID提交
      await onConfirm({
        ...formData,
        category_id: categoryId
      })
    } catch (error) {
      console.error('提交记录失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-purple-600" />
            确认记账 - {billName || "当前账本"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI解析预览卡片 */}
          <Card
            className={`border-2 shadow-sm ${
              formData.type === "income" ? "border-green-300/70 bg-green-50/70" : "border-red-300/70 bg-red-50/70"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {formData.type === "income" ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                  <Badge
                    className={`text-sm font-semibold ${formData.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {formData.type === "income" ? "收入" : "支出"}
                  </Badge>
                </div>
                <div className={`text-2xl font-bold ${formData.type === "income" ? "text-green-600" : "text-red-600"}`}>
                  {formData.type === "income" ? "+ " : "- "}¥{formatAmount(formData.amount)}
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">摘要：</span>
                  <span className="font-medium text-gray-800">{formData.item}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-600">日期：</span>
                  <span className="font-medium text-gray-800">{formData.date}</span>
                </div>
                 {formData.category_id && availableCategories.find(c => c.id === formData.category_id) && (
                    <div className="flex items-center">
                        <TagIcon className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-600">分类：</span>
                        <span className="font-medium text-gray-800">{availableCategories.find(c => c.id === formData.category_id)?.name}</span>
                    </div>
                )}
                {formData.person && (
                    <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-600">经办人：</span>
                        <span className="font-medium text-gray-800">{formData.person}</span>
                    </div>
                )}
                {formData.note && formData.note !== formData.item &&  (
                    <div className="flex items-start">
                        <MessageSquare className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                        <span className="text-gray-600">备注：</span>
                        <span className="font-medium text-gray-800 whitespace-pre-wrap">{formData.note}</span>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-gray-500 text-center">👆 AI 为您初步整理的记录，请检查并编辑以下字段后确认添加：</div>

          {/* 编辑表单 */}
          <div className="space-y-4">
            {/* 日期 */}
            <div className="space-y-1.5">
              <Label htmlFor="date" className="flex items-center text-sm font-medium">
                <Calendar className="mr-2 h-4 w-4 text-gray-600" />
                日期
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, date: e.target.value })}
                required
                className="text-sm"
              />
            </div>

            {/* 摘要 */}
            <div className="space-y-1.5">
              <Label htmlFor="item" className="flex items-center text-sm font-medium">
                <FileText className="mr-2 h-4 w-4 text-gray-600" />
                摘要 <span className="text-xs text-gray-400 ml-1">(例如：午餐, 工资)</span>
              </Label>
              <Input
                id="item"
                placeholder="例如：购买咖啡"
                value={formData.item}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, item: e.target.value })}
                required
                className="text-sm"
              />
            </div>

            {/* 金额 */}
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="flex items-center text-sm font-medium">
                <DollarSign className="mr-2 h-4 w-4 text-gray-600" />
                金额
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">¥</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7 text-sm"
                  value={formData.amount === 0 ? '' : formData.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, amount: Number.parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            
            {/* 分类 */}
            <div className="space-y-1.5">
              <Label htmlFor="category" className="flex items-center text-sm font-medium">
                <TagIcon className="mr-2 h-4 w-4 text-gray-600" />
                分类
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value: string) => setFormData({ ...formData, category_id: value })}
                required
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder={availableCategories.length > 0 ? "选择分类" : "无可用分类"} />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.length > 0 ? (
                    availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-sm">
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="disabled" disabled className="text-sm">
                      当前类型下无可用分类
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
               {availableCategories.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  请先在账本设置中添加"{formData.type === 'income' ? '收入' : '支出'}分类。
                </p>
              )}
            </div>

            {/* 经办人 (可选) */}
            <div className="space-y-1.5">
              <Label htmlFor="person" className="flex items-center text-sm font-medium">
                <User className="mr-2 h-4 w-4 text-gray-600" />
                经办人 <span className="text-xs text-gray-400 ml-1">(可选)</span>
              </Label>
              <Input
                id="person"
                placeholder="例如：自己, 同事A"
                value={formData.person || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, person: e.target.value })}
                className="text-sm"
              />
            </div>

            {/* 备注 (可选) */}
            <div className="space-y-1.5">
              <Label htmlFor="note" className="flex items-center text-sm font-medium">
                <MessageSquare className="mr-2 h-4 w-4 text-gray-600" />
                备注 <span className="text-xs text-gray-400 ml-1">(可选)</span>
              </Label>
              <Textarea
                id="note"
                rows={2}
                placeholder="例如：与朋友聚餐的AA费用"
                value={formData.note || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, note: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={!formData.category_id || formData.category_id === "uncategorized" || formData.category_id === "" || availableCategories.length === 0 || isSubmitting}
              className={`flex-1 text-white shadow-lg hover:shadow-xl transition-all duration-200 ${
                formData.type === "income"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  : "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
              }`}
            >
              {isSubmitting ? "添加中..." : (formData.type === "income" ? "确认收入" : "确认支出")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
