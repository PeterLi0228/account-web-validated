-- 修复 bills 表的 RLS 策略，允许拥有者和共享者查看账本

-- 删除现有的策略
DROP POLICY IF EXISTS "用户可以查看自己拥有的账本" ON bills;
DROP POLICY IF EXISTS "用户可以查看自己拥有或参与的账本" ON bills;
DROP POLICY IF EXISTS "认证用户可以查看账本" ON bills;

-- 创建新的策略：用户可以查看自己拥有的账本或自己参与的账本
-- 使用 EXISTS 子查询避免循环依赖
CREATE POLICY "用户可以查看拥有或参与的账本" ON bills
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        EXISTS (
            SELECT 1 FROM bill_members 
            WHERE bill_members.bill_id = bills.id 
            AND bill_members.user_id = auth.uid()
        )
    ); 