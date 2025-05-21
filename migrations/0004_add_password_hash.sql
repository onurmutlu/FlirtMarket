-- Kullanıcı tablosuna password_hash kolonu ekle
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255); 