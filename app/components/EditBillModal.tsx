"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit3 } from "lucide-react"
import type { Bill } from "@/types"

interface EditBillModalProps {
  isOpen: boolean
  onClose: () => void
  bill: Bill | null
  onSubmit: (billData: { name: string; description?: string }) => Promise<void>
  isSubmitting?: boolean
}

export default function EditBillModal({ isOpen, onClose, bill, onSubmit, isSubmitting = false }: EditBillModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    if (bill) {
      setFormData({
        name: bill.name,
        description: bill.description || "",
      })
    }
  }, [bill])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    await onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    })
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit3 className="mr-2 h-5 w-5 text-blue-600" />
            编辑账本
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">账本名称 *</Label>
            <Input
              id="name"
              placeholder="例如：个人账本、家庭开支"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">账本描述</Label>
            <Textarea
              id="description"
              placeholder="简单描述这个账本的用途..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              取消
            </Button>
            <Button type="submit" disabled={!formData.name.trim() || isSubmitting}>
              {isSubmitting ? "保存中..." : "保存修改"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
