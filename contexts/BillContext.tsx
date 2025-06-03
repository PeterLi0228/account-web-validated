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
  addTransaction: (billId: string, transaction: Omit<Transaction, 'id' | 'bill_id' | 'user_id' | 'created_at'>) => Promise<{ error?: string }>
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
      // 获取用户拥有的账本
      console.log('fetchBills: 查询用户拥有的账本...')
      const { data: ownedBills, error: ownedError } = await supabase
        .from('bills')
        .select('*')
        .eq('owner_id', user.id)

      if (ownedError) {
        console.error('fetchBills: 查询拥有的账本失败:', ownedError.message || ownedError)
        throw ownedError
      }
      console.log('fetchBills: 拥有的账本:', ownedBills)

      // 获取用户参与的账本
      console.log('fetchBills: 查询用户参与的账本...')
      const { data: memberBills, error: memberError } = await supabase
        .from('bill_members')
        .select(`
          permission,
          bills (*)
        `)
        .eq('user_id', user.id)

      if (memberError) {
        console.error('fetchBills: 查询参与的账本失败:', memberError.message || memberError)
        throw memberError
      }
      console.log('fetchBills: 参与的账本:', memberBills)

      // 合并账本数据
      const allBills: Bill[] = []
      
      // 添加拥有的账本
      if (ownedBills) {
        for (const bill of ownedBills) {
          allBills.push({
            ...bill,
            permission: 'owner',
            memberCount: 1,
            createdAt: bill.created_at.split('T')[0],
            isShared: false,
            owner: user.user_metadata?.display_name || user.email || '未知用户',
            categories: [],
            transactions: []
          })
        }
      }

      // 添加参与的账本
      if (memberBills) {
        for (const member of memberBills) {
          if (member.bills) {
            const memberBill = member.bills as any
            allBills.push({
              ...memberBill,
              permission: member.permission,
              memberCount: 1,
              createdAt: memberBill.created_at.split('T')[0],
              isShared: true,
              owner: '其他用户',
              categories: [],
              transactions: []
            })
          }
        }
      }

      console.log('fetchBills: 合并后的账本列表:', allBills)

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

        // 获取交易
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('bill_id', bill.id)
          .order('date', { ascending: false })

        if (transactionsError) {
          console.error('获取交易失败:', transactionsError.message)
        }

        bill.categories = categories || []
        bill.transactions = transactions || []
      }

      console.log('fetchBills: 最终账本列表:', allBills)
      setBills(allBills)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取账本失败'
      console.error('fetchBills: 获取账本失败:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const createBill = async (name: string, description?: string) => {
    if (!user) return { error: '用户未登录' }

    try {
      console.log('开始创建账本:', { name, userId: user.id })
      
      // 使用正确的insert格式，不包含description字段
      const { data, error } = await supabase
        .from('bills')
        .insert([{
          owner_id: user.id,
          name: name
        }])
        .select()

      if (error) {
        console.error('创建账本失败:', error.message || error)
        return { error: error.message || '创建账本失败' }
      }

      if (!data || data.length === 0) {
        return { error: '创建账本失败：未返回数据' }
      }

      const newBill = data[0]
      console.log('账本创建成功:', newBill)

      // 创建默认分类
      const defaultCategories = [
        { name: '工资收入', type: 'income' as const },
        { name: '其他收入', type: 'income' as const },
        { name: '餐饮', type: 'expense' as const },
        { name: '交通', type: 'expense' as const },
        { name: '购物', type: 'expense' as const },
        { name: '娱乐', type: 'expense' as const },
        { name: '其他支出', type: 'expense' as const }
      ]

      console.log('开始创建默认分类...')
      const categoryInserts = defaultCategories.map(category => ({
        bill_id: newBill.id,
        user_id: user.id,
        name: category.name,
        type: category.type
      }))

      const { error: categoryError } = await supabase
        .from('categories')
        .insert(categoryInserts)

      if (categoryError) {
        console.error('创建默认分类失败:', categoryError.message || categoryError)
      }

      console.log('开始刷新账本列表...')
      await fetchBills()
      console.log('账本创建流程完成')
      return {}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建账本失败'
      console.error('创建账本异常:', errorMessage)
      return { error: errorMessage }
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
      return {}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '添加交易失败'
      console.error('添加交易异常:', errorMessage)
      return { error: errorMessage }
    }
  }

  const createCategory = async (billId: string, name: string, type: 'income' | 'expense') => {
    if (!user) return { error: '用户未登录' }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          bill_id: billId,
          user_id: user.id,
          name: name,
          type: type
        }])
        .select()

      if (error) {
        console.error('创建分类失败:', error.message || error)
        return { error: error.message || '创建分类失败' }
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