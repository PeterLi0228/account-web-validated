"use client";

import type React from 'react';
import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Bill, Category, Transaction } from '@/types'; // 假设 types.ts 在 types 目录下

// 模拟默认分类数据
const defaultInitialCategories: Category[] = [
  { id: "income-1", name: "工资收入", type: "income", isDefault: true },
  { id: "income-2", name: "奖金", type: "income", isDefault: true },
  { id: "income-3", name: "投资收益", type: "income", isDefault: true },
  { id: "income-4", name: "兼职收入", type: "income", isDefault: true },
  { id: "income-5", name: "其他收入", type: "income", isDefault: true },
  { id: "expense-1", name: "餐饮", type: "expense", isDefault: true },
  { id: "expense-2", name: "交通", type: "expense", isDefault: true },
  { id: "expense-3", name: "购物", type: "expense", isDefault: true },
  { id: "expense-4", name: "娱乐", type: "expense", isDefault: true },
  { id: "expense-5", name: "医疗", type: "expense", isDefault: true },
  { id: "expense-6", name: "教育", type: "expense", isDefault: true },
  { id: "expense-7", name: "住房", type: "expense", isDefault: true },
  { id: "expense-8", name: "其他支出", type: "expense", isDefault: true },
];

// 模拟初始账本数据
const initialMockBills: Bill[] = [
  {
    id: "1",
    name: "个人账本",
    description: "日常收支记录",
    permission: "owner",
    memberCount: 1,
    createdAt: "2024-01-01",
    isShared: false,
    owner: "我",
    categories: JSON.parse(JSON.stringify(defaultInitialCategories)),
    transactions: [],
  },
  {
    id: "2",
    name: "家庭账本",
    description: "家庭共同支出管理",
    permission: "owner",
    memberCount: 3,
    createdAt: "2024-01-15",
    isShared: true,
    owner: "我",
    categories: JSON.parse(JSON.stringify(defaultInitialCategories)),
    transactions: [],
  },
];

interface BillContextType {
  bills: Bill[];
  currentBillId: string | null;
  currentBill: Bill | null;
  isLoading: boolean;
  error: string | null;
  fetchBills: () => void; // 暂时模拟
  setCurrentBillId: (id: string | null) => void;
  addBill: (billData: Omit<Bill, 'id' | 'categories' | 'transactions' | 'permission' | 'memberCount' | 'createdAt' | 'isShared' | 'owner'>) => void;
  updateBill: (billId: string, billData: Partial<Omit<Bill, 'id' | 'categories' | 'transactions'>>) => void;
  deleteBill: (billId: string) => void;
  updateBillCategories: (billId: string, categories: Category[]) => void;
  addTransaction: (billId: string, transactionData: Omit<Transaction, 'id' | 'bill_id'>) => void;
  updateTransaction: (billId: string, transactionId: string, transactionData: Partial<Omit<Transaction, 'id' | 'bill_id'>>) => void;
  deleteTransaction: (billId: string, transactionId: string) => void;
}

const BillContext = createContext<BillContextType | undefined>(undefined);

export const BillProvider = ({ children }: { children: ReactNode }) => {
  const [bills, setBills] = useState<Bill[]>(initialMockBills);
  const [currentBillId, setCurrentBillIdState] = useState<string | null>(initialMockBills.length > 0 ? initialMockBills[0].id : null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = useCallback(() => {
    setIsLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setBills(initialMockBills);
      if (initialMockBills.length > 0 && !currentBillId) {
        setCurrentBillIdState(initialMockBills[0].id);
      }
      setIsLoading(false);
    }, 500);
  }, [currentBillId]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const setCurrentBillId = (id: string | null) => {
    setCurrentBillIdState(id);
  };

  const addBill = (billData: Omit<Bill, 'id' | 'categories' | 'transactions' | 'permission' | 'memberCount' | 'createdAt' | 'isShared' | 'owner'>) => {
    const newBill: Bill = {
      id: Date.now().toString(),
      ...billData,
      permission: "owner",
      memberCount: 1,
      createdAt: new Date().toISOString().split("T")[0],
      isShared: false,
      owner: "我", // 模拟当前用户
      categories: JSON.parse(JSON.stringify(defaultInitialCategories)),
      transactions: [],
    };
    setBills(prev => [newBill, ...prev]);
    if (!currentBillId) {
      setCurrentBillIdState(newBill.id);
    }
  };

  const updateBill = (billId: string, billData: Partial<Omit<Bill, 'id' | 'categories' | 'transactions'>>) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, ...billData } : b));
  };

  const deleteBill = (billId: string) => {
    setBills(prev => prev.filter(b => b.id !== billId));
    if (currentBillId === billId) {
      setCurrentBillIdState(bills.length > 0 ? bills[0].id : null);
    }
  };

  const updateBillCategories = (billId: string, categories: Category[]) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, categories } : b));
  };

  const addTransaction = (billId: string, transactionData: Omit<Transaction, 'id' | 'bill_id'>) => {
    setBills(prevBills => prevBills.map(bill => {
      if (bill.id === billId) {
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          bill_id: billId,
          ...transactionData,
          created_at: new Date().toISOString(),
        };
        return { ...bill, transactions: [newTransaction, ...bill.transactions] };
      }
      return bill;
    }));
  };

  const updateTransaction = (billId: string, transactionId: string, transactionData: Partial<Omit<Transaction, 'id' | 'bill_id'>>) => {
    setBills(prevBills => prevBills.map(bill => {
      if (bill.id === billId) {
        return {
          ...bill,
          transactions: bill.transactions.map(t => t.id === transactionId ? { ...t, ...transactionData } : t),
        };
      }
      return bill;
    }));
  };

  const deleteTransaction = (billId: string, transactionId: string) => {
    setBills(prevBills => prevBills.map(bill => {
      if (bill.id === billId) {
        return { ...bill, transactions: bill.transactions.filter(t => t.id !== transactionId) };
      }
      return bill;
    }));
  };
  
  const currentBill = bills.find(bill => bill.id === currentBillId) || null;

  return (
    <BillContext.Provider value={{
      bills,
      currentBillId,
      currentBill,
      isLoading,
      error,
      fetchBills,
      setCurrentBillId,
      addBill,
      updateBill,
      deleteBill,
      updateBillCategories,
      addTransaction,
      updateTransaction,
      deleteTransaction
    }}>
      {children}
    </BillContext.Provider>
  );
};

export const useBills = () => {
  const context = useContext(BillContext);
  if (context === undefined) {
    throw new Error('useBills must be used within a BillProvider');
  }
  return context;
}; 