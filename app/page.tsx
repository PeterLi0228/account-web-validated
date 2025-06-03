"use client"

import { useState, useEffect } from "react"
import { Plus, TrendingUp, TrendingDown, Wallet, Bot, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AddRecordModal from "./components/AddRecordModal"
import TransactionTable from "./components/TransactionTable"
import AppLayout from "./components/AppLayout"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useBills } from "@/contexts/BillContext"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { user } = useAuth()
  const { bills, currentBill, isLoading } = useBills()
  const router = useRouter()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState("current-month")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // 如果用户没有账本，跳转到账本管理页面
    if (!isLoading && bills.length === 0) {
      router.push('/bills')
    }
  }, [user, bills, isLoading, router])

  // 筛选交易记录
  const getFilteredTransactions = () => {
    if (!currentBill?.transactions) return []
    
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    return currentBill.transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date)

      switch (dateFilter) {
        case "current-month":
          return transactionDate.getFullYear() === currentYear && transactionDate.getMonth() === currentMonth
        case "last-month":
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
          return transactionDate.getFullYear() === lastMonthYear && transactionDate.getMonth() === lastMonth
        case "current-year":
          return transactionDate.getFullYear() === currentYear
        case "custom":
          if (!customStartDate || !customEndDate) return true
          const startDate = new Date(customStartDate)
          const endDate = new Date(customEndDate)
          return transactionDate >= startDate && transactionDate <= endDate
        case "all":
        default:
          return true
      }
    })
  }

  const filteredTransactions = getFilteredTransactions()

  // 计算统计数据
  const totalIncome = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense

  const incomeTransactions = filteredTransactions.filter((t) => t.type === "income")
  const expenseTransactions = filteredTransactions.filter((t) => t.type === "expense")

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case "current-month":
        return "本月"
      case "last-month":
        return "上月"
      case "current-year":
        return "本年"
      case "custom":
        return "自定义"
      case "all":
      default:
        return "全部"
    }
  }

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">加载中...</p>
        </div>
      </AppLayout>
    )
  }

  if (bills.length === 0) {
    return (
      <AppLayout>
        <div className="h-full flex flex-col items-center justify-center p-4 text-center">
          <Wallet className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">欢迎使用简记账</h2>
          <p className="text-gray-500 mb-4">
            您还没有创建任何账本，请先创建一个账本开始记账。
          </p>
          <Button onClick={() => router.push('/bills')}>创建账本</Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* 时间筛选器 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-700">
              <Filter className="mr-2 h-5 w-5" />
              时间筛选
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="date-filter">筛选时间</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger id="date-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current-month">本月</SelectItem>
                    <SelectItem value="last-month">上月</SelectItem>
                    <SelectItem value="current-year">本年</SelectItem>
                    <SelectItem value="custom">自定义时间</SelectItem>
                    <SelectItem value="all">全部时间</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateFilter === "custom" && (
                <>
                  <div className="flex-1">
                    <Label htmlFor="start-date">开始日期</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="end-date">结束日期</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {getDateFilterLabel()}收入
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ¥{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                共 {incomeTransactions.length} 笔收入
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {getDateFilterLabel()}支出
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ¥{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                共 {expenseTransactions.length} 笔支出
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {getDateFilterLabel()}结余
              </CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                ¥{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                收入 - 支出
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 快速操作 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            添加记录
          </Button>
          <Link href="/chat/1" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full">
              <Bot className="mr-2 h-4 w-4" />
              AI记账
            </Button>
          </Link>
        </div>

        {/* 交易记录表格 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>最近交易记录</span>
              <Badge variant="secondary">{filteredTransactions.length} 条记录</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionTable transactions={filteredTransactions} />
          </CardContent>
        </Card>
      </div>

      {/* 添加记录模态框 */}
      {currentBill && (
        <AddRecordModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          categories={currentBill.categories}
          billId={currentBill.id}
        />
      )}
    </AppLayout>
  )
}
