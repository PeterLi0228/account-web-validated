"use client"

import { useState } from "react"
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

// 模拟数据
const mockTransactions = [
  {
    id: "1",
    type: "income" as const,
    date: "2024-01-15",
    item: "工资收入",
    amount: 8500,
    person: "张三",
    note: "月度工资",
  },
  {
    id: "2",
    type: "expense" as const,
    date: "2024-01-14",
    item: "超市购物",
    amount: 268,
    person: "李四",
    note: "日用品采购",
  },
  {
    id: "3",
    type: "income" as const,
    date: "2024-01-13",
    item: "兼职收入",
    amount: 1200,
    person: "张三",
    note: "",
  },
  {
    id: "4",
    type: "expense" as const,
    date: "2024-01-12",
    item: "餐饮消费",
    amount: 89,
    person: "王五",
    note: "午餐",
  },
  {
    id: "5",
    type: "expense" as const,
    date: "2023-12-28",
    item: "购买书籍",
    amount: 150,
    person: "张三",
    note: "技术书籍",
  },
  {
    id: "6",
    type: "income" as const,
    date: "2023-12-25",
    item: "年终奖",
    amount: 5000,
    person: "张三",
    note: "年终奖金",
  },
]

export default function HomePage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [transactions, setTransactions] = useState(mockTransactions)
  const [dateFilter, setDateFilter] = useState("current-month")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")

  // 筛选交易记录
  const getFilteredTransactions = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    return transactions.filter((transaction) => {
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

  const handleAddTransaction = (transaction: any) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
    }
    setTransactions([newTransaction, ...transactions])
  }

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">总收入</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-green-600">¥{totalIncome.toLocaleString()}</div>
              <p className="text-xs text-green-600/70 mt-1">{getDateFilterLabel()}累计收入</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">总支出</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-red-600">¥{totalExpense.toLocaleString()}</div>
              <p className="text-xs text-red-600/70 mt-1">{getDateFilterLabel()}累计支出</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">当前余额</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-xl lg:text-2xl font-bold ${balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                ¥{balance.toLocaleString()}
              </div>
              <p className="text-xs text-blue-600/70 mt-1">收入减去支出</p>
            </CardContent>
          </Card>
        </div>

        {/* 快捷操作 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            添加记录
          </Button>

          <Button
            asChild
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <Link href="/chat/1">
              <Bot className="mr-2 h-5 w-5" />
              AI智能记账
            </Link>
          </Button>
        </div>

        {/* 收支明细 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-red-700">
                <TrendingDown className="mr-2 h-5 w-5" />
                支出明细
                <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700">
                  {expenseTransactions.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable transactions={expenseTransactions} type="expense" />
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <TrendingUp className="mr-2 h-5 w-5" />
                收入明细
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                  {incomeTransactions.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionTable transactions={incomeTransactions} type="income" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 添加记录弹窗 */}
      <AddRecordModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddTransaction} />
    </AppLayout>
  )
}
