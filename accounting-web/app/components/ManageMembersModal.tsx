"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, MoreHorizontal, Crown, Edit3, Plus, Eye, UserMinus } from "lucide-react"

interface Member {
  id: string
  name: string
  email: string
  permission: "owner" | "edit_add" | "add_only" | "view_only"
  joinedAt: string
  avatar?: string
}

interface ManageMembersModalProps {
  isOpen: boolean
  onClose: () => void
  bill: any
}

// 模拟成员数据
const mockMembers: Member[] = [
  {
    id: "1",
    name: "我",
    email: "me@example.com",
    permission: "owner",
    joinedAt: "2024-01-01",
  },
  {
    id: "2",
    name: "张三",
    email: "zhangsan@example.com",
    permission: "edit_add",
    joinedAt: "2024-01-15",
  },
  {
    id: "3",
    name: "李四",
    email: "lisi@example.com",
    permission: "add_only",
    joinedAt: "2024-02-01",
  },
  {
    id: "4",
    name: "王五",
    email: "wangwu@example.com",
    permission: "view_only",
    joinedAt: "2024-02-10",
  },
]

export default function ManageMembersModal({ isOpen, onClose, bill }: ManageMembersModalProps) {
  const [members, setMembers] = useState(mockMembers)

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
        return "仅查看"
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
        return "bg-gray-100 text-gray-700"
    }
  }

  const handlePermissionChange = (memberId: string, newPermission: string) => {
    setMembers(
      members.map((member) => (member.id === memberId ? { ...member, permission: newPermission as any } : member)),
    )
  }

  const handleRemoveMember = (memberId: string) => {
    if (confirm("确定要移除这个成员吗？")) {
      setMembers(members.filter((member) => member.id !== memberId))
    }
  }

  const currentUser = members.find((member) => member.permission === "owner")
  const isOwner = currentUser?.name === "我"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-blue-600" />
            管理成员：{bill?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 成员统计 */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{members.length}</div>
              <div className="text-sm text-gray-600">总成员</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {members.filter((m) => m.permission === "owner").length}
              </div>
              <div className="text-sm text-gray-600">拥有者</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {members.filter((m) => m.permission === "edit_add").length}
              </div>
              <div className="text-sm text-gray-600">编辑权限</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {members.filter((m) => m.permission === "view_only" || m.permission === "add_only").length}
              </div>
              <div className="text-sm text-gray-600">受限权限</div>
            </div>
          </div>

          {/* 成员列表 */}
          <div className="space-y-3">
            <h3 className="font-medium">成员列表</h3>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-600">{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-600">{member.email}</div>
                      <div className="text-xs text-gray-500">加入于 {member.joinedAt}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {isOwner && member.permission !== "owner" ? (
                      <Select
                        value={member.permission}
                        onValueChange={(value) => handlePermissionChange(member.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="edit_add">
                            <div className="flex items-center">
                              <Edit3 className="mr-2 h-3 w-3" />
                              编辑权限
                            </div>
                          </SelectItem>
                          <SelectItem value="add_only">
                            <div className="flex items-center">
                              <Plus className="mr-2 h-3 w-3" />
                              仅添加
                            </div>
                          </SelectItem>
                          <SelectItem value="view_only">
                            <div className="flex items-center">
                              <Eye className="mr-2 h-3 w-3" />
                              仅查看
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={`${getPermissionColor(member.permission)}`}>
                        {getPermissionIcon(member.permission)}
                        <span className="ml-1">{getPermissionText(member.permission)}</span>
                      </Badge>
                    )}

                    {isOwner && member.permission !== "owner" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRemoveMember(member.id)} className="text-red-600">
                            <UserMinus className="mr-2 h-4 w-4" />
                            移除成员
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 权限说明 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 权限说明</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>
                • <strong>拥有者</strong>：完全控制权限，可以管理成员和删除账本
              </div>
              <div>
                • <strong>编辑权限</strong>：可以添加、编辑、删除记录
              </div>
              <div>
                • <strong>仅添加</strong>：只能添加新记录，不能编辑或删除
              </div>
              <div>
                • <strong>仅查看</strong>：只能查看记录和统计信息
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
