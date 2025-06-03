"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, PieChart, BarChart3, Calendar } from "lucide-react"
import AppLayout from "../components/AppLayout"

export default function AnalyticsPage() {
  // 模拟数据
  const monthlyData = [
    { month: "1月", income: 8500, expense: 3200 },
    { month: "2月", income: 9200, expense: 2800 },
    { month: "3月", income: 7800, expense: 3500 },
    { month: "4月", income: 8900, expense: 3100 },
    { month: "5月", income: 9500, expense: 2900 },
    { month: "6月", income: 8700, expense: 3300 },
  ]

  const categoryData = [
    { category: "餐饮", amount: 1200, percentage: 35 },
    { category: "交通", amount: 800, percentage: 23 },
    { category: "购物", amount: 600, percentage: 18 },
    { category: "娱乐", amount: 400, percentage: 12 },
    { category: "其他", amount: 400, percentage: 12 },
  ]

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* 概览卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">本月收入</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-blue-600">¥8,700</div>
              <p className="text-xs text-blue-600/70">较上月 +5.2%</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">本月支出</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-red-600">¥3,300</div>
              <p className="text-xs text-red-600/70">较上月 +13.8%</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">净收入</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-green-600">¥5,400</div>
              <p className="text-xs text-green-600/70">储蓄率 62%</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">记录数量</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-purple-600">127</div>
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
              <div className="space-y-4">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium w-8">{data.month}</span>
                    <div className="flex-1 mx-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                            style={{ width: `${(data.income / 10000) * 100}%` }}
                          />
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full"
                            style={{ width: `${(data.expense / 10000) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-green-600 font-medium">¥{data.income.toLocaleString()}</div>
                      <div className="text-red-600">¥{data.expense.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="space-y-4">
                {categoryData.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"][index],
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
                            backgroundColor: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"][index],
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{category.percentage}%</span>
                      <span className="text-sm font-medium w-16 text-right">¥{category.amount}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">总支出</span>
                  <span className="font-bold text-red-600">¥3,400</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
