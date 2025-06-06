-- 修复 bill_members 表的 RLS 策略
-- 删除现有的策略
DROP POLICY IF EXISTS "用户可以查看自己参与的账本成员信息" ON bill_members;
DROP POLICY IF EXISTS "账本拥有者可以管理成员" ON bill_members;
DROP POLICY IF EXISTS "账本拥有者可以添加成员" ON bill_members;
DROP POLICY IF EXISTS "账本拥有者可以更新成员权限" ON bill_members;
DROP POLICY IF EXISTS "账本拥有者可以删除成员" ON bill_members;

-- 重新创建更明确的 RLS 策略
CREATE POLICY "用户可以查看自己参与的账本成员信息" ON bill_members
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() IN (SELECT owner_id FROM bills WHERE id = bill_id)
    );

CREATE POLICY "账本拥有者可以添加成员" ON bill_members
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT owner_id FROM bills WHERE id = bill_id)
    );

CREATE POLICY "账本拥有者可以更新成员权限" ON bill_members
    FOR UPDATE USING (
        auth.uid() IN (SELECT owner_id FROM bills WHERE id = bill_id)
    );

CREATE POLICY "账本拥有者可以删除成员" ON bill_members
    FOR DELETE USING (
        auth.uid() IN (SELECT owner_id FROM bills WHERE id = bill_id)
    ); 