"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, MoreHorizontal, Crown, Edit3, Plus, Eye, UserMinus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Bill, BillMember } from "@/types"

interface ManageMembersModalProps {
  isOpen: boolean
  onClose: () => void
  bill: Bill | null
  onRefresh: () => void
}

interface MemberWithUser extends BillMember {
  user_email?: string
  user_display_name?: string
}

export default function ManageMembersModal({ isOpen, onClose, bill, onRefresh }: ManageMembersModalProps) {
  const [members, setMembers] = useState<MemberWithUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newMemberUsername, setNewMemberUsername] = useState("")
  const [newMemberPermission, setNewMemberPermission] = useState<'edit_add' | 'add_only' | 'view_only'>('view_only')
  const [isAdding, setIsAdding] = useState(false)

  const fetchMembers = async () => {
    if (!bill) return

    setIsLoading(true)
    try {
      // 获取账本成员
      const { data: membersData, error: membersError } = await supabase
        .from('bill_members')
        .select('*')
        .eq('bill_id', bill.id)

      if (membersError) {
        console.error('获取成员失败:', membersError)
        return
      }

      // 过滤掉账本拥有者的成员记录（因为拥有者已经单独显示）
      const filteredMembersData = (membersData || []).filter(member => member.user_id !== bill.owner_id)

      // 获取成员的用户信息
      const membersWithUser: MemberWithUser[] = []
      for (const member of filteredMembersData) {
        try {
          // 使用public_user_profiles表获取用户信息
          const { data: userData, error: userError } = await supabase
            .from('public_user_profiles')
            .select('email, display_name')
            .eq('id', member.user_id)
            .single()

          if (!userError && userData) {
            membersWithUser.push({
              ...member,
              user_email: userData.email,
              user_display_name: userData.display_name
            })
          } else {
            membersWithUser.push(member)
          }
        } catch (error) {
          console.error('获取用户信息失败:', error)
          membersWithUser.push(member)
        }
      }

      setMembers(membersWithUser)
    } catch (error) {
      console.error('获取成员失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && bill) {
      fetchMembers()
    }
  }, [isOpen, bill])

  const handleAddMember = async () => {
    if (!bill || !newMemberUsername.trim()) return

    setIsAdding(true)
    try {
      // 构造完整的邮箱地址
      const emailAddress = `${newMemberUsername.trim()}@like.com`
      
      // 获取当前用户信息
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        alert('请先登录')
        return
      }

      // 检查是否是当前用户自己
      if (currentUser.email === emailAddress) {
        alert('不能添加自己为账本成员')
        return
      }

      // 使用public_user_profiles表查找用户
      console.log('查找用户:', emailAddress)
      const { data: userData, error: userError } = await supabase
        .from('public_user_profiles')
        .select('id, email, display_name')
        .eq('email', emailAddress)
        .single()

      console.log('查找用户结果:', userData, userError)

      if (userError || !userData) {
        console.error('查找用户失败:', userError)
        alert(`未找到用户名"${newMemberUsername}"对应的用户`)
        return
      }

      const targetUserId = userData.id
      console.log('目标用户ID:', targetUserId)

      // 检查是否试图添加账本拥有者
      if (targetUserId === bill.owner_id) {
        alert('不能添加账本拥有者为成员')
        return
      }

      // 检查是否已经是成员
      const { data: existingMember, error: checkError } = await supabase
        .from('bill_members')
        .select('id')
        .eq('bill_id', bill.id)
        .eq('user_id', targetUserId)
        .single()

      console.log('检查现有成员:', existingMember, checkError)

      if (existingMember) {
        alert('该用户已经是账本成员')
        return
      }

      // 添加成员
      console.log('添加成员:', { bill_id: bill.id, user_id: targetUserId, permission: newMemberPermission })
      const { error: addError } = await supabase
        .from('bill_members')
        .insert({
          bill_id: bill.id,
          user_id: targetUserId,
          permission: newMemberPermission
        })

      console.log('添加成员结果:', addError)

      if (addError) {
        console.error('添加成员失败:', addError)
        alert(`添加成员失败: ${addError.message}`)
        return
      }

      setNewMemberUsername("")
      setNewMemberPermission('view_only')
      await fetchMembers()
      onRefresh()
    } catch (error) {
      console.error('添加成员失败:', error)
      alert('添加成员失败')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('确定要移除该成员吗？')) return

    try {
      const { error } = await supabase
        .from('bill_members')
        .delete()
        .eq('id', memberId)

      if (error) {
        console.error('移除成员失败:', error)
        alert('移除成员失败')
        return
      }

      await fetchMembers()
      onRefresh()
    } catch (error) {
      console.error('移除成员失败:', error)
      alert('移除成员失败')
    }
  }

  const handleUpdatePermission = async (memberId: string, newPermission: string) => {
    try {
      const { error } = await supabase
        .from('bill_members')
        .update({ permission: newPermission })
        .eq('id', memberId)

      if (error) {
        console.error('更新权限失败:', error)
        alert('更新权限失败')
        return
      }

      await fetchMembers()
      onRefresh()
    } catch (error) {
      console.error('更新权限失败:', error)
      alert('更新权限失败')
    }
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
        return "无权限"
    }
  }

  const getPermissionColor = (permission: string) => {
    switch (permission) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-blue-600" />
            管理成员 - {bill?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 添加新成员 */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">添加新成员</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  placeholder="输入用户名"
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                  disabled={isAdding}
                />
              </div>
              <div>
                <Label htmlFor="permission">权限</Label>
                <Select value={newMemberPermission} onValueChange={(value: any) => setNewMemberPermission(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view_only">仅查看</SelectItem>
                    <SelectItem value="add_only">仅添加</SelectItem>
                    <SelectItem value="edit_add">编辑权限</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleAddMember} 
                  disabled={!newMemberUsername.trim() || isAdding}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isAdding ? "添加中..." : "添加"}
                </Button>
              </div>
            </div>
          </div>

          {/* 成员列表 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">当前成员</h3>
              <Badge variant="secondary">{members.length + 1} 人</Badge>
                  </div>

            {isLoading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>成员</TableHead>
                      <TableHead>权限</TableHead>
                      <TableHead className="w-20">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* 账本拥有者 */}
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Crown className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium">{bill?.owner || "账本拥有者"}</span>
                          <Badge variant="outline" className="text-xs">拥有者</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-100 text-yellow-700">
                          <Crown className="h-3 w-3 mr-1" />
                          拥有者
                        </Badge>
                      </TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>

                    {/* 其他成员 */}
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>{member.user_display_name || member.user_email || "未知用户"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                      <Select
                        value={member.permission}
                            onValueChange={(value) => handleUpdatePermission(member.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                              <SelectItem value="view_only">仅查看</SelectItem>
                              <SelectItem value="add_only">仅添加</SelectItem>
                              <SelectItem value="edit_add">编辑权限</SelectItem>
                        </SelectContent>
                      </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
              ))}
                  </TableBody>
                </Table>
              </div>
            )}
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
