-- 修复 bills 表的 RLS 策略，避免循环依赖

-- 删除现有的 SELECT 策略
DROP POLICY IF EXISTS "用户可以查看自己拥有的账本" ON bills;
DROP POLICY IF EXISTS "用户可以查看自己拥有或参与的账本" ON bills;

-- 方案1：简化策略，允许所有认证用户查看账本（通过应用层控制权限）
CREATE POLICY "认证用户可以查看账本" ON bills
    FOR SELECT USING (auth.role() = 'authenticated');

-- 或者方案2：使用更简单的策略，只检查用户是否认证
-- CREATE POLICY "用户可以查看账本" ON bills
--     FOR SELECT USING (auth.uid() IS NOT NULL); 