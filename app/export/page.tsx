"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, Calendar, Filter, BookOpen } from "lucide-react"
import AppLayout from "../components/AppLayout"
import { useAuth } from "@/contexts/AuthContext"
import { useBills } from "@/contexts/BillContext"
import { useRouter } from "next/navigation"
import type { Transaction } from "@/types"

export default function ExportPage() {
  const { user } = useAuth()
  const { bills, currentBillId, setCurrentBillId, isLoading } = useBills()
  const router = useRouter()
  const [selectedBillId, setSelectedBillId] = useState<string>("")
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  })
  const [exportFormat, setExportFormat] = useState("csv")
  const [exportType, setExportType] = useState("all")
  const [isExporting, setIsExporting] = useState(false)

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

  // 筛选要导出的交易记录
  const filteredTransactions = useMemo(() => {
    if (!selectedBill?.transactions) return []

    let transactions = selectedBill.transactions

    // 按类型筛选
    if (exportType === "income") {
      transactions = transactions.filter(t => t.type === "income")
    } else if (exportType === "expense") {
      transactions = transactions.filter(t => t.type === "expense")
    }

    // 按日期筛选
    if (dateRange.startDate && dateRange.endDate) {
      const startDate = new Date(dateRange.startDate)
      const endDate = new Date(dateRange.endDate)
      transactions = transactions.filter(t => {
        const transactionDate = new Date(t.date)
        return transactionDate >= startDate && transactionDate <= endDate
      })
    }

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [selectedBill, exportType, dateRange])

  // 计算统计信息
  const stats = useMemo(() => {
    const incomeTransactions = filteredTransactions.filter(t => t.type === "income")
    const expenseTransactions = filteredTransactions.filter(t => t.type === "expense")
    
    return {
      total: filteredTransactions.length,
      income: incomeTransactions.length,
      expense: expenseTransactions.length,
      totalIncome: incomeTransactions.reduce((sum, t) => sum + t.amount, 0),
      totalExpense: expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
    }
  }, [filteredTransactions])

  // 生成CSV内容
  const generateCSV = (transactions: Transaction[]) => {
    const headers = ['日期', '类型', '项目', '金额', '分类', '经办人', '备注']
    const rows = transactions.map(transaction => {
      const category = selectedBill?.categories.find(c => c.id === transaction.category_id)
      return [
        transaction.date,
        transaction.type === 'income' ? '收入' : '支出',
        transaction.item,
        transaction.amount.toString(),
        category?.name || '',
        transaction.person || '',
        transaction.note || ''
      ]
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    return csvContent
  }

  // 下载文件
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    if (!selectedBill || filteredTransactions.length === 0) return

    setIsExporting(true)

    try {
      const timestamp = new Date().toISOString().split('T')[0]
      const billName = selectedBill.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
      
      if (exportFormat === "csv") {
        const csvContent = generateCSV(filteredTransactions)
        downloadFile(csvContent, `${billName}_交易记录_${timestamp}.csv`, 'text/csv;charset=utf-8;')
      } else if (exportFormat === "excel") {
        // 简单的Excel格式（实际上是CSV，但Excel可以打开）
        const csvContent = generateCSV(filteredTransactions)
        downloadFile(csvContent, `${billName}_交易记录_${timestamp}.xls`, 'application/vnd.ms-excel')
      }
    } catch (error) {
      console.error('导出失败:', error)
    }

    setIsExporting(false)
  }

  const handleQuickExport = async (type: 'current-month' | 'current-year' | 'all') => {
    if (!selectedBill) return

    const now = new Date()
    let startDate = ""
    let endDate = ""

    switch (type) {
      case 'current-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        break
      case 'current-year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
        endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
        break
      case 'all':
        // 不设置日期范围
        break
    }

    // 临时设置日期范围并导出
    const originalDateRange = { ...dateRange }
    setDateRange({ startDate, endDate })
    
    // 等待状态更新后再导出
    setTimeout(() => {
      handleExport()
      setDateRange(originalDateRange)
    }, 100)
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
          <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">暂无数据导出</h2>
          <p className="text-gray-500 mb-4">
            您还没有创建任何账本，请先创建账本并添加交易记录。
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* 账本选择器 */}
          <Card className="shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Download className="mr-2 h-5 w-5 text-blue-600" />
                  数据导出
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* 导出设置 */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-blue-600" />
                    导出设置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 日期范围 */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      选择日期范围（可选）
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">开始日期</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">结束日期</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={dateRange.endDate}
                          onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 导出类型 */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      导出内容
                    </Label>
                    <Select value={exportType} onValueChange={setExportType}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择导出内容" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部记录</SelectItem>
                        <SelectItem value="income">仅收入记录</SelectItem>
                        <SelectItem value="expense">仅支出记录</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 导出格式 */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">导出格式</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card
                        className={`cursor-pointer transition-all ${
                          exportFormat === "csv" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => setExportFormat("csv")}
                      >
                        <CardContent className="p-4 text-center">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
                          <p className="font-medium">CSV 格式</p>
                          <p className="text-sm text-gray-600">适用于 Excel</p>
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer transition-all ${
                          exportFormat === "excel" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => setExportFormat("excel")}
                      >
                        <CardContent className="p-4 text-center">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                          <p className="font-medium">Excel 格式</p>
                          <p className="text-sm text-gray-600">包含格式化</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* 导出按钮 */}
                  <Button
                    onClick={handleExport}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                    disabled={isExporting || !selectedBill || filteredTransactions.length === 0}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    {isExporting ? "导出中..." : "开始导出"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* 导出预览和快速导出 */}
            <div className="space-y-6">
              {/* 数据预览 */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">数据预览</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">总记录数</span>
                      <span className="font-medium">{stats.total} 条</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">收入记录</span>
                      <span className="font-medium text-green-600">{stats.income} 条</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">支出记录</span>
                      <span className="font-medium text-red-600">{stats.expense} 条</span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">总收入</span>
                        <span className="font-medium text-green-600">¥{stats.totalIncome.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">总支出</span>
                        <span className="font-medium text-red-600">¥{stats.totalExpense.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">预计文件大小</span>
                        <span className="font-medium">~{Math.max(1, Math.round(stats.total * 0.1))} KB</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 快速导出 */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">快速导出</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleQuickExport('current-month')}
                    disabled={isExporting || !selectedBill}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    导出本月数据
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleQuickExport('current-year')}
                    disabled={isExporting || !selectedBill}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    导出本年数据
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleQuickExport('all')}
                    disabled={isExporting || !selectedBill}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    导出全部数据
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
