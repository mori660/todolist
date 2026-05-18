INSERT INTO "user" (id, username, password, created_at) VALUES (4, 'testuser2', 'test123', CURRENT_TIMESTAMP);
SELECT id, username FROM "user" ORDER BY id;