'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (username: string, password: string) => Promise<{ error?: string }>
  signIn: (username: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateDisplayName: (displayName: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 获取初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('初始会话状态:', session?.user?.id || '未登录')
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('认证状态变化:', _event, session?.user?.id || '未登录')
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (username: string, password: string) => {
    try {
      const email = `${username}@like.com`
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: username,
          },
        },
      })

      if (error) {
        return { error: error.message }
      }

      // 创建公开用户信息记录
      if (data.user) {
        const { error: profileError } = await supabase
          .from('public_user_profiles')
          .insert({
            id: data.user.id,
            email: email,
            display_name: username
          })

        if (profileError) {
          console.error('创建公开用户信息失败:', profileError)
          // 不返回错误，因为用户注册已经成功
        }
      }

      return {}
    } catch (error) {
      return { error: '注册失败，请重试' }
    }
  }

  const signIn = async (username: string, password: string) => {
    try {
      const email = `${username}@like.com`
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: '用户名或密码错误' }
      }

      return {}
    } catch (error) {
      return { error: '登录失败，请重试' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const updateDisplayName = async (displayName: string) => {
    try {
      console.log('开始更新用户名:', displayName)
      console.log('当前用户ID:', user?.id)
      
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      })

      if (error) {
        console.error('更新auth用户信息失败:', error)
        return { error: error.message }
      }

      console.log('auth用户信息更新成功')

      // 同步更新 public_user_profiles 表
      if (user) {
        console.log('开始更新public_user_profiles表...')
        console.log('用户邮箱:', user.email)
        
        // 先查询当前记录
        const { data: currentProfile, error: queryError } = await supabase
          .from('public_user_profiles')
          .select('*')
          .eq('email', user.email)
          .single()
        
        console.log('查询当前记录:', currentProfile, queryError)
        
        const { data: updateData, error: profileError } = await supabase
          .from('public_user_profiles')
          .update({ 
            display_name: displayName
          })
          .eq('email', user.email)
          .select()

        console.log('更新结果:', updateData, profileError)

        if (profileError) {
          console.error('更新公开信息失败:', profileError)
          // 不返回错误，因为主要的用户信息已经更新成功
        } else {
          console.log('public_user_profiles表更新成功')
        }
      } else {
        console.log('用户信息为空，跳过public_user_profiles更新')
      }

      return {}
    } catch (error) {
      console.error('更新用户名异常:', error)
      return { error: '更新失败，请重试' }
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateDisplayName,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 