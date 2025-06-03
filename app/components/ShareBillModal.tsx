"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Share2, Copy, Mail, LinkIcon, Check, Plus, Edit3, Eye } from "lucide-react"

interface ShareBillModalProps {
  isOpen: boolean
  onClose: () => void
  bill: any
}

export default function ShareBillModal({ isOpen, onClose, bill }: ShareBillModalProps) {
  const [inviteEmail, setInviteEmail] = useState("")
  const [invitePermission, setInvitePermission] = useState("add_only")
  const [shareLink, setShareLink] = useState(`https://app.simpleleger.com/join/${bill?.id}`)
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) return

    // 这里处理发送邀请的逻辑
    console.log("Sending invite:", { email: inviteEmail, permission: invitePermission })
    setInviteEmail("")
    alert("邀请已发送！")
  }

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
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
      case "edit_add":
        return "编辑权限"
      case "add_only":
        return "仅添加"
      case "view_only":
        return "仅查看"
      default:
        return "仅查看"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="mr-2 h-5 w-5 text-blue-600" />
            分享账本：{bill?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 邀请成员 */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center">
              <Mail className="mr-2 h-4 w-4" />
              邀请成员
            </h3>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="输入要邀请的邮箱地址"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>权限级别</Label>
                <Select value={invitePermission} onValueChange={setInvitePermission}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="edit_add">
                      <div className="flex items-center">
                        <Edit3 className="mr-2 h-4 w-4" />
                        编辑权限 - 可以添加、编辑、删除记录
                      </div>
                    </SelectItem>
                    <SelectItem value="add_only">
                      <div className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" />
                        仅添加 - 只能添加新记录
                      </div>
                    </SelectItem>
                    <SelectItem value="view_only">
                      <div className="flex items-center">
                        <Eye className="mr-2 h-4 w-4" />
                        仅查看 - 只能查看记录
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSendInvite} className="w-full" disabled={!inviteEmail.trim()}>
                <Mail className="mr-2 h-4 w-4" />
                发送邀请
              </Button>
            </div>
          </div>

          {/* 分享链接 */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center">
              <LinkIcon className="mr-2 h-4 w-4" />
              分享链接
            </h3>

            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input value={shareLink} readOnly className="flex-1" />
                <Button onClick={handleCopyLink} variant="outline">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <p className="text-sm text-gray-600">通过此链接加入的成员将获得"仅查看"权限，你可以后续调整权限。</p>
            </div>
          </div>

          {/* 权限说明 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">权限说明</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge className="bg-green-100 text-green-700 mr-2">
                    <Edit3 className="h-3 w-3 mr-1" />
                    编辑权限
                  </Badge>
                </div>
                <span className="text-gray-600">添加、编辑、删除记录</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge className="bg-blue-100 text-blue-700 mr-2">
                    <Plus className="h-3 w-3 mr-1" />
                    仅添加
                  </Badge>
                </div>
                <span className="text-gray-600">只能添加新记录</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge className="bg-gray-100 text-gray-700 mr-2">
                    <Eye className="h-3 w-3 mr-1" />
                    仅查看
                  </Badge>
                </div>
                <span className="text-gray-600">只能查看记录</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
