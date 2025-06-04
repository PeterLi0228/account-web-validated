export interface User {
  id: string;
  email: string;
  user_metadata: {
    display_name?: string;
  };
}

export interface Category {
  id: string;
  bill_id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  created_at: string;
  original_id?: string; // 原始分类ID，用于复合ID的情况
}

export interface Transaction {
  id: string;
  bill_id: string;
  user_id: string;
  type: "income" | "expense";
  date: string; // YYYY-MM-DD
  item: string; // 项目名称
  amount: number;
  person?: string; // 经手人/付款人/收款人 (可选)
  note?: string; // 备注 (可选)
  category_id?: string;
  created_at: string;
  category_name?: string; // 分类名称，方便显示
}

export interface Bill {
  id: string;
  owner_id: string;
  name: string;
  description?: string; // 账本描述
  created_at: string;
  is_default?: boolean; // 是否为默认账本
  permission?: 'owner' | 'edit_add' | 'add_only' | 'view_only'; // 权限，owner表示创建者
  memberCount: number; // 成员数量
  createdAt: string; // 创建日期 YYYY-MM-DD
  isShared: boolean; // 是否共享
  owner: string; // 创建者名称
  categories: Category[];
  transactions: Transaction[];
}

export interface BillMember {
  id: string;
  bill_id: string;
  user_id: string;
  permission: 'edit_add' | 'add_only' | 'view_only';
  created_at: string;
}

export interface AILog {
  id: string;
  bill_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  linked_transaction_id?: string; // 关联的交易记录ID
} 