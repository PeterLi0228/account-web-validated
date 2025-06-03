"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, FileText, MessageSquare } from "lucide-react"

interface CreateBillModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (billData: { name: string; description?: string }) => Promise<void>
  isSubmitting?: boolean
}

export default function CreateBillModal({ isOpen, onClose, onSubmit, isSubmitting = false }: CreateBillModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || isSubmitting) return

    await onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined
    })
    
    setFormData({ name: "", description: "" })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-blue-600" />
            创建新账本
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              账本名称
            </Label>
            <Input
              id="name"
              placeholder="如：家庭账本、旅行账本..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              账本描述（可选）
            </Label>
            <Textarea
              id="description"
              placeholder="描述这个账本的用途..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📝 创建说明</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 你将成为这个账本的拥有者</li>
              <li>• 可以邀请其他人加入账本</li>
              <li>• 可以设置成员的权限级别</li>
              <li>• 创建后可以随时修改账本信息</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              取消
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting ? "创建中..." : "创建账本"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
