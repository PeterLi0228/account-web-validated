-- 统一修复所有表的 RLS 策略，避免循环依赖

-- 1. 修复 bills 表策略
DROP POLICY IF EXISTS "用户可以查看自己拥有的账本" ON bills;
DROP POLICY IF EXISTS "用户可以查看自己拥有或参与的账本" ON bills;
DROP POLICY IF EXISTS "认证用户可以查看账本" ON bills;

CREATE POLICY "用户可以查看拥有或参与的账本" ON bills
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        EXISTS (
            SELECT 1 FROM bill_members 
            WHERE bill_members.bill_id = bills.id 
            AND bill_members.user_id = auth.uid()
        )
    );

-- 2. 修复 transactions 表策略
DROP POLICY IF EXISTS "用户可以查看账本的交易记录" ON transactions;

CREATE POLICY "用户可以查看账本的交易记录" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bills 
            WHERE bills.id = transactions.bill_id 
            AND (
                bills.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM bill_members 
                    WHERE bill_members.bill_id = bills.id 
                    AND bill_members.user_id = auth.uid()
                )
            )
        )
    );

-- 3. 修复 categories 表策略
DROP POLICY IF EXISTS "用户可以查看账本的分类" ON categories;

CREATE POLICY "用户可以查看账本的分类" ON categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bills 
            WHERE bills.id = categories.bill_id 
            AND (
                bills.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM bill_members 
                    WHERE bill_members.bill_id = bills.id 
                    AND bill_members.user_id = auth.uid()
                )
            )
        )
    );

-- 4. 修复 transactions 表的其他策略
DROP POLICY IF EXISTS "用户可以创建交易记录" ON transactions;
DROP POLICY IF EXISTS "用户可以更新交易记录" ON transactions;
DROP POLICY IF EXISTS "用户可以删除交易记录" ON transactions;

CREATE POLICY "用户可以创建交易记录" ON transactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM bills 
            WHERE bills.id = transactions.bill_id 
            AND (
                bills.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM bill_members 
                    WHERE bill_members.bill_id = bills.id 
                    AND bill_members.user_id = auth.uid()
                    AND bill_members.permission IN ('edit_add', 'add_only')
                )
            )
        )
    );

CREATE POLICY "用户可以更新交易记录" ON transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM bills 
            WHERE bills.id = transactions.bill_id 
            AND (
                bills.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM bill_members 
                    WHERE bill_members.bill_id = bills.id 
                    AND bill_members.user_id = auth.uid()
                    AND bill_members.permission = 'edit_add'
                )
            )
        )
    );

CREATE POLICY "用户可以删除交易记录" ON transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM bills 
            WHERE bills.id = transactions.bill_id 
            AND (
                bills.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM bill_members 
                    WHERE bill_members.bill_id = bills.id 
                    AND bill_members.user_id = auth.uid()
                    AND bill_members.permission = 'edit_add'
                )
            )
        )
    );

-- 5. 修复 categories 表的其他策略
DROP POLICY IF EXISTS "用户可以创建分类" ON categories;
DROP POLICY IF EXISTS "用户可以更新分类" ON categories;
DROP POLICY IF EXISTS "用户可以删除分类" ON categories;

CREATE POLICY "用户可以创建分类" ON categories
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM bills 
            WHERE bills.id = categories.bill_id 
            AND (
                bills.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM bill_members 
                    WHERE bill_members.bill_id = bills.id 
                    AND bill_members.user_id = auth.uid()
                    AND bill_members.permission = 'edit_add'
                )
            )
        )
    );

CREATE POLICY "用户可以更新分类" ON categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM bills 
            WHERE bills.id = categories.bill_id 
            AND (
                bills.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM bill_members 
                    WHERE bill_members.bill_id = bills.id 
                    AND bill_members.user_id = auth.uid()
                    AND bill_members.permission = 'edit_add'
                )
            )
        )
    );

CREATE POLICY "用户可以删除分类" ON categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM bills 
            WHERE bills.id = categories.bill_id 
            AND (
                bills.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM bill_members 
                    WHERE bill_members.bill_id = bills.id 
                    AND bill_members.user_id = auth.uid()
                    AND bill_members.permission = 'edit_add'
                )
            )
        )
    ); 