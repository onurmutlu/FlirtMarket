-- Test için showcu kullanıcıları
INSERT INTO users (telegram_id, first_name, last_name, username, type, coins, referral_code, profile_photo, bio, location, age, interests, message_price, created_at, last_active)
VALUES 
  ('123456789', 'Ayşe', 'Yılmaz', 'ayse_showcu', 'performer', 500, 'AYSE2024', 'https://example.com/ayse.jpg', 'Merhaba, ben Ayşe!', 'İstanbul', 25, '["dans", "müzik", "seyahat"]', 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('987654321', 'Zeynep', 'Kaya', 'zeynep_showcu', 'performer', 750, 'ZEYNEP2024', 'https://example.com/zeynep.jpg', 'Merhaba, ben Zeynep!', 'Ankara', 23, '["spor", "kitap", "sinema"]', 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Test için normal kullanıcılar
INSERT INTO users (telegram_id, first_name, last_name, username, type, coins, referral_code, created_at, last_active)
VALUES 
  ('111222333', 'Mehmet', 'Demir', 'mehmet_d', 'regular', 1000, 'MEHMET2024', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('444555666', 'Ali', 'Yıldız', 'ali_y', 'regular', 800, 'ALI2024', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Test için konuşmalar
INSERT INTO conversations (regular_user_id, performer_id, last_message_at, created_at)
VALUES 
  (3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (4, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Test için mesajlar
INSERT INTO messages (conversation_id, sender_id, recipient_id, content, cost, read, created_at)
VALUES 
  (1, 3, 1, 'Merhaba, nasılsın?', NULL, TRUE, CURRENT_TIMESTAMP),
  (1, 1, 3, 'İyiyim, teşekkürler! Sen nasılsın?', 50, TRUE, CURRENT_TIMESTAMP),
  (2, 4, 2, 'Selam!', NULL, TRUE, CURRENT_TIMESTAMP),
  (2, 2, 4, 'Merhaba :)', 40, FALSE, CURRENT_TIMESTAMP);

-- Test için işlemler
INSERT INTO transactions (user_id, type, amount, description, related_user_id, created_at)
VALUES 
  (3, 'message_payment', -50, 'Mesaj ödemesi', 1, CURRENT_TIMESTAMP),
  (1, 'message_earning', 50, 'Mesaj kazancı', 3, CURRENT_TIMESTAMP),
  (4, 'message_payment', -40, 'Mesaj ödemesi', 2, CURRENT_TIMESTAMP),
  (2, 'message_earning', 40, 'Mesaj kazancı', 4, CURRENT_TIMESTAMP); 