# 数据库设置指南

本文档将指导您如何在 Supabase 中设置简记账应用所需的数据库表结构。

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
CREATE INDEX idx_ai_logs_created_at ON ai_logs(created_at);

-- 启用 RLS
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "用户可以查看自己的AI聊天记录" ON ai_logs
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT owner_id FROM bills WHERE id = bill_id
            UNION
            SELECT user_id FROM bill_members WHERE bill_id = ai_logs.bill_id
        )
    );

CREATE POLICY "用户可以创建AI聊天记录" ON ai_logs
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        auth.uid() IN (
            SELECT owner_id FROM bills WHERE id = bill_id
            UNION
            SELECT user_id FROM bill_members WHERE bill_id = ai_logs.bill_id
        )
    );
```

## 验证设置

执行完所有SQL语句后，您可以在 Supabase 的表编辑器中验证以下内容：

1. **表结构**：确认所有5个表都已创建
2. **RLS策略**：每个表都应该有相应的安全策略
3. **索引**：确认所有索引都已创建

## 测试连接

您可以使用项目中的测试页面来验证数据库连接：

1. 启动开发服务器：`npm run dev`
2. 访问：`http://localhost:3001/test-db`
3. 点击"开始测试"按钮
4. 查看测试结果

## 常见问题

### Q: 创建表时出现权限错误
A: 确保您使用的是项目的服务角色密钥，而不是匿名密钥。

### Q: RLS策略不生效
A: 确保已启用RLS (`ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`)

### Q: 无法插入数据
A: 检查RLS策略是否正确配置，确保用户有相应的权限。

## 下一步

数据库设置完成后，您就可以：

1. 注册新用户账户
2. 创建第一个账本
3. 开始使用所有功能

如有问题，请检查 Supabase 控制台的日志部分获取详细错误信息。 