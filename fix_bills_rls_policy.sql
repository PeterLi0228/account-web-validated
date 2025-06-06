-- 修复 bills 表的 RLS 策略，允许用户查看自己参与的账本

-- 删除现有的 SELECT 策略
DROP POLICY IF EXISTS "用户可以查看自己拥有的账本" ON bills;

-- 创建新的 SELECT 策略，允许用户查看自己拥有的账本或参与的账本
CREATE POLICY "用户可以查看自己拥有或参与的账本" ON bills
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        auth.uid() IN (SELECT user_id FROM bill_members WHERE bill_id = bills.id)
    ); 