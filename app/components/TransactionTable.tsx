"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import { useBills } from "@/contexts/BillContext"
import type { Transaction, Category } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TransactionTableProps {
  transactions: Transaction[]
  canEdit?: boolean
  categories?: Category[]
}

export default function TransactionTable({ transactions, canEdit = false, categories }: TransactionTableProps) {
  const { fetchBills } = useBills()
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const formatAmount = (amount: number) => {
    return `¥${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowEditModal(true)
  }

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          item: editingTransaction.item,
          amount: editingTransaction.amount,
          date: editingTransaction.date,
          note: editingTransaction.note
        })
        .eq('id', editingTransaction.id)

      if (error) {
        console.error('更新交易记录失败:', error)
        return
      }

      // 刷新账本数据
      await fetchBills()
      
      setShowEditModal(false)
      setEditingTransaction(null)
    } catch (error) {
      console.error('更新交易记录失败:', error)
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('确定要删除这条记录吗？')) return

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)

      if (error) {
        console.error('删除交易记录失败:', error)
        return
      }

      // 刷新账本数据
      await fetchBills()
    } catch (error) {
      console.error('删除交易记录失败:', error)
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>暂无交易记录</p>
        <p className="text-sm mt-1">点击上方按钮添加记录</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">日期</TableHead>
              <TableHead className="w-20">分类</TableHead>
              <TableHead className="text-right w-20">金额</TableHead>
              <TableHead className="w-16">经办人</TableHead>
              <TableHead className="w-32">备注</TableHead>
              {canEdit && <TableHead className="w-10"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              // 由于transaction.item存储的是具体的分类名称，直接使用item作为分类显示
              const categoryName = transaction.item
              
              return (
                <TableRow key={transaction.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-sm">{formatDate(transaction.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {categoryName || "未分类"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-bold text-sm ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {transaction.type === "income" ? "+" : "-"}{formatAmount(transaction.amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {transaction.person || "未知"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600 truncate max-w-32">
                      {transaction.note || "-"}
                    </p>
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                            <Edit className="mr-2 h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* 编辑交易记录对话框 */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="mr-2 h-5 w-5 text-blue-600" />
              编辑交易记录
            </DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">金额</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingTransaction.amount}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">分类</label>
                <Select 
                  value={editingTransaction.category_id && editingTransaction.item ? `${editingTransaction.category_id}_${editingTransaction.item}` : ""} 
                  onValueChange={(value) => {
                    // value格式为 "originalId_categoryName"
                    const [originalId, categoryName] = value.split('_')
                    setEditingTransaction({ 
                      ...editingTransaction, 
                      category_id: originalId,
                      item: categoryName
                    })
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      ?.filter(cat => cat.type === editingTransaction.type)
                      .flatMap((category) => {
                        // 将分号分隔的分类名称拆分成单独的选项
                        const categoryNames = category.name.split(';').map(name => name.trim()).filter(name => name)
                        return categoryNames.map(name => ({
                          id: `${category.original_id || category.id}_${name}`,
                          name: name,
                          originalId: category.original_id || category.id
                        }))
                      })
                      .map((categoryOption) => (
                        <SelectItem key={categoryOption.id} value={categoryOption.id}>
                          {categoryOption.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">日期</label>
                <Input
                  type="date"
                  value={editingTransaction.date}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">经办人</label>
                <Input
                  value={editingTransaction.person || ''}
                  readOnly
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>
              <div>
                <label className="text-sm font-medium">备注</label>
                <Input
                  value={editingTransaction.note || ''}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, note: e.target.value })}
                  placeholder="备注信息"
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditModal(false)
                setEditingTransaction(null)
              }}
            >
              取消
            </Button>
            <Button 
              onClick={handleUpdateTransaction}
              disabled={!editingTransaction}
            >
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
