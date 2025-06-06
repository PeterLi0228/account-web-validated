# 数据库设置指南

本文档将指导您如何在 Supabase 中设置可记账应用所需的数据库表结构。

## 前提条件

1. 已创建 Supabase 项目
2. 已获取项目的 URL 和 API 密钥
3. 已配置 `.env.local` 文件

## 数据库表结构

请在 Supabase 的 SQL 编辑器中依次执行以下 SQL 语句：

### 1. 创建账本表 (bills)

```sql
-- 创建账本表
CREATE TABLE bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_bills_owner_id ON bills(owner_id);

-- 启用 RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "用户可以查看自己拥有的账本" ON bills
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "用户可以创建账本" ON bills
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "用户可以更新自己的账本" ON bills
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "用户可以删除自己的账本" ON bills
    FOR DELETE USING (auth.uid() = owner_id);
```

### 2. 创建账本成员表 (bill_members)

```sql
-- 创建账本成员表
CREATE TABLE bill_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission VARCHAR(20) NOT NULL CHECK (permission IN ('edit_add', 'add_only', 'view_only')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bill_id, user_id)
);

-- 创建索引
CREATE INDEX idx_bill_members_bill_id ON bill_members(bill_id);
CREATE INDEX idx_bill_members_user_id ON bill_members(user_id);

-- 启用 RLS
ALTER TABLE bill_members ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "用户可以查看自己参与的账本成员信息" ON bill_members
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() IN (SELECT owner_id FROM bills WHERE id = bill_id)
    );

CREATE POLICY "账本拥有者可以管理成员" ON bill_members
    FOR ALL USING (
        auth.uid() IN (SELECT owner_id FROM bills WHERE id = bill_id)
    );

-- 添加专门的 INSERT 策略，允许账本拥有者为自己或其他用户添加成员记录
CREATE POLICY "账本拥有者可以添加成员" ON bill_members
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT owner_id FROM bills WHERE id = bill_id)
    );

-- 添加专门的 UPDATE 策略
CREATE POLICY "账本拥有者可以更新成员权限" ON bill_members
    FOR UPDATE USING (
        auth.uid() IN (SELECT owner_id FROM bills WHERE id = bill_id)
    );

-- 添加专门的 DELETE 策略
CREATE POLICY "账本拥有者可以删除成员" ON bill_members
    FOR DELETE USING (
        auth.uid() IN (SELECT owner_id FROM bills WHERE id = bill_id)
    );
```

### 3. 创建分类表 (categories)

```sql
-- 创建分类表
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_categories_bill_id ON categories(bill_id);
CREATE INDEX idx_categories_type ON categories(type);

-- 启用 RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "用户可以查看账本的分类" ON categories
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM bills WHERE id = bill_id
            UNION
            SELECT user_id FROM bill_members WHERE bill_id = categories.bill_id
        )
    );

CREATE POLICY "用户可以创建分类" ON categories
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        auth.uid() IN (
            SELECT owner_id FROM bills WHERE id = bill_id
            UNION
            SELECT user_id FROM bill_members WHERE bill_id = categories.bill_id AND permission IN ('edit_add')
        )
    );

CREATE POLICY "用户可以更新分类" ON categories
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT owner_id FROM bills WHERE id = bill_id
            UNION
            SELECT user_id FROM bill_members WHERE bill_id = categories.bill_id AND permission IN ('edit_add')
        )
    );

CREATE POLICY "用户可以删除分类" ON categories
    FOR DELETE USING (
        auth.uid() IN (
            SELECT owner_id FROM bills WHERE id = bill_id
            UNION
            SELECT user_id FROM bill_members WHERE bill_id = categories.bill_id AND permission IN ('edit_add')
        )
    );
```

### 4. 创建交易记录表 (transactions)

```sql
-- 创建交易记录表
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    date DATE NOT NULL,
    item VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    person VARCHAR(100),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_transactions_bill_id ON transactions(bill_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);

-- 启用 RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "用户可以查看账本的交易记录" ON transactions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT owner_id FROM bills WHERE id = bill_id
            UNION
            SELECT user_id FROM bill_members WHERE bill_id = transactions.bill_id
        )
    );

CREATE POLICY "用户可以创建交易记录" ON transactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        auth.uid() IN (
            SELECT owner_id FROM bills WHERE id = bill_id
            UNION
            SELECT user_id FROM bill_members WHERE bill_id = transactions.bill_id AND permission IN ('edit_add', 'add_only')
        )
    );

CREATE POLICY "用户可以更新交易记录" ON transactions
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT owner_id FROM bills WHERE id = bill_id
            UNION
            SELECT user_id FROM bill_members WHERE bill_id = transactions.bill_id AND permission IN ('edit_add')
        )
    );

CREATE POLICY "用户可以删除交易记录" ON transactions
    FOR DELETE USING (
        auth.uid() IN (
            SELECT owner_id FROM bills WHERE id = bill_id
            UNION
            SELECT user_id FROM bill_members WHERE bill_id = transactions.bill_id AND permission IN ('edit_add')
        )
    );
```

### 5. 创建AI聊天日志表 (ai_logs)

```sql
-- 创建AI聊天日志表
CREATE TABLE ai_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_ai_logs_bill_id ON ai_logs(bill_id);
CREATE INDEX idx_ai_logs_user_id ON ai_logs(user_id);
CREATE INDEX idx_ai_logs_created_at ON ai_logs(created_at);

-- 启用 RLS
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "用户可以查看自己的AI日志" ON ai_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以在自己参与的账本中创建AI日志" ON ai_logs
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND (
            EXISTS (
                SELECT 1 FROM bills WHERE bills.id = ai_logs.bill_id AND bills.owner_id = auth.uid()
            ) OR
            EXISTS (
                SELECT 1 FROM bill_members WHERE bill_members.bill_id = ai_logs.bill_id AND bill_members.user_id = auth.uid()
            )
        )
    );
```

### 7. 创建公开用户信息表 (public_user_profiles)

```sql
-- 创建公开用户信息表，只暴露非敏感信息
CREATE TABLE IF NOT EXISTS public_user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_public_user_profiles_email ON public_user_profiles(email);
CREATE INDEX idx_public_user_profiles_display_name ON public_user_profiles(display_name);

-- 启用 RLS
ALTER TABLE public_user_profiles ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略 - 所有认证用户都可以查看公开信息
CREATE POLICY "认证用户可以查看公开用户信息" ON public_user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- 用户可以插入自己的信息（注册时）
CREATE POLICY "用户可以插入自己的公开信息" ON public_user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 用户只能更新自己的信息
CREATE POLICY "用户可以更新自己的公开信息" ON public_user_profiles
    FOR UPDATE USING (auth.uid() = id);
```

### 8. 创建查找用户的RPC函数（使用公开信息表）

```sql
-- 创建查找用户的RPC函数（使用公开信息表）
CREATE OR REPLACE FUNCTION find_user_by_email(email_param TEXT)
RETURNS TABLE(id UUID, email TEXT, display_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pup.id,
        pup.email,
        pup.display_name
    FROM public_user_profiles pup
    WHERE pup.email = email_param;
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION find_user_by_email(TEXT) TO authenticated;
```

## 验证设置