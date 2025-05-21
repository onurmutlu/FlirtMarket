-- Admin kullanıcısı oluştur
INSERT INTO users (
  telegram_id,
  username,
  first_name,
  last_name,
  type,
  coins,
  referral_code,
  password_hash,
  created_at,
  last_active,
  is_verified
) VALUES (
  'admin',
  'admin',
  'Admin',
  'User',
  'admin',
  1000,
  'ADMIN2024',
  '$2b$10$8RTnJeizyJ0CY3lsDAYN.eyBZTnaNTUiDmut90mEEZwjKOKF9uSJm',
  NOW(),
  NOW(),
  true
); 