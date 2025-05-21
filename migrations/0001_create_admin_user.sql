-- Admin kullanıcısını oluştur
INSERT INTO users (
  telegram_id,
  first_name,
  last_name,
  username,
  type,
  coins,
  referral_code,
  created_at,
  last_active,
  password_hash
) VALUES (
  'admin',
  'Admin',
  'User',
  'admin',
  'admin',
  1000,
  'ADMIN2024',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  '$2b$10$3IxT9ZGwB3YFXSJgH8h1d.ZQF.ROCspj0Lv5kkwF0O9p7FSy2Nqx6' -- admin123
); 