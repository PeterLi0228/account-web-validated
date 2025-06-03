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
    if (!user) return
    
    setIsLoading(true)
    try {
      // 获取用户拥有的账本
      const { data: ownedBills, error: ownedError } = await supabase
        .from('bills')
        .select('*')
        .eq('owner_id', user.id)

      if (ownedError) throw ownedError

      // 获取用户参与的账本
      const { data: memberBills, error: memberError } = await supabase
        .from('bill_members')
        .select(`
          permission,
          bills (*)
        `)
        .eq('user_id', user.id)

      if (memberError) throw memberError

      // 合并账本数据
      const allBills: Bill[] = []
      
      // 添加拥有的账本
      if (ownedBills) {
        for (const bill of ownedBills) {
          allBills.push({
            ...bill,
            permission: 'owner',
            categories: [],
            transactions: []
          })
        }
      }

      // 添加参与的账本
      if (memberBills) {
        for (const member of memberBills) {
          if (member.bills) {
            allBills.push({
              ...member.bills as any,
              permission: member.permission,
              categories: [],
              transactions: []
            })
          }
        }
      }

      // 为每个账本获取分类和交易
      for (const bill of allBills) {
        // 获取分类
        const { data: categories } = await supabase
          .from('categories')
          .select('*')
          .eq('bill_id', bill.id)

        // 获取交易
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('bill_id', bill.id)
          .order('date', { ascending: false })

        bill.categories = categories || []
        bill.transactions = transactions || []
      }

      setBills(allBills)
    } catch (error) {
      console.error('获取账本失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createBill = async (name: string, description?: string) => {
    if (!user) return { error: '用户未登录' }

    try {
      const { data, error } = await supabase
        .from('bills')
        .insert({
          owner_id: user.id,
          name,
          description
        })
        .select()
        .single()

      if (error) throw error

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

      for (const category of defaultCategories) {
        await supabase
          .from('categories')
          .insert({
            bill_id: data.id,
            user_id: user.id,
            name: category.name,
            type: category.type
          })
      }

      await fetchBills()
      return {}
    } catch (error) {
      return { error: '创建账本失败' }
    }
  }

  const addTransaction = async (billId: string, transaction: Omit<Transaction, 'id' | 'bill_id' | 'user_id' | 'created_at'>) => {
    if (!user) return { error: '用户未登录' }

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          bill_id: billId,
          user_id: user.id
        })

      if (error) throw error

      await fetchBills()
      return {}
    } catch (error) {
      return { error: '添加交易失败' }
    }
  }

  const createCategory = async (billId: string, name: string, type: 'income' | 'expense') => {
    if (!user) return { error: '用户未登录' }

    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          bill_id: billId,
          user_id: user.id,
          name,
          type
        })

      if (error) throw error

      await fetchBills()
      return {}
    } catch (error) {
      return { error: '创建分类失败' }
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