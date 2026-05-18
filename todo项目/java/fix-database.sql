-- 修复数据库外键约束问题的SQL脚本
-- 执行此脚本来解决 todo_user_id_fkey 错误

-- 1. 首先检查当前数据库中的用户
SELECT '当前用户列表：' as info;
SELECT id, username, created_at FROM "user" ORDER BY id;

-- 2. 检查TODO表中的用户ID分布
SELECT 'TODO表中的用户ID分布：' as info;
SELECT user_id, COUNT(*) as todo_count FROM todo GROUP BY user_id ORDER BY user_id;

-- 3. 查找无效的外键引用
SELECT '无效的外键引用：' as info;
SELECT DISTINCT t.user_id 
FROM todo t 
LEFT JOIN "user" u ON t.user_id = u.id 
WHERE u.id IS NULL;

-- 4. 修复方案A：确保所有存在的用户都有正确的ID
-- 如果用户表为空或有缺失，插入必要的用户记录
INSERT INTO "user" (username, password, created_at) 
SELECT 'testuser2', '$2a$10$N9qo8uLOickgx2ZMRZoMye', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'testuser2');

INSERT INTO "user" (username, password, created_at) 
SELECT 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'admin');

INSERT INTO "user" (username, password, created_at) 
SELECT 'user', '$2a$10$N9qo8uLOickgx2ZMRZoMye', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'user');

-- 5. 修复方案B：删除无效的TODO记录（可选，谨慎使用）
-- DELETE FROM todo WHERE user_id NOT IN (SELECT id FROM "user");

-- 6. 验证修复结果
SELECT '修复后的用户列表：' as info;
SELECT id, username, created_at FROM "user" ORDER BY id;

-- 7. 验证外键约束是否正常
SELECT '剩余的无效引用数量：' as info, COUNT(*) as invalid_count
FROM todo t 
LEFT JOIN "user" u ON t.user_id = u.id 
WHERE u.id IS NULL;