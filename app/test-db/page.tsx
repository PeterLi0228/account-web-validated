"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Database, Loader2 } from 'lucide-react'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'pending'
  message: string
}

export default function TestDatabasePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const runTests = async () => {
    setIsLoading(true)
    setResults([])
    
    const tests: TestResult[] = []

    // 测试1: 数据库连接
    try {
      const { data, error } = await supabase.from('bills').select('count').limit(1)
      if (error) throw error
      tests.push({
        name: '数据库连接',
        status: 'success',
        message: '连接成功'
      })
    } catch (error: any) {
      tests.push({
        name: '数据库连接',
        status: 'error',
        message: error.message || '连接失败'
      })
    }

    // 测试2: bills表
    try {
      const { data, error } = await supabase.from('bills').select('*').limit(1)
      if (error) throw error
      tests.push({
        name: 'bills表',
        status: 'success',
        message: '表结构正确'
      })
    } catch (error: any) {
      tests.push({
        name: 'bills表',
        status: 'error',
        message: error.message || '表不存在或结构错误'
      })
    }

    // 测试3: categories表
    try {
      const { data, error } = await supabase.from('categories').select('*').limit(1)
      if (error) throw error
      tests.push({
        name: 'categories表',
        status: 'success',
        message: '表结构正确'
      })
    } catch (error: any) {
      tests.push({
        name: 'categories表',
        status: 'error',
        message: error.message || '表不存在或结构错误'
      })
    }

    // 测试4: transactions表
    try {
      const { data, error } = await supabase.from('transactions').select('*').limit(1)
      if (error) throw error
      tests.push({
        name: 'transactions表',
        status: 'success',
        message: '表结构正确'
      })
    } catch (error: any) {
      tests.push({
        name: 'transactions表',
        status: 'error',
        message: error.message || '表不存在或结构错误'
      })
    }

    // 测试5: bill_members表
    try {
      const { data, error } = await supabase.from('bill_members').select('*').limit(1)
      if (error) throw error
      tests.push({
        name: 'bill_members表',
        status: 'success',
        message: '表结构正确'
      })
    } catch (error: any) {
      tests.push({
        name: 'bill_members表',
        status: 'error',
        message: error.message || '表不存在或结构错误'
      })
    }

    // 测试6: ai_logs表
    try {
      const { data, error } = await supabase.from('ai_logs').select('*').limit(1)
      if (error) throw error
      tests.push({
        name: 'ai_logs表',
        status: 'success',
        message: '表结构正确'
      })
    } catch (error: any) {
      tests.push({
        name: 'ai_logs表',
        status: 'error',
        message: error.message || '表不存在或结构错误'
      })
    }

    // 测试7: 认证功能
    try {
      const { data: { user } } = await supabase.auth.getUser()
      tests.push({
        name: '认证功能',
        status: 'success',
        message: user ? `当前用户: ${user.email}` : '未登录用户'
      })
    } catch (error: any) {
      tests.push({
        name: '认证功能',
        status: 'error',
        message: error.message || '认证功能异常'
      })
    }

    // 测试8: 拥有的账本查询权限
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('bills')
          .select('*, is_default')
          .eq('owner_id', user.id)
        
        if (error) throw error
        tests.push({
          name: '拥有的账本查询',
          status: 'success',
          message: `查询成功，找到 ${data?.length || 0} 个拥有的账本`
        })
      } else {
        tests.push({
          name: '拥有的账本查询',
          status: 'error',
          message: '用户未登录'
        })
      }
    } catch (error: any) {
      tests.push({
        name: '拥有的账本查询',
        status: 'error',
        message: error.message || '查询失败'
      })
    }

    // 测试9: 参与的账本查询权限
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('bill_members')
          .select(`
            permission,
            bills (*, is_default)
          `)
          .eq('user_id', user.id)
        
        if (error) throw error
        
        // 详细分析结果
        let message = `查询成功，参与 ${data?.length || 0} 个账本`
        if (data && data.length > 0) {
          const details = data.map(item => {
            const bill = item.bills as any
            return `${bill?.name || '未知账本'}(权限:${item.permission})`
          }).join(', ')
          message += ` - ${details}`
        }
        
        tests.push({
          name: '参与的账本查询',
          status: 'success',
          message: message
        })
      } else {
        tests.push({
          name: '参与的账本查询',
          status: 'error',
          message: '用户未登录'
        })
      }
    } catch (error: any) {
      tests.push({
        name: '参与的账本查询',
        status: 'error',
        message: error.message || '查询失败'
      })
    }

    // 测试11: 直接查询 bill_members 表
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data, error } = await supabase
          .from('bill_members')
          .select('*')
          .eq('user_id', user.id)
        
        if (error) throw error
        
        let message = `找到 ${data?.length || 0} 条成员记录`
        if (data && data.length > 0) {
          const details = data.map(item => `账本ID:${item.bill_id}, 权限:${item.permission}`).join('; ')
          message += ` - ${details}`
        }
        
        tests.push({
          name: '直接查询bill_members表',
          status: 'success',
          message: message
        })
      } else {
        tests.push({
          name: '直接查询bill_members表',
          status: 'error',
          message: '用户未登录'
        })
      }
    } catch (error: any) {
      tests.push({
        name: '直接查询bill_members表',
        status: 'error',
        message: error.message || '查询失败'
      })
    }

    // 测试12: 模拟完整的 fetchBills 逻辑
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // 完全模拟 BillContext 中的 fetchBills 逻辑
        const { data: memberBills, error: memberError } = await supabase
          .from('bill_members')
          .select(`
            permission,
            bills (*, is_default)
          `)
          .eq('user_id', user.id)

        if (memberError) throw memberError

        let message = `模拟fetchBills: 查询成功，参与 ${memberBills?.length || 0} 个账本`
        
        if (memberBills && memberBills.length > 0) {
          const details = memberBills.map(member => {
            const bill = member.bills as any
            const isOwner = bill?.owner_id === user.id
            return `${bill?.name || '未知账本'}(${isOwner ? 'owner' : member.permission})`
          }).join(', ')
          message += ` - ${details}`
        }
        
        tests.push({
          name: '模拟完整fetchBills逻辑',
          status: 'success',
          message: message
        })
      } else {
        tests.push({
          name: '模拟完整fetchBills逻辑',
          status: 'error',
          message: '用户未登录'
        })
      }
    } catch (error: any) {
      tests.push({
        name: '模拟完整fetchBills逻辑',
        status: 'error',
        message: error.message || '查询失败'
      })
    }

    // 测试10: 创建账本和成员记录权限
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // 创建测试账本
        const { data: billData, error: billError } = await supabase
          .from('bills')
          .insert({
            owner_id: user.id,
            name: '权限测试账本_' + Date.now()
          })
          .select()
          .single()

        if (billError) throw billError

        // 为自己添加成员记录
        const { data: memberData, error: memberError } = await supabase
          .from('bill_members')
          .insert({
            bill_id: billData.id,
            user_id: user.id,
            permission: 'edit_add'
          })
          .select()
          .single()

        if (memberError) throw memberError

        tests.push({
          name: '创建账本和成员记录',
          status: 'success',
          message: `成功创建账本 "${billData.name}" 和成员记录`
        })
      } else {
        tests.push({
          name: '创建账本和成员记录',
          status: 'error',
          message: '用户未登录'
        })
      }
    } catch (error: any) {
      tests.push({
        name: '创建账本和成员记录',
        status: 'error',
        message: error.message || '创建失败'
      })
    }

    setResults(tests)
    setIsLoading(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">成功</Badge>
      case 'error':
        return <Badge variant="destructive">失败</Badge>
      default:
        return <Badge variant="secondary">测试中</Badge>
    }
  }

  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Database className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            数据库连接测试
          </h1>
          <p className="text-gray-600 mt-2">
            验证 Supabase 数据库连接和表结构
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              测试控制
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                点击开始测试按钮验证数据库设置
              </div>
              <Button 
                onClick={runTests} 
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    测试中...
                  </>
                ) : (
                  '开始测试'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>测试结果</span>
                <div className="flex gap-2">
                  {successCount > 0 && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      成功: {successCount}
                    </Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge variant="destructive">
                      失败: {errorCount}
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <div className="font-medium">{result.name}</div>
                        <div className="text-sm text-gray-600">{result.message}</div>
                      </div>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {errorCount > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">需要修复的问题</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-red-700 space-y-2">
                <p>检测到数据库配置问题，请按以下步骤修复：</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>确认 Supabase 项目已创建</li>
                  <li>检查 .env.local 文件中的配置</li>
                  <li>在 Supabase SQL 编辑器中执行 DATABASE_SETUP.md 中的 SQL 语句</li>
                  <li>确认所有表都已创建并启用了 RLS</li>
                  <li>重新运行测试</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        {successCount === results.length && results.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">🎉 数据库设置完成！</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-green-700">
                <p>所有测试都通过了！您的数据库已正确配置，可以开始使用简记账应用了。</p>
                <div className="mt-4">
                  <Button asChild>
                    <a href="/">返回首页</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 