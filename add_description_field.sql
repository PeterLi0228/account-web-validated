-- 为 bills 表添加缺失的字段

-- 添加 description 字段
ALTER TABLE bills ADD COLUMN IF NOT EXISTS description TEXT;

-- 添加 is_default 字段
ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- 为 is_default 字段创建索引
CREATE INDEX IF NOT EXISTS idx_bills_is_default ON bills(is_default);

-- 验证字段是否添加成功
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bills' 
ORDER BY ordinal_position; 