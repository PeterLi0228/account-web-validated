"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, PieChart, BarChart3, Calendar, BookOpen } from "lucide-react"
import AppLayout from "../components/AppLayout"
import { useAuth } from "@/contexts/AuthContext"
import { useBills } from "@/contexts/BillContext"
import { useRouter } from "next/navigation"
import type { Transaction, Bill } from "@/types"

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { bills, currentBillId, setCurrentBillId, isLoading } = useBills()
  const router = useRouter()
  const [selectedBillId, setSelectedBillId] = useState<string>("")

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (bills.length > 0 && !selectedBillId) {
      const billToSelect = currentBillId || bills[0].id
      setSelectedBillId(billToSelect)
      if (billToSelect !== currentBillId) {
        setCurrentBillId(billToSelect)
      }
    }
  }, [user, bills, currentBillId, selectedBillId, setCurrentBillId, router])

  const selectedBill = bills.find(bill => bill.id === selectedBillId)

  // 计算月度数据
  const monthlyData = useMemo(() => {
    if (!selectedBill?.transactions) return []

    const monthlyStats: { [key: string]: { income: number; expense: number } } = {}
    const now = new Date()
    
    // 生成最近6个月的数据
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('zh-CN', { month: 'short' })
      monthlyStats[key] = { income: 0, expense: 0 }
    }

    selectedBill.transactions.forEach(transaction => {
      const date = new Date(transaction.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (monthlyStats[key]) {
        if (transaction.type === 'income') {
          monthlyStats[key].income += transaction.amount
        } else {
          monthlyStats[key].expense += transaction.amount
        }
      }
    })

    return Object.entries(monthlyStats).map(([key, data]) => {
      const [year, month] = key.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return {
        month: date.toLocaleDateString('zh-CN', { month: 'short' }),
        income: data.income,
        expense: data.expense
      }
    })
  }, [selectedBill])

  // 计算分类数据
  const categoryData = useMemo(() => {
    if (!selectedBill?.transactions || !selectedBill?.categories) return []

    const categoryStats: { [key: string]: { amount: number; name: string } } = {}
    const totalExpense = selectedBill.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    selectedBill.transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const category = selectedBill.categories.find(c => c.id === transaction.category_id)
        const categoryName = category?.name || '其他'
        
        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = { amount: 0, name: categoryName }
        }
        categoryStats[categoryName].amount += transaction.amount
      })

    return Object.values(categoryStats)
      .map(category => ({
        category: category.name,
        amount: category.amount,
        percentage: totalExpense > 0 ? Math.round((category.amount / totalExpense) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [selectedBill])

  // 计算当月统计
  const currentMonthStats = useMemo(() => {
    if (!selectedBill?.transactions) return { income: 0, expense: 0, count: 0, netIncome: 0 }

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const currentMonthTransactions = selectedBill.transactions.filter(transaction => {
      const date = new Date(transaction.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    const income = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      income,
      expense,
      count: currentMonthTransactions.length,
      netIncome: income - expense
    }
  }, [selectedBill])

  // 计算增长率
  const growthRate = useMemo(() => {
    if (monthlyData.length < 2) return { income: 0, expense: 0 }
    
    const current = monthlyData[monthlyData.length - 1]
    const previous = monthlyData[monthlyData.length - 2]
    
    const incomeGrowth = previous.income > 0 
      ? ((current.income - previous.income) / previous.income) * 100 
      : 0
    
    const expenseGrowth = previous.expense > 0 
      ? ((current.expense - previous.expense) / previous.expense) * 100 
      : 0

    return {
      income: Math.round(incomeGrowth * 10) / 10,
      expense: Math.round(expenseGrowth * 10) / 10
    }
  }, [monthlyData])

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
          <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">暂无数据分析</h2>
          <p className="text-gray-500 mb-4">
            您还没有创建任何账本，请先创建账本并添加交易记录。
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* 账本选择器 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
                数据分析
              </span>
              <div className="w-64">
                <Select value={selectedBillId} onValueChange={(value) => {
                  setSelectedBillId(value)
                  setCurrentBillId(value)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择账本" />
                  </SelectTrigger>
                  <SelectContent>
                    {bills.map((bill) => (
                      <SelectItem key={bill.id} value={bill.id}>
                        {bill.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* 概览卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">本月收入</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-blue-600">
                ¥{currentMonthStats.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-blue-600/70">
                较上月 {growthRate.income >= 0 ? '+' : ''}{growthRate.income}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">本月支出</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-red-600">
                ¥{currentMonthStats.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-red-600/70">
                较上月 {growthRate.expense >= 0 ? '+' : ''}{growthRate.expense}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">净收入</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-xl lg:text-2xl font-bold ${currentMonthStats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ¥{currentMonthStats.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-green-600/70">
                储蓄率 {currentMonthStats.income > 0 ? Math.round((currentMonthStats.netIncome / currentMonthStats.income) * 100) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">记录数量</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-purple-600">{currentMonthStats.count}</div>
              <p className="text-xs text-purple-600/70">本月记录</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* 月度趋势图 */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
                月度收支趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <div className="space-y-4">
                  {monthlyData.map((data, index) => {
                    const maxAmount = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)))
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium w-8">{data.month}</span>
                        <div className="flex-1 mx-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                                style={{ width: `${maxAmount > 0 ? (data.income / maxAmount) * 100 : 0}%` }}
                              />
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full"
                                style={{ width: `${maxAmount > 0 ? (data.expense / maxAmount) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-green-600 font-medium">¥{data.income.toLocaleString()}</div>
                          <div className="text-red-600">¥{data.expense.toLocaleString()}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>暂无数据</p>
                </div>
              )}
              <div className="flex justify-center space-x-6 mt-6 pt-4 border-t">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full mr-2" />
                  <span className="text-sm text-gray-600">收入</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-red-600 rounded-full mr-2" />
                  <span className="text-sm text-gray-600">支出</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 支出分类饼图 */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="mr-2 h-5 w-5 text-purple-600" />
                支出分类分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"][index % 5],
                          }}
                        />
                        <span className="text-sm font-medium">{category.category}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${category.percentage}%`,
                              backgroundColor: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"][index % 5],
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{category.percentage}%</span>
                        <span className="text-sm font-medium w-16 text-right">¥{category.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">总支出</span>
                      <span className="font-bold text-red-600">
                        ¥{categoryData.reduce((sum, cat) => sum + cat.amount, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>暂无支出数据</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
