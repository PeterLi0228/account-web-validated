"use client"

import { useState, useEffect } from "react"
import { Plus, TrendingUp, TrendingDown, Wallet, Bot, Filter, BookOpen, Calendar, RefreshCw } from "lucide-react"
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
  const { bills, currentBillId, setCurrentBillId, currentBill, isLoading, fetchBills } = useBills()
  const router = useRouter()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState("current-month")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // 只有在加载完成且确实没有任何账本（包括共享账本）时才跳转到账本管理页面
    if (!isLoading && bills.length === 0) {
      router.push('/bills')
      return
    }

    // 如果有账本但没有选中当前账本，自动选择第一个账本
    if (!isLoading && bills.length > 0 && !currentBillId) {
      setCurrentBillId(bills[0].id)
    }
  }, [user, bills, isLoading, currentBillId, setCurrentBillId, router])

  // 初始化选择账本
  useEffect(() => {
    if (bills.length > 0 && !currentBillId) {
      // 优先选择默认账本
      const defaultBill = bills.find(bill => bill.is_default)
      const billToSelect = defaultBill || bills[0]
      setCurrentBillId(billToSelect.id)
    }
  }, [bills, currentBillId])

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

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchBills()
    } catch (error) {
      console.error('刷新数据失败:', error)
    } finally {
      setIsRefreshing(false)
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
          <h2 className="text-xl font-semibold text-gray-700 mb-2">欢迎使用可记账</h2>
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
        {/* 筛选器 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-700">
              <Filter className="mr-2 h-5 w-5" />
              筛选设置
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 账本选择 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="bill-filter" className="font-medium">选择账本</Label>
                </div>
                <Select value={currentBillId || ""} onValueChange={setCurrentBillId}>
                  <SelectTrigger id="bill-filter">
                    <SelectValue placeholder="请选择账本" />
                  </SelectTrigger>
                  <SelectContent>
                    {bills.map((bill) => (
                      <SelectItem key={bill.id} value={bill.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{bill.name}</span>
                          <div className="flex items-center gap-2 ml-4">
                            {bill.isShared && (
                              <Badge variant="secondary" className="text-xs">
                                共享
                              </Badge>
                            )}
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                bill.permission === 'owner' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 
                                bill.permission === 'edit_add' ? 'bg-green-100 text-green-700 border-green-300' : 
                                bill.permission === 'add_only' ? 'bg-blue-100 text-blue-700 border-blue-300' : 
                                'bg-gray-100 text-gray-700 border-gray-300'
                              }`}
                            >
                              {bill.permission === 'owner' ? '拥有者' : 
                               bill.permission === 'edit_add' ? '编辑' : 
                               bill.permission === 'add_only' ? '添加' : '查看'}
                            </Badge>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 时间筛选 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="date-filter" className="font-medium">时间范围</Label>
                </div>
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

              {dateFilter === "custom" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="start-date" className="text-sm">开始日期</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                    <div>
                      <Label htmlFor="end-date" className="text-sm">结束日期</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                  </div>
              )}
              </div>
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
          <Button 
            onClick={() => setIsAddModalOpen(true)} 
            className="flex-1 sm:flex-none"
            disabled={!currentBill || (currentBill.permission === 'view_only')}
          >
            <Plus className="mr-2 h-4 w-4" />
            添加记录
          </Button>
          <Link href={`/chat/${currentBillId || '1'}`} className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full" disabled={!currentBill}>
              <Bot className="mr-2 h-4 w-4" />
              AI记账
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '刷新中...' : '刷新数据'}
          </Button>
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
            <TransactionTable 
              transactions={filteredTransactions} 
              canEdit={currentBill?.permission === 'owner' || currentBill?.permission === 'edit_add'}
              categories={currentBill?.categories}
              currentBill={currentBill || undefined}
            />
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
