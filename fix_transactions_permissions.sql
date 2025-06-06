-- 修复交易记录权限控制

-- 1. 删除现有的交易记录权限策略
DROP POLICY IF EXISTS "用户可以查看账本的交易记录" ON transactions;
DROP POLICY IF EXISTS "用户可以创建交易记录" ON transactions;
DROP POLICY IF EXISTS "用户可以更新交易记录" ON transactions;
DROP POLICY IF EXISTS "用户可以删除交易记录" ON transactions;

-- 2. 创建新的交易记录权限策略

-- 查看权限：所有参与账本的用户都可以查看交易记录
CREATE POLICY "用户可以查看参与账本的交易记录" ON transactions
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

-- 创建权限：有添加权限的用户可以创建交易记录
CREATE POLICY "有权限的用户可以创建交易记录" ON transactions
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

-- 更新权限：账本拥有者可以更新所有记录，edit_add权限用户只能更新自己的记录
CREATE POLICY "用户可以更新交易记录" ON transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM bills 
            WHERE bills.id = transactions.bill_id 
            AND (
                -- 账本拥有者可以更新所有记录
                bills.owner_id = auth.uid() OR
                -- edit_add权限用户只能更新自己创建的记录
                (
                    transactions.user_id = auth.uid() AND
                    EXISTS (
                        SELECT 1 FROM bill_members 
                        WHERE bill_members.bill_id = bills.id 
                        AND bill_members.user_id = auth.uid()
                        AND bill_members.permission = 'edit_add'
                    )
                )
            )
        )
    );

-- 删除权限：只有账本拥有者可以删除交易记录
CREATE POLICY "只有账本拥有者可以删除交易记录" ON transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM bills 
            WHERE bills.id = transactions.bill_id 
            AND bills.owner_id = auth.uid()
        )
    ); 