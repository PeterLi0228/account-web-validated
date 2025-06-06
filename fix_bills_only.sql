-- 只修复 bills 表的 RLS 策略

-- 删除现有的 bills 表策略
DROP POLICY IF EXISTS "用户可以查看自己拥有的账本" ON bills;
DROP POLICY IF EXISTS "用户可以查看自己拥有或参与的账本" ON bills;
DROP POLICY IF EXISTS "认证用户可以查看账本" ON bills;
DROP POLICY IF EXISTS "用户可以查看拥有或参与的账本" ON bills;

-- 创建新的 bills 表策略：允许用户查看自己拥有或参与的账本
CREATE POLICY "用户可以查看拥有或参与的账本" ON bills
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        EXISTS (
            SELECT 1 FROM bill_members 
            WHERE bill_members.bill_id = bills.id 
            AND bill_members.user_id = auth.uid()
        )
    ); 