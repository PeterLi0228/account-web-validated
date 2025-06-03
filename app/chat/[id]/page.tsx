"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Bot, User, BookOpen, Plus, Edit3, Eye, Lock, Settings2, LayoutList, ChevronDown, ChevronUp } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import AppLayout from "../../components/AppLayout"
import RecordConfirmModal from "../../components/RecordConfirmModal"
import { useBills } from "@/contexts/BillContext"
import type { Bill, Transaction, Category } from "@/types"

// Define TransactionData for the form/parsing, omitting id and bill_id
type TransactionData = Omit<Transaction, 'id' | 'bill_id' | 'created_at' | 'category_name'>;

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  suggestedRecord?: TransactionData
  isProcessing?: boolean
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const {
    bills,
    currentBillId,
    setCurrentBillId,
    currentBill,
    addTransaction,
    isLoading: billsLoading,
    fetchBills,
  } = useBills()

  useEffect(() => {
    const paramBillId = params.id as string;
    if (paramBillId && paramBillId !== currentBillId) {
      setCurrentBillId(paramBillId);
    }
  }, [params.id, setCurrentBillId, currentBillId]);

  useEffect(() => {
    if (!bills.length) {
      fetchBills();
    }
  }, [bills.length, fetchBills]);

  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isAISending, setIsAISending] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [suggestedRecord, setSuggestedRecord] = useState<TransactionData | null>(null)
  const [showTransactions, setShowTransactions] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (currentBill) {
      setMessages([
        {
          id: "init-1",
          type: "ai",
          content: `你好！我是你的AI记账助手 💰 你正在操作账本「${currentBill.name}」。你可以用自然语言告诉我你的收支情况。`,
          timestamp: new Date(),
        },
        {
          id: "init-2",
          type: "ai",
          content: '💡 试试这些说法：\n• "今天吃饭花了50块"\n• "昨天收到工资3000元"\n• "打车花了25元"\n• "买衣服花了200块"',
          timestamp: new Date(),
        },
      ])
    } else if (!billsLoading && bills.length > 0 && !params.id) {
      console.warn("Current bill not found, consider redirecting or showing an error.");
    }
  }, [currentBill, billsLoading, bills.length, params.id, router]);

  const canEdit = currentBill && (currentBill.permission === "owner" || currentBill.permission === "edit_add" || currentBill.permission === "add_only")

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (currentBill && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentBill]);
  
  const parseUserInput = useCallback((input: string): TransactionData | null => {
    if (!currentBill) return null;

    const lowerInput = input.toLowerCase();
    let type: "income" | "expense" = "expense";
    let amount = 0;
    let item = "";
    const note = input;

    if (lowerInput.includes("收入") || lowerInput.includes("工资") || lowerInput.includes("奖金") || lowerInput.includes("赚了")) {
      type = "income";
    }

    const amountMatch = input.match(/(\d+(?:\.\d+)?)[元块钱块]?/);
    if (amountMatch) {
      amount = Number.parseFloat(amountMatch[1]);
    } else {
      return null; 
    }
    
    let foundCategoryId: string | undefined = undefined;
    const billCategories = currentBill.categories || [];

    if (type === "income") {
        item = "其他收入";
        if (lowerInput.includes("工资")) item = "工资收入";
        else if (lowerInput.includes("奖金")) item = "奖金";
        else if (lowerInput.includes("投资")) item = "投资收益";
        else if (lowerInput.includes("兼职")) item = "兼职收入";
        foundCategoryId = billCategories.find((c: Category) => c.type === "income" && c.name.includes(item.substring(0,2)))?.id || billCategories.find((c: Category) => c.type === "income")?.id;
    } else {
        item = "其他支出";
        if (lowerInput.includes("吃饭") || lowerInput.includes("用餐") || lowerInput.includes("餐")) item = "餐饮";
        else if (lowerInput.includes("交通") || lowerInput.includes("打车") || lowerInput.includes("地铁")) item = "交通";
        else if (lowerInput.includes("购物") || lowerInput.includes("买")) item = "购物";
        else if (lowerInput.includes("娱乐")) item = "娱乐";
        else if (lowerInput.includes("医疗")) item = "医疗";
        else if (lowerInput.includes("教育")) item = "教育";
        else if (lowerInput.includes("住房")) item = "住房";
        foundCategoryId = billCategories.find((c: Category) => c.type === "expense" && c.name.includes(item.substring(0,2)))?.id || billCategories.find((c: Category) => c.type === "expense")?.id;
    }

    if (!foundCategoryId) {
        console.warn("No matching category found, using a fallback. Please ensure categories are set.");
    }

    return {
      type,
      date: new Date().toISOString().split("T")[0],
      item,
      amount,
      person: "我",
      note,
      category_id: foundCategoryId || "uncategorized",
    };
  }, [currentBill]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !canEdit || !currentBill) return

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
    setMessages((prev: Message[]) => [...prev, {id: "ai-processing", type: "ai", content: "正在思考中...", timestamp: new Date(), isProcessing: true}])

    setTimeout(() => {
      setMessages((prev: Message[]) => prev.filter(m => m.id !== "ai-processing"));
      const parsedRecord = parseUserInput(currentInput)

      if (parsedRecord && parsedRecord.amount > 0) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: `我帮你整理了一条${parsedRecord.type === "income" ? "收入" : "支出"}记录，请确认 👇`,
          timestamp: new Date(),
          suggestedRecord: parsedRecord,
        }
        setMessages((prev: Message[]) => [...prev, aiMessage])
        setSuggestedRecord(parsedRecord)
        setShowConfirmModal(true)
      } else {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: "抱歉，我不太理解您的意思，或者您没有提供有效的金额。请尝试提供更明确的描述，例如：'购物花了50元'。",
          timestamp: new Date(),
        }
        setMessages((prev: Message[]) => [...prev, aiMessage])
      }
      setIsAISending(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleConfirmRecord = (confirmedRecord: TransactionData) => {
    if (!currentBill) return;
    addTransaction(currentBill.id, confirmedRecord);

    const confirmMessage: Message = {
      id: (Date.now() + 2).toString(),
      type: "ai",
      content: `✅ 记录已成功添加到「${currentBill.name}」！金额：${confirmedRecord.amount}，项目：${confirmedRecord.item}。继续告诉我其他收支情况吧~`,
      timestamp: new Date(),
    }
    setMessages((prev: Message[]) => [...prev, confirmMessage])
    setShowConfirmModal(false)
    setSuggestedRecord(null)
    if(inputRef.current) inputRef.current.focus();
  }
  
  const handleBillChange = (newBillId: string) => {
    if (newBillId !== currentBillId) {
      setCurrentBillId(newBillId)
      router.push(`/chat/${newBillId}`);
    }
  }
  
  if (billsLoading && !currentBill) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">正在加载账本数据...</p>
        </div>
      </AppLayout>
    );
  }

  if (!currentBill && !billsLoading) {
    return (
      <AppLayout>
        <div className="h-full flex flex-col items-center justify-center p-4 text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">未找到账本</h2>
          <p className="text-gray-500 mb-4">
            您尝试访问的账本不存在，或者您还没有创建任何账本。
          </p>
          <Button onClick={() => router.push('/bills')}>返回账本列表</Button>
        </div>
      </AppLayout>
    );
  }
  
  if (!currentBill) {
    return (
        <AppLayout>
            <div className="h-full flex items-center justify-center">
                <p>账本信息加载中或账本不存在...</p>
            </div>
        </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <header className="p-4 border-b bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <Select value={currentBillId || ""} onValueChange={handleBillChange}>
                <SelectTrigger className="w-auto min-w-[180px] max-w-[300px] text-lg font-semibold">
                  <SelectValue placeholder="选择账本..." />
                </SelectTrigger>
                <SelectContent>
                  {bills.map((bill: Bill) => (
                    <SelectItem key={bill.id} value={bill.id}>
                      {bill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentBill.permission && (
                 <Badge variant="outline" className={`text-xs ${currentBill.permission === "view_only" ? "text-gray-600" : currentBill.permission === "owner" ? "text-yellow-700" : "text-green-600" } ${currentBill.permission === "owner" ? "bg-yellow-100" : "bg-transparent"}`}>
                  {currentBill.permission === "owner" ? "拥有者" : currentBill.permission === "edit_add" ? "可编辑" : currentBill.permission === "add_only" ? "仅添加" : "仅查看"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" onClick={() => router.push('/bills')}>
                <LayoutList className="h-4 w-4 mr-2" />
                账本列表
              </Button>
            </div>
          </div>
          {currentBill.description && (
            <p className="text-xs text-gray-500 mt-2 ml-9 truncate">
              {currentBill.description}
            </p>
          )}
        </header>

        {/* Toggle Transactions Button and Transaction List Area */}
        {currentBill && currentBill.transactions && (
          <div className="px-4 pt-3 pb-1 border-b bg-white">
            <Button 
              variant="ghost" 
              className="w-full flex justify-between items-center text-sm text-gray-700 hover:bg-gray-100 py-2 px-3 rounded-md" 
              onClick={() => setShowTransactions(!showTransactions)}
            >
              <span>账本明细 ({currentBill.transactions.length} 条)</span>
              {showTransactions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        )}

        {showTransactions && currentBill && currentBill.transactions && currentBill.transactions.length > 0 && (
          <ScrollArea className="h-[200px] bg-gray-50/50 p-4 border-b">
            <div className="space-y-3">
              {currentBill.transactions.map((tx: Transaction) => (
                <div key={tx.id} className="p-3 bg-white rounded-lg shadow-sm border border-gray-200/80 text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-800 truncate max-w-[180px]">{tx.item}</span>
                    <span className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}¥{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex justify-between items-center">
                    <span>{currentBill.categories.find(c => c.id === tx.category_id)?.name || '未分类'}</span>
                    <span>{new Date(tx.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  {tx.note && <p className="text-xs text-gray-400 mt-1 truncate">备注: {tx.note}</p>}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        {showTransactions && currentBill && (!currentBill.transactions || currentBill.transactions.length === 0) && (
            <div className="text-center py-4 text-sm text-gray-400 bg-gray-50/50 border-b">
                当前账本还没有任何交易记录。
            </div>
        )}

        <ScrollArea className="flex-1 p-4 pb-20" ref={messagesEndRef as any}>
          <div className="space-y-4">
            {messages.map((msg: Message) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex items-end gap-2 max-w-[70%]">
                  {msg.type === "ai" && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white">
                      <Bot size={18} />
                    </div>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl shadow-sm ${
                      msg.type === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : msg.isProcessing 
                        ? "bg-gray-200 text-gray-600 italic rounded-bl-none"
                        : "bg-white text-gray-800 border border-gray-200/80 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.suggestedRecord && !msg.isProcessing && (
                      <div className="mt-3 pt-3 border-t border-gray-300/50">
                        <p className="text-xs text-gray-500 mb-1">
                          {`识别到${msg.suggestedRecord.type === "income" ? "收入" : "支出"}：${msg.suggestedRecord.item}，金额：${msg.suggestedRecord.amount}`}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full bg-white/80 hover:bg-gray-50"
                          onClick={() => {
                            setSuggestedRecord(msg.suggestedRecord!)
                            setShowConfirmModal(true)
                          }}
                        >
                          确认并添加到账本
                        </Button>
                      </div>
                    )}
                  </div>
                  {msg.type === "user" && (
                     <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                       <User size={18} />
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <footer className="p-4 border-t bg-white sticky bottom-0">
          {!canEdit && (
            <div className="text-center text-xs text-orange-600 mb-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
              <Lock size={12} className="inline mr-1" />
              当前账本为「仅查看」权限，无法添加记录。
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={canEdit ? "用自然语言描述你的收支，如：早餐花了10元" : "当前账本无记账权限"}
              className="flex-1 text-sm"
              disabled={!canEdit || isAISending}
            />
            <Button onClick={handleSendMessage} disabled={!inputValue.trim() || !canEdit || isAISending}>
              <Send className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">{isAISending ? "发送中..." : "发送"}</span>
            </Button>
          </div>
           <p className="text-xs text-gray-400 mt-2 text-center">
            AI记账助手由简记账提供，结果仅供参考。
          </p>
        </footer>
      </div>

      {showConfirmModal && suggestedRecord && currentBill && (
        <RecordConfirmModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false)
            setSuggestedRecord(null)
          }}
          initialRecord={suggestedRecord}
          categories={currentBill.categories || []}
          onConfirm={handleConfirmRecord}
          billName={currentBill.name}
        />
      )}
    </AppLayout>
  )
}
