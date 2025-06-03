"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, Calendar, Filter } from "lucide-react"
import AppLayout from "../components/AppLayout"

export default function ExportPage() {
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  })
  const [exportFormat, setExportFormat] = useState("csv")
  const [exportType, setExportType] = useState("all")

  const handleExport = () => {
    // 这里处理导出逻辑
    console.log("Exporting data:", { dateRange, exportFormat, exportType })
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
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
                      选择日期范围
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
                  >
                    <Download className="mr-2 h-5 w-5" />
                    开始导出
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
                      <span className="font-medium">127 条</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">收入记录</span>
                      <span className="font-medium text-green-600">45 条</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">支出记录</span>
                      <span className="font-medium text-red-600">82 条</span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">预计文件大小</span>
                        <span className="font-medium">~15 KB</span>
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
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    导出本月数据
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    导出本年数据
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
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
