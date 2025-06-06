"use client";

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import type { Bill, Category, Transaction } from '@/types'

interface BillContextType {
  bills: Bill[]
  currentBillId: string | null
  currentBill: Bill | null
  isLoading: boolean
  setCurrentBillId: (billId: string) => void
  fetchBills: () => Promise<void>
  createBill: (name: string, description?: string) => Promise<{ error?: string }>
  addTransaction: (billId: string, transaction: Omit<Transaction, 'id' | 'bill_id' | 'user_id' | 'created_at'>) => Promise<{ error?: string; data?: Transaction }>
  createCategory: (billId: string, name: string, type: 'income' | 'expense') => Promise<{ error?: string }>
}

const BillContext = createContext<BillContextType | undefined>(undefined)

export function BillProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [bills, setBills] = useState<Bill[]>([])
  const [currentBillId, setCurrentBillId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const currentBill = bills.find(bill => bill.id === currentBillId) || null

  const fetchBills = async () => {
    if (!user) {
      console.log('fetchBills: 用户未登录')
      return
    }
    
    console.log('fetchBills: 开始获取账本列表, 用户ID:', user.id)
    setIsLoading(true)
    try {
      // 新逻辑：先查询用户参与的所有账本（包括作为拥有者和成员的）
      console.log('fetchBills: 查询用户参与的所有账本...')
      const { data: memberBills, error: memberError } = await supabase
        .from('bill_members')
        .select(`
          permission,
          bills (*, is_default)
        `)
        .eq('user_id', user.id)

      if (memberError) {
        console.error('fetchBills: 查询参与的账本失败:', memberError.message || memberError)
        throw memberError
      }
      console.log('fetchBills: 参与的账本:', memberBills)

      // 合并账本数据
      const allBills: Bill[] = []
      const addedBillIds = new Set<string>() // 用于避免重复添加账本
      
      // 处理用户参与的账本
      if (memberBills) {
        for (const member of memberBills) {
          if (member.bills) {
            const memberBill = member.bills as any
            if (!addedBillIds.has(memberBill.id)) {
              // 检查用户是否是账本拥有者
              const isOwner = memberBill.owner_id === user.id
              
              allBills.push({
                ...memberBill,
                permission: isOwner ? 'owner' : member.permission,
                memberCount: 1,
                createdAt: memberBill.created_at.split('T')[0],
                isShared: !isOwner,
                owner: isOwner ? (user.user_metadata?.display_name || user.email || '未知用户') : '其他用户',
                categories: [],
                transactions: []
              })
              addedBillIds.add(memberBill.id)
            }
          }
        }
      }

      console.log('fetchBills: 处理后的账本列表:', allBills)

      // 为每个账本获取分类和交易
      for (const bill of allBills) {
        // 获取分类
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('bill_id', bill.id)

        if (categoriesError) {
          console.error('获取分类失败:', categoriesError.message)
        }

        // 将合并的分类字符串拆分为单独的分类对象
        const expandedCategories: any[] = []
        if (categories) {
          for (const category of categories) {
            const categoryNames = category.name.split(';')
            for (const name of categoryNames) {
              if (name.trim()) {
                expandedCategories.push({
                  id: `${category.id}_${name.trim()}`, // 生成唯一ID
                  bill_id: category.bill_id,
                  user_id: category.user_id,
                  name: name.trim(),
                  type: category.type,
                  created_at: category.created_at,
                  original_id: category.id // 保存原始ID用于后续操作
                })
              }
            }
          }
        }

        bill.categories = expandedCategories

        // 获取交易
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('bill_id', bill.id)
          .order('date', { ascending: false })

        if (transactionsError) {
          console.error('获取交易失败:', transactionsError.message)
        }

        bill.transactions = transactions || []
      }

      console.log('fetchBills: 最终账本列表:', allBills)
      setBills(allBills)

      // 检查是否有默认账本，有的话优先选择默认账本
      const defaultBill = allBills.find(bill => bill.is_default)
      console.log('fetchBills: 查找默认账本:', defaultBill)
      
      if (defaultBill) {
        console.log('fetchBills: 发现默认账本，设置为当前账本:', defaultBill.name)
        setCurrentBillId(defaultBill.id)
      } else if (!currentBillId && allBills.length > 0) {
        // 检查用户是否有自己创建的账本
        const ownedBills = allBills.filter(bill => bill.permission === 'owner')
        const sharedBills = allBills.filter(bill => bill.permission !== 'owner')
        
        if (ownedBills.length > 0) {
          // 如果有自己创建的账本，选择第一个拥有的账本
          const billToSelect = ownedBills[0]
          console.log('fetchBills: 选择第一个拥有的账本:', billToSelect.name)
          setCurrentBillId(billToSelect.id)
        } else if (sharedBills.length === 1) {
          // 如果没有自己的账本，但只有一个共享账本，设置为默认
          const billToSelect = sharedBills[0]
          console.log('fetchBills: 只有一个共享账本，设置为当前账本:', billToSelect.name)
          setCurrentBillId(billToSelect.id)
        } else if (allBills.length > 0) {
          // 其他情况，选择第一个账本
          const billToSelect = allBills[0]
          console.log('fetchBills: 选择第一个账本:', billToSelect.name)
          setCurrentBillId(billToSelect.id)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取账本失败'
      console.error('fetchBills: 获取账本失败:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const createBill = async (name: string, description?: string): Promise<{ error?: string }> => {
    if (!user) return { error: '用户未登录' }

    try {
      // 检查用户是否参与了任何账本（包括作为拥有者和成员的）
      const { data: existingMembers, error: checkError } = await supabase
        .from('bill_members')
        .select('id')
        .eq('user_id', user.id)
      
      if (checkError) {
        console.error('检查现有账本失败:', checkError)
        return { error: '创建账本失败' }
      }

      const isFirstBill = !existingMembers || existingMembers.length === 0

      const { data, error } = await supabase
        .from('bills')
        .insert({
          owner_id: user.id,
          name,
          description,
          is_default: isFirstBill // 第一个账本自动设为默认
        })
        .select()
        .single()

      if (error) {
        console.error('创建账本失败:', error)
        return { error: '创建账本失败' }
      }

      const newBill = data
      console.log('账本创建成功:', newBill)

      // 重要：为账本创建者添加成员记录，确保可以查看和管理账本
      console.log('开始为账本创建者添加成员记录...')
      const { error: memberError } = await supabase
        .from('bill_members')
        .insert({
          bill_id: newBill.id,
          user_id: user.id,
          permission: 'edit_add' // 创建者默认拥有编辑权限
        })

      if (memberError) {
        console.error('创建成员记录失败:', memberError.message || memberError)
        return { error: '创建账本失败：无法添加成员记录' }
      } else {
        console.log('成员记录创建成功')
      }

      // 创建默认分类（合并同类型分类）
      const incomeCategories = ['工资收入', '其他收入']
      const expenseCategories = ['餐饮', '交通', '购物', '娱乐', '其他支出']

      console.log('开始创建默认分类...')
      const categoryInserts = [
        {
          bill_id: newBill.id,
          user_id: user.id,
          name: incomeCategories.join(';'), // 使用分号分隔收入分类
          type: 'income'
        },
        {
          bill_id: newBill.id,
          user_id: user.id,
          name: expenseCategories.join(';'), // 使用分号分隔支出分类
          type: 'expense'
        }
      ]

      const { error: categoryError } = await supabase
        .from('categories')
        .insert(categoryInserts)

      if (categoryError) {
        console.error('创建默认分类失败:', categoryError.message || categoryError)
      } else {
        console.log('默认分类创建成功')
      }

      await fetchBills()
      return {}
    } catch (error) {
      console.error('创建账本失败:', error)
      return { error: '创建账本失败' }
    }
  }

  const addTransaction = async (billId: string, transaction: Omit<Transaction, 'id' | 'bill_id' | 'user_id' | 'created_at'>) => {
    if (!user) return { error: '用户未登录' }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transaction,
          bill_id: billId,
          user_id: user.id
        }])
        .select()

      if (error) {
        console.error('添加交易失败:', error.message || error)
        return { error: error.message || '添加交易失败' }
      }

      await fetchBills()
      return { data: data[0] }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '添加交易失败'
      console.error('添加交易异常:', errorMessage)
      return { error: errorMessage }
    }
  }

  const createCategory = async (billId: string, name: string, type: 'income' | 'expense') => {
    if (!user) return { error: '用户未登录' }

    // 验证分类名称不能包含分号分隔符
    if (name.includes(';')) {
      return { error: '分类名称不能包含分号(;)字符' }
    }

    // 验证分类名称不能为空
    if (!name.trim()) {
      return { error: '分类名称不能为空' }
    }

    try {
      // 首先查找是否已存在该类型的分类记录
      const { data: existingCategories, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('bill_id', billId)
        .eq('type', type)

      if (fetchError) {
        console.error('查询现有分类失败:', fetchError.message)
        return { error: '查询现有分类失败' }
      }

      if (existingCategories && existingCategories.length > 0) {
        // 如果已存在该类型的分类，则更新现有记录
        const existingCategory = existingCategories[0]
        const currentNames = existingCategory.name.split(';').map((n: string) => n.trim()).filter((n: string) => n)
        
        // 检查是否已存在该分类名称
        if (currentNames.includes(name.trim())) {
          return { error: '该分类已存在' }
        }

        // 添加新分类名称
        currentNames.push(name.trim())
        const updatedName = currentNames.join(';')

        const { error: updateError } = await supabase
          .from('categories')
          .update({ name: updatedName })
          .eq('id', existingCategory.id)

        if (updateError) {
          console.error('更新分类失败:', updateError.message)
          return { error: '更新分类失败' }
        }
      } else {
        // 如果不存在该类型的分类，则创建新记录
        const { error: insertError } = await supabase
        .from('categories')
        .insert([{
          bill_id: billId,
          user_id: user.id,
            name: name.trim(),
          type: type
        }])

        if (insertError) {
          console.error('创建分类失败:', insertError.message)
          return { error: '创建分类失败' }
        }
      }

      await fetchBills()
      return {}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建分类失败'
      console.error('创建分类异常:', errorMessage)
      return { error: errorMessage }
    }
  }

  useEffect(() => {
    if (user) {
      fetchBills()
    } else {
      setBills([])
      setCurrentBillId(null)
    }
  }, [user])

  const value = {
    bills,
    currentBillId,
    currentBill,
    isLoading,
    setCurrentBillId,
    fetchBills,
    createBill,
    addTransaction,
    createCategory
  }

  return <BillContext.Provider value={value}>{children}</BillContext.Provider>
}

export function useBills() {
  const context = useContext(BillContext)
  if (context === undefined) {
    throw new Error('useBills must be used within a BillProvider')
  }
  return context
} 