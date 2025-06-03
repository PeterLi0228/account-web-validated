export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  bill_id: string;
  // user_id: string; // 暂时不实现用户关联
  type: "income" | "expense";
  date: string; // YYYY-MM-DD
  item: string; // 项目名称
  amount: number;
  category_id: string; // 关联的分类ID
  category_name?: string; // 分类名称，方便显示
  person?: string; // 经手人/付款人/收款人 (可选)
  note?: string; // 备注 (可选)
  created_at?: string; // 创建时间 (可选)
}

export interface Bill {
  id: string;
  name: string;
  description: string;
  permission: "owner" | "edit_add" | "add_only" | "view_only"; // 权限，owner表示创建者
  memberCount: number; // 成员数量
  createdAt: string; // 创建日期 YYYY-MM-DD
  isShared: boolean; // 是否共享
  owner: string; // 创建者名称
  categories: Category[];
  transactions: Transaction[];
} 