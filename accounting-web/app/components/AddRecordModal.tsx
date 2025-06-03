"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Calendar, DollarSign, User, MessageSquare, Tag } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (transaction: any) => void
}

export default function AddRecordModal({ isOpen, onClose, onAdd }: AddRecordModalProps) {
  const [formData, setFormData] = useState({
    type: "expense",
    date: new Date().toISOString().split("T")[0],
    item: "",
    amount: "",
    person: "",
    note: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.item || !formData.amount || !formData.person) {
      return
    }

    onAdd({
      ...formData,
      amount: Number.parseFloat(formData.amount),
    })

    // 重置表单
    setFormData({
      type: "expense",
      date: new Date().toISOString().split("T")[0],
      item: "",
      amount: "",
      person: "",
      note: "",
    })

    onClose()
  }

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
              onClick={() => setFormData({ ...formData, type: "income" })}
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
              onClick={() => setFormData({ ...formData, type: "expense" })}
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
            />
          </div>

          {/* 分类 */}
          <div className="space-y-2">
            <Label htmlFor="item" className="flex items-center">
              <Tag className="mr-2 h-4 w-4" />
              分类
            </Label>
            <Select value={formData.item} onValueChange={(value) => setFormData({ ...formData, item: value })}>
              <SelectTrigger>
                <SelectValue placeholder={formData.type === "income" ? "选择收入分类" : "选择支出分类"} />
              </SelectTrigger>
              <SelectContent>
                {formData.type === "income" ? (
                  <>
                    <SelectItem value="工资收入">工资收入</SelectItem>
                    <SelectItem value="奖金">奖金</SelectItem>
                    <SelectItem value="投资收益">投资收益</SelectItem>
                    <SelectItem value="兼职收入">兼职收入</SelectItem>
                    <SelectItem value="其他收入">其他收入</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="餐饮">餐饮</SelectItem>
                    <SelectItem value="交通">交通</SelectItem>
                    <SelectItem value="购物">购物</SelectItem>
                    <SelectItem value="娱乐">娱乐</SelectItem>
                    <SelectItem value="医疗">医疗</SelectItem>
                    <SelectItem value="教育">教育</SelectItem>
                    <SelectItem value="住房">住房</SelectItem>
                    <SelectItem value="其他支出">其他支出</SelectItem>
                  </>
                )}
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
              />
            </div>
          </div>

          {/* 经办人 */}
          <div className="space-y-2">
            <Label htmlFor="person" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              经办人
            </Label>
            <Input
              id="person"
              placeholder="如：张三"
              value={formData.person}
              onChange={(e) => setFormData({ ...formData, person: e.target.value })}
              required
            />
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
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              取消
            </Button>
            <Button
              type="submit"
              className={`flex-1 text-white shadow-lg hover:shadow-xl transition-all duration-200 ${
                formData.type === "income"
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
              }`}
            >
              保存记录
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
