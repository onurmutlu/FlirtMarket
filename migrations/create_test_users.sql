-- Test performer kullanıcısı
INSERT INTO users (
  telegram_id,
  first_name,
  last_name,
  username,
  type,
  coins,
  referral_code,
  bio,
  message_price,
  rating,
  created_at,
  last_active
) VALUES (
  '123456789',
  'Test',
  'Performer',
  'test_performer',
  'performer',
  1000,
  'TEST123',
  'Test performer account',
  10,
  5,
  NOW(),
  NOW()
) ON CONFLICT (telegram_id) DO NOTHING;

-- Test regular kullanıcısı
INSERT INTO users (
  telegram_id,
  first_name,
  last_name,
  username,
  type,
  coins,
  referral_code,
  created_at,
  last_active
) VALUES (
  '987654321',
  'Test',
  'User',
  'test_user',
  'user',
  500,
  'TEST456',
  NOW(),
  NOW()
) ON CONFLICT (telegram_id) DO NOTHING; 