"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Bot, User, BookOpen, Plus, Edit3, Eye, Lock, Settings2, LayoutList, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import AppLayout from "../components/AppLayout"
import { useAuth } from "@/contexts/AuthContext"
import { useBills } from "@/contexts/BillContext"
import { supabase } from "@/lib/supabase"
import type { Bill, Transaction, Category, AILog } from "@/types"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  suggestedRecord?: TransactionData
  isProcessing?: boolean
  linkedTransactionId?: string // 关联的交易记录ID
}

interface TransactionData {
  type: "income" | "expense"
  date: string
  item: string
  amount: number
  person: string
  note: string
  category_id: string
}

export default function ChatPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { bills, currentBillId, setCurrentBillId, addTransaction, fetchBills } = useBills()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isAISending, setIsAISending] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [suggestedRecord, setSuggestedRecord] = useState<TransactionData | null>(null)
  const [selectedBillId, setSelectedBillId] = useState<string>("")
  const [isConfirming, setIsConfirming] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<any>(null)

  // 获取当前选中的账本
  const currentBill = bills.find(bill => bill.id === selectedBillId)

  // 滚动到底部的函数
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
    // 备用方案：直接操作ScrollArea
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [])

  // 初始化选择最近的账本
  useEffect(() => {
    if (bills.length > 0 && !selectedBillId) {
      // 优先选择默认账本
      const defaultBill = bills.find(bill => bill.is_default)
      const billToSelect = defaultBill || bills.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
      setSelectedBillId(billToSelect.id)
    }
  }, [bills, selectedBillId])

  // 加载聊天历史
  const loadChatHistory = useCallback(async () => {
    if (!selectedBillId || !user) return

    setIsLoadingHistory(true)
    try {
      const { data: aiLogs, error } = await supabase
        .from('ai_logs')
        .select('*')
        .eq('bill_id', selectedBillId)
        .order('created_at', { ascending: false })
        .limit(15)

      if (error) {
        console.error('加载聊天历史失败:', error.message || error)
        return
      }

      if (aiLogs && aiLogs.length > 0) {
        const historyMessages: Message[] = aiLogs
          .reverse() // 反转顺序，让最新的在底部
          .map((log: any) => ({
          id: log.id,
          type: log.role === 'user' ? 'user' : 'ai',
          content: log.content,
            timestamp: new Date(log.created_at),
            linkedTransactionId: log.linked_transaction_id
        }))

        setMessages(historyMessages)
      } else {
        setMessages([])
      }
    } catch (error) {
      console.error('加载聊天历史异常:', error instanceof Error ? error.message : '未知错误')
    } finally {
      setIsLoadingHistory(false)
    }
  }, [selectedBillId, user])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, router])

  // 当选择的账本改变时，加载聊天历史
  useEffect(() => {
    if (selectedBillId && user) {
      loadChatHistory()
    }
  }, [selectedBillId, user, loadChatHistory])

  // 确保在消息更新后滚动到底部
  useEffect(() => {
    if (!isLoadingHistory) {
      // 使用requestAnimationFrame确保DOM已更新
      requestAnimationFrame(() => {
        setTimeout(scrollToBottom, 50)
      })
    }
  }, [messages, isLoadingHistory, scrollToBottom])

  const canEdit = currentBill?.permission === "owner" || currentBill?.permission === "edit_add" || currentBill?.permission === "add_only"



  const handleSendMessage = async () => {
    if (!inputValue.trim() || !canEdit || !currentBill || !user) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }
    setMessages((prev: Message[]) => [...prev, userMessage])
    
    const currentInput = inputValue;
    setInputValue("")
    setIsAISending(true)

    // 保存用户消息到数据库
    const { saveAILog } = await import('@/lib/ai')
    await saveAILog(currentBill.id, user.id, 'user', currentInput)

    // 添加处理中消息
    setMessages((prev: Message[]) => [...prev, {id: "ai-processing", type: "ai", content: "正在思考中...", timestamp: new Date(), isProcessing: true}])

    try {
      // 调用AI服务
      const { sendChatMessage } = await import('@/lib/ai')
      const chatHistory = messages.slice(-5).map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }))
      
      const aiResponse = await sendChatMessage([
        ...chatHistory,
        { role: 'user', content: currentInput }
      ], currentBill?.categories)

      // 移除处理中消息
      setMessages((prev: Message[]) => prev.filter(m => m.id !== "ai-processing"));

      if (aiResponse.success) {
        let aiContent = aiResponse.message
        let suggestedRecord: TransactionData | undefined = undefined

        // 尝试解析AI返回的JSON格式
        try {
          const jsonMatch = aiResponse.message.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[1]);
            if (jsonData.type && jsonData.amount && jsonData.amount > 0) {
              // 找到对应的分类ID
              let category = null;
              
              // 首先尝试根据AI推荐的分类名称匹配
              if (jsonData.category) {
                category = currentBill?.categories.find(cat => 
                  cat.type === jsonData.type && 
                  cat.name.split(';').some(catName => 
                    catName.trim().includes(jsonData.category) || 
                    jsonData.category.includes(catName.trim())
                  )
                );
              }

              // 如果找到分类，使用分类中的第一个名称作为item
              // 如果没找到分类，item为空，让用户手动选择分类
              const item = category ? category.name.split(';')[0].trim() : "";

              suggestedRecord = {
                type: jsonData.type,
                date: new Date().toISOString().split('T')[0],
                item: item,
                amount: jsonData.amount,
                person: user?.user_metadata?.display_name || "我",
                note: jsonData.description || "", // 具体描述作为备注
                category_id: category?.original_id || category?.id || ""
              };

              aiContent = jsonData.message || `我帮你整理了一条${jsonData.type === "income" ? "收入" : "支出"}记录，请确认 👇`;
            }
          }
        } catch (error) {
          console.log('AI返回的不是JSON格式，使用原始回复');
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: aiContent,
          timestamp: new Date(),
          suggestedRecord: suggestedRecord,
        }

        setMessages((prev: Message[]) => [...prev, aiMessage])

        // 保存AI回复到数据库
        await saveAILog(currentBill.id, user.id, 'assistant', aiContent)

        if (suggestedRecord) {
          setSuggestedRecord(suggestedRecord)
          setShowConfirmModal(true)
        }
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: aiResponse.message,
          timestamp: new Date(),
        }
        setMessages((prev: Message[]) => [...prev, errorMessage])
      }
    } catch (error) {
      // 移除处理中消息
      setMessages((prev: Message[]) => prev.filter(m => m.id !== "ai-processing"));
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "抱歉，AI服务暂时不可用，请稍后重试。",
        timestamp: new Date(),
      }
      setMessages((prev: Message[]) => [...prev, errorMessage])
    }

    setIsAISending(false)
  }

  const handleConfirmRecord = async () => {
    if (!suggestedRecord || !currentBill || isConfirming) return

    setIsConfirming(true)

    try {
    const result = await addTransaction(currentBill.id, suggestedRecord)
    
      if (!result.error && result.data) {
      setShowConfirmModal(false)
      setSuggestedRecord(null)
      
      // 移除所有消息中的suggestedRecord，以隐藏"确认添加记录"按钮
      setMessages((prev: Message[]) => prev.map(msg => ({
        ...msg,
        suggestedRecord: undefined
      })))
      
      const confirmMessage: Message = {
        id: Date.now().toString(),
        type: "ai",
        content: "✅ 记录已成功添加到账本中！",
        timestamp: new Date(),
        linkedTransactionId: result.data.id, // 关联交易记录ID，用于显示编辑按钮
      }
      setMessages((prev: Message[]) => [...prev, confirmMessage])

        // 保存确认消息到数据库，关联交易记录ID
        const { saveAILogWithTransaction } = await import('@/lib/ai')
        await saveAILogWithTransaction(currentBill.id, user!.id, 'assistant', "✅ 记录已成功添加到账本中！", result.data.id)
      }
    } catch (error) {
      console.error('确认记录失败:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleBillChange = (billId: string) => {
    setSelectedBillId(billId)
    setMessages([]) // 清空当前消息
  }

  // 获取交易记录详情
  const handleEditTransaction = async (transactionId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (error) {
        console.error('获取交易记录失败:', error)
        return
      }

      if (data) {
        setEditingTransaction(data)
        setShowEditModal(true)
      }
    } catch (error) {
      console.error('获取交易记录失败:', error)
    }
  }

  // 更新交易记录
  const handleUpdateTransaction = async (transactionData: Partial<Transaction>) => {
    if (!editingTransaction) return

    try {
      const { error } = await supabase
        .from('transactions')
        .update(transactionData)
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

  if (!user) {
    return null
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">AI智能记账</h1>
                <p className="text-sm text-gray-500">选择账本开始记账</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Select value={selectedBillId} onValueChange={handleBillChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="选择账本" />
                </SelectTrigger>
                <SelectContent>
                  {bills.map((bill) => (
                    <SelectItem key={bill.id} value={bill.id}>
                      <div className="flex items-center space-x-2">
                        <span>{bill.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {bill.permission === "owner" ? "拥有者" : 
                           bill.permission === "edit_add" ? "编辑" :
                           bill.permission === "add_only" ? "添加" : "查看"}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentBill && (
                <Badge className={`${
                  canEdit ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}>
                  {canEdit ? "可编辑" : "只读"}
                </Badge>
              )}
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef as any}>
          <div className="max-w-3xl mx-auto space-y-4 pb-4">
            {!currentBill && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-6 text-center">
                  <Bot className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                    请选择一个账本
                  </h3>
                  <p className="text-yellow-700">
                    在上方下拉框中选择一个账本开始AI记账
                  </p>
                </CardContent>
              </Card>
            )}

            {currentBill && isLoadingHistory && (
              <div className="text-center py-4">
                <p className="text-gray-500">加载聊天历史中...</p>
              </div>
            )}

            {currentBill && !isLoadingHistory && messages.length === 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6 text-center">
                  <Bot className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    👋 你好！我是你的AI记账助手
                  </h3>
                  <p className="text-blue-700 mb-4">
                    告诉我你的收支情况，我会帮你快速记录到「{currentBill.name}」账本中。例如：
                  </p>
                  <div className="space-y-2 text-sm text-blue-600">
                    <p>• "今天午餐花了25元"</p>
                    <p>• "收到工资8000元"</p>
                    <p>• "打车回家花了15块"</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === "ai" && (
                      <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>
                      {message.suggestedRecord && (
                        <Card className="mt-2 bg-white border">
                          <CardContent className="p-3">
                            <div className="space-y-2 text-xs text-gray-700">
                              <div className="flex justify-between">
                                <span>类型:</span>
                                <Badge variant={message.suggestedRecord.type === "income" ? "default" : "destructive"}>
                                  {message.suggestedRecord.type === "income" ? "收入" : "支出"}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>项目:</span>
                                <span>{message.suggestedRecord.item}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>金额:</span>
                                <span className="font-semibold">¥{message.suggestedRecord.amount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>日期:</span>
                                <span>{message.suggestedRecord.date}</span>
                              </div>
                            </div>
                            <div className="mt-3 pt-2 border-t">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSuggestedRecord(message.suggestedRecord!)
                                  setShowConfirmModal(true)
                                }}
                                className="w-full text-xs"
                              >
                                确认添加记录
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {/* 为包含linkedTransactionId的消息添加编辑按钮 */}
                      {message.type === "ai" && message.linkedTransactionId && canEdit && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTransaction(message.linkedTransactionId!)}
                            className="text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            编辑记录
                          </Button>
                        </div>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  !currentBill ? "请先选择账本" :
                  canEdit ? "描述你的收支情况..." : "当前账本为只读模式"
                }
                disabled={!currentBill || !canEdit || isAISending}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentBill || !canEdit || !inputValue.trim() || isAISending}
                className="px-4"
              >
                {isAISending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 确认记录对话框 */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认添加记录</DialogTitle>
          </DialogHeader>
          {suggestedRecord && (
            <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">类型</label>
                <Select 
                  value={suggestedRecord.type} 
                  onValueChange={(value: "income" | "expense") => 
                    setSuggestedRecord({ ...suggestedRecord, type: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">收入</SelectItem>
                    <SelectItem value="expense">支出</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">分类</label>
                <Select 
                  value={suggestedRecord.category_id ? `${suggestedRecord.category_id}_${suggestedRecord.item}` : ""} 
                  onValueChange={(value) => {
                    // value格式为 "originalId_categoryName"
                    const [originalId, categoryName] = value.split('_')
                    setSuggestedRecord({ 
                      ...suggestedRecord, 
                      category_id: originalId,
                      item: categoryName
                    })
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentBill?.categories
                      .filter(cat => cat.type === suggestedRecord.type)
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
                  <label className="text-sm font-medium">金额</label>
                <Input
                  type="number"
                  step="0.01"
                  value={suggestedRecord.amount}
                  onChange={(e) => setSuggestedRecord({ 
                    ...suggestedRecord, 
                    amount: parseFloat(e.target.value) || 0 
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">日期</label>
                <Input
                  type="date"
                  value={suggestedRecord.date}
                  onChange={(e) => setSuggestedRecord({ 
                    ...suggestedRecord, 
                    date: e.target.value 
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">备注</label>
                <Input
                  value={suggestedRecord.note}
                  onChange={(e) => setSuggestedRecord({ 
                    ...suggestedRecord, 
                    note: e.target.value 
                  })}
                  placeholder="备注信息（可选）"
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmModal(false)}
              disabled={isConfirming}
            >
              取消
            </Button>
            <Button 
              onClick={handleConfirmRecord}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  添加中...
                </>
              ) : (
                "确认添加"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    {currentBill?.categories
                      .filter(cat => cat.type === editingTransaction.type)
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
              onClick={() => handleUpdateTransaction(editingTransaction!)}
              disabled={!editingTransaction}
            >
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
} 