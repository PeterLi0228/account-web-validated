"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Bot, User, BookOpen, Plus, Edit3, Eye, Lock, Settings2, LayoutList } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import AppLayout from "../../components/AppLayout"
import { useAuth } from "@/contexts/AuthContext"
import { useBills } from "@/contexts/BillContext"
import type { Bill, Transaction, Category } from "@/types"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  suggestedRecord?: TransactionData
  isProcessing?: boolean
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
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { bills, currentBillId, setCurrentBillId, addTransaction } = useBills()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isAISending, setIsAISending] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [suggestedRecord, setSuggestedRecord] = useState<TransactionData | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const billId = params.id as string
  const currentBill = bills.find(bill => bill.id === billId)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (billId && billId !== currentBillId) {
      setCurrentBillId(billId)
    }
  }, [user, billId, currentBillId, setCurrentBillId, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const canEdit = currentBill?.permission === "owner" || currentBill?.permission === "edit_add" || currentBill?.permission === "add_only"

  const parseUserInput = useCallback((input: string): TransactionData | null => {
    const amountMatch = input.match(/(\d+(?:\.\d{1,2})?)/);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1]);
    const isIncome = /收入|赚|工资|奖金|红包|转账收到/.test(input);
    const type = isIncome ? "income" : "expense";

    // 简单的项目识别
    let item = "其他";
    if (/餐|饭|吃|食/.test(input)) item = "餐饮";
    else if (/交通|车|地铁|公交|打车|油费/.test(input)) item = "交通";
    else if (/购物|买|商场|超市/.test(input)) item = "购物";
    else if (/娱乐|电影|游戏|KTV/.test(input)) item = "娱乐";
    else if (/工资|薪水/.test(input)) item = "工资收入";

    // 找到对应的分类ID
    const category = currentBill?.categories.find(cat => 
      cat.type === type && cat.name.includes(item)
    ) || currentBill?.categories.find(cat => 
      cat.type === type && cat.name.includes(type === "income" ? "其他收入" : "其他支出")
    );

    return {
      type,
      date: new Date().toISOString().split('T')[0],
      item,
      amount,
      person: user?.user_metadata?.display_name || "我",
      note: "",
      category_id: category?.id || ""
    };
  }, [currentBill, user]);

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
      ])

      // 移除处理中消息
      setMessages((prev: Message[]) => prev.filter(m => m.id !== "ai-processing"));

      if (aiResponse.success) {
        // 尝试解析用户输入
        const parsedRecord = parseUserInput(currentInput)

        let aiContent = aiResponse.message
        let suggestedRecord: TransactionData | undefined = undefined

        if (parsedRecord && parsedRecord.amount > 0) {
          aiContent = `我帮你整理了一条${parsedRecord.type === "income" ? "收入" : "支出"}记录，请确认 👇`
          suggestedRecord = parsedRecord
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
    if (!suggestedRecord || !currentBill) return

    const result = await addTransaction(currentBill.id, suggestedRecord)
    
    if (!result.error) {
      setShowConfirmModal(false)
      setSuggestedRecord(null)
      
      const confirmMessage: Message = {
        id: Date.now().toString(),
        type: "ai",
        content: "✅ 记录已成功添加到账本中！",
        timestamp: new Date(),
      }
      setMessages((prev: Message[]) => [...prev, confirmMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!user) {
    return null
  }

  if (!currentBill) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">账本不存在或无权访问</p>
        </div>
      </AppLayout>
    )
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
                <p className="text-sm text-gray-500">当前账本：{currentBill.name}</p>
              </div>
            </div>
            <Badge className={`${
              canEdit ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}>
              {canEdit ? "可编辑" : "只读"}
            </Badge>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4 pb-20" ref={messagesEndRef as any}>
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6 text-center">
                  <Bot className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    👋 你好！我是你的AI记账助手
                  </h3>
                  <p className="text-blue-700 mb-4">
                    告诉我你的收支情况，我会帮你快速记录。例如：
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
                          </CardContent>
                        </Card>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={canEdit ? "描述你的收支情况..." : "当前账本为只读模式"}
                disabled={!canEdit || isAISending}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!canEdit || !inputValue.trim() || isAISending}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">类型</label>
                  <p className="text-sm text-gray-600">
                    {suggestedRecord.type === "income" ? "收入" : "支出"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">金额</label>
                  <p className="text-sm text-gray-600">¥{suggestedRecord.amount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">项目</label>
                  <p className="text-sm text-gray-600">{suggestedRecord.item}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">日期</label>
                  <p className="text-sm text-gray-600">{suggestedRecord.date}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmRecord}>
              确认添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
