-- 修复分类权限，只允许账本拥有者查看和修改分类

-- 1. 删除现有的分类权限策略
DROP POLICY IF EXISTS "用户可以查看账本的分类" ON categories;
DROP POLICY IF EXISTS "用户可以创建分类" ON categories;
DROP POLICY IF EXISTS "用户可以更新分类" ON categories;
DROP POLICY IF EXISTS "用户可以删除分类" ON categories;

-- 2. 创建新的分类权限策略，只允许账本拥有者操作
CREATE POLICY "只有账本拥有者可以查看分类" ON categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bills 
            WHERE bills.id = categories.bill_id 
            AND bills.owner_id = auth.uid()
        )
    );

CREATE POLICY "只有账本拥有者可以创建分类" ON categories
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM bills 
            WHERE bills.id = categories.bill_id 
            AND bills.owner_id = auth.uid()
        )
    );

CREATE POLICY "只有账本拥有者可以更新分类" ON categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM bills 
            WHERE bills.id = categories.bill_id 
            AND bills.owner_id = auth.uid()
        )
    );

CREATE POLICY "只有账本拥有者可以删除分类" ON categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM bills 
            WHERE bills.id = categories.bill_id 
            AND bills.owner_id = auth.uid()
        )
    ); 