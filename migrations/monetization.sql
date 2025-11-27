-- Monetizasyon özellikleri için migrasyon dosyası

-- Coin paketleri tablosu
CREATE TABLE IF NOT EXISTS "coin_packages" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR NOT NULL,
  "amount" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "bonus_percentage" INTEGER DEFAULT 0,
  "is_vip" BOOLEAN DEFAULT false,
  "is_active" BOOLEAN DEFAULT true,
  "valid_until" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Boost tablosu
CREATE TABLE IF NOT EXISTS "boosts" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "type" VARCHAR NOT NULL,
  "expires_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Abonelikler tablosu
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" SERIAL PRIMARY KEY,
  "performer_id" INTEGER NOT NULL,
  "subscriber_id" INTEGER NOT NULL,
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  "price" INTEGER NOT NULL,
  "status" VARCHAR NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("performer_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("subscriber_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Hediyeler tablosu
CREATE TABLE IF NOT EXISTS "gifts" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR NOT NULL,
  "description" TEXT,
  "price" INTEGER NOT NULL,
  "image_url" VARCHAR,
  "animation_url" VARCHAR,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Hediye işlemleri tablosu
CREATE TABLE IF NOT EXISTS "gift_transactions" (
  "id" SERIAL PRIMARY KEY,
  "gift_id" INTEGER NOT NULL,
  "sender_id" INTEGER NOT NULL,
  "recipient_id" INTEGER NOT NULL,
  "message_id" INTEGER,
  "created_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("gift_id") REFERENCES "gifts" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("recipient_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("message_id") REFERENCES "messages" ("id") ON DELETE SET NULL
);

-- Görevler tablosu
CREATE TABLE IF NOT EXISTS "tasks" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR NOT NULL,
  "description" TEXT NOT NULL,
  "type" VARCHAR NOT NULL,
  "target_type" VARCHAR NOT NULL,
  "target_count" INTEGER NOT NULL,
  "reward_type" VARCHAR NOT NULL,
  "reward_amount" INTEGER NOT NULL,
  "user_type" VARCHAR NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Kullanıcı görevleri tablosu
CREATE TABLE IF NOT EXISTS "user_tasks" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "task_id" INTEGER NOT NULL,
  "progress" INTEGER DEFAULT 0,
  "completed" BOOLEAN DEFAULT false,
  "reward_claimed" BOOLEAN DEFAULT false,
  "updated_at" TIMESTAMP DEFAULT NOW(),
  "created_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE
);

-- Sürpriz kutular tablosu
CREATE TABLE IF NOT EXISTS "lootboxes" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR NOT NULL,
  "description" TEXT,
  "price" INTEGER NOT NULL,
  "image_url" VARCHAR,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Sürpriz kutu ödülleri tablosu
CREATE TABLE IF NOT EXISTS "lootbox_rewards" (
  "id" SERIAL PRIMARY KEY,
  "lootbox_id" INTEGER NOT NULL,
  "reward_type" VARCHAR NOT NULL,
  "reward_id" INTEGER,
  "reward_amount" INTEGER,
  "probability" INTEGER NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("lootbox_id") REFERENCES "lootboxes" ("id") ON DELETE CASCADE
);

-- Sürpriz kutu açma işlemleri tablosu
CREATE TABLE IF NOT EXISTS "lootbox_openings" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "lootbox_id" INTEGER NOT NULL,
  "reward_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("lootbox_id") REFERENCES "lootboxes" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("reward_id") REFERENCES "lootbox_rewards" ("id") ON DELETE CASCADE
);

-- Affiliate programı tablosu
CREATE TABLE IF NOT EXISTS "affiliates" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "code" VARCHAR NOT NULL UNIQUE,
  "commission_rate" INTEGER DEFAULT 10,
  "total_earned" INTEGER DEFAULT 0,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Affiliate yönlendirmeleri tablosu
CREATE TABLE IF NOT EXISTS "affiliate_referrals" (
  "id" SERIAL PRIMARY KEY,
  "affiliate_id" INTEGER NOT NULL,
  "referred_user_id" INTEGER NOT NULL,
  "status" VARCHAR NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("affiliate_id") REFERENCES "affiliates" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("referred_user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Para çekme işlemleri tablosu
CREATE TABLE IF NOT EXISTS "cashouts" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "amount" INTEGER NOT NULL,
  "fee_amount" INTEGER NOT NULL,
  "net_amount" INTEGER NOT NULL,
  "method" VARCHAR NOT NULL,
  "status" VARCHAR NOT NULL,
  "payment_details" JSONB,
  "processed_at" TIMESTAMP,
  "admin_notes" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Marketplace ürünleri tablosu
CREATE TABLE IF NOT EXISTS "marketplace_items" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR NOT NULL,
  "description" TEXT,
  "price" INTEGER NOT NULL,
  "type" VARCHAR NOT NULL,
  "image_url" VARCHAR,
  "stock" INTEGER DEFAULT -1,
  "is_vip" BOOLEAN DEFAULT false,
  "is_active" BOOLEAN DEFAULT true,
  "expires_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Marketplace satın alma işlemleri tablosu
CREATE TABLE IF NOT EXISTS "marketplace_purchases" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "item_id" INTEGER NOT NULL,
  "price" INTEGER NOT NULL,
  "status" VARCHAR NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("item_id") REFERENCES "marketplace_items" ("id") ON DELETE CASCADE
);

-- Promosyonlar tablosu
CREATE TABLE IF NOT EXISTS "promotions" (
  "id" SERIAL PRIMARY KEY,
  "type" VARCHAR NOT NULL,
  "discount_percentage" INTEGER NOT NULL,
  "start_time" TIMESTAMP NOT NULL,
  "end_time" TIMESTAMP NOT NULL,
  "target_user_ids" JSONB,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Örnek veriler ekleyelim
-- Coin paketleri
INSERT INTO "coin_packages" ("name", "amount", "price", "bonus_percentage", "is_vip", "is_active")
VALUES
  ('Küçük Paket', 100, 1000, 0, false, true),
  ('Orta Paket', 250, 2000, 10, false, true),
  ('Büyük Paket', 500, 3500, 20, false, true),
  ('Mega Paket', 1000, 6000, 30, false, true),
  ('VIP Paket', 2000, 10000, 40, true, true);

-- Hediyeler
INSERT INTO "gifts" ("name", "description", "price", "image_url", "is_active")
VALUES
  ('Gül', 'Güzel bir kırmızı gül', 10, '/images/gifts/rose.png', true),
  ('Kalp', 'Sevgi dolu bir kalp', 20, '/images/gifts/heart.png', true),
  ('Şampanya', 'Kutlama için şampanya', 50, '/images/gifts/champagne.png', true),
  ('Elmas', 'Değerli bir elmas', 100, '/images/gifts/diamond.png', true),
  ('Taç', 'Kraliçe tacı', 200, '/images/gifts/crown.png', true);

-- Görevler
INSERT INTO "tasks" ("title", "description", "type", "target_type", "target_count", "reward_type", "reward_amount", "user_type", "is_active")
VALUES
  ('İlk Mesajını Gönder', 'Bir performera ilk mesajını gönder', 'achievement', 'send_message', 1, 'coins', 10, 'regular', true),
  ('Günlük Mesajlaşma', 'Bugün 3 mesaj gönder', 'daily', 'send_message', 3, 'coins', 5, 'regular', true),
  ('Bir Arkadaşını Davet Et', 'Referans kodunla bir arkadaşını platforma davet et', 'achievement', 'referral', 1, 'coins', 20, 'regular', true),
  ('İlk Hediyeni Gönder', 'Bir performera hediye gönder', 'achievement', 'send_gift', 1, 'coins', 15, 'regular', true),
  ('Hızlı Yanıt Ver', '10 mesaja 30 dakika içinde yanıt ver', 'achievement', 'quick_reply', 10, 'boost', 24, 'performer', true),
  ('Aktif Performer', 'Bugün 5 mesaja yanıt ver', 'daily', 'reply_message', 5, 'coins', 10, 'performer', true),
  ('Popüler Performer', '10 farklı kullanıcıdan mesaj al', 'achievement', 'unique_chats', 10, 'boost', 48, 'performer', true);

-- Sürpriz kutular
INSERT INTO "lootboxes" ("name", "description", "price", "image_url", "is_active")
VALUES
  ('Günlük Sürpriz Kutu', 'Her gün ücretsiz açabileceğin sürpriz kutu', 0, '/images/lootboxes/daily.png', true),
  ('Temel Sürpriz Kutu', 'Küçük ödüller içeren sürpriz kutu', 50, '/images/lootboxes/basic.png', true),
  ('Premium Sürpriz Kutu', 'Daha değerli ödüller içeren sürpriz kutu', 100, '/images/lootboxes/premium.png', true),
  ('VIP Sürpriz Kutu', 'En değerli ödüller içeren sürpriz kutu', 200, '/images/lootboxes/vip.png', true);

-- Günlük sürpriz kutu ödülleri
INSERT INTO "lootbox_rewards" ("lootbox_id", "reward_type", "reward_amount", "probability")
VALUES
  (1, 'coins', 5, 50),
  (1, 'coins', 10, 30),
  (1, 'coins', 20, 15),
  (1, 'boost', 1, 5);

-- Temel sürpriz kutu ödülleri
INSERT INTO "lootbox_rewards" ("lootbox_id", "reward_type", "reward_amount", "probability")
VALUES
  (2, 'coins', 20, 40),
  (2, 'coins', 50, 30),
  (2, 'boost', 3, 20),
  (2, 'message_discount', 50, 10);

-- Premium sürpriz kutu ödülleri
INSERT INTO "lootbox_rewards" ("lootbox_id", "reward_type", "reward_amount", "probability")
VALUES
  (3, 'coins', 50, 30),
  (3, 'coins', 100, 40),
  (3, 'boost', 6, 20),
  (3, 'coins', 200, 10);

-- VIP sürpriz kutu ödülleri
INSERT INTO "lootbox_rewards" ("lootbox_id", "reward_type", "reward_amount", "probability")
VALUES
  (4, 'coins', 100, 30),
  (4, 'coins', 200, 40),
  (4, 'boost', 24, 20),
  (4, 'coins', 500, 10);

-- Marketplace ürünleri
INSERT INTO "marketplace_items" ("name", "description", "price", "type", "image_url", "is_vip", "is_active")
VALUES
  ('Özel Profil Rozeti', 'Profilinizde gösterilecek özel rozet', 100, 'digital', '/images/marketplace/badge.png', false, true),
  ('VIP Profil Çerçevesi', 'Profiliniz için özel VIP çerçeve', 300, 'digital', '/images/marketplace/vip_frame.png', true, true),
  ('Mesaj Paketi', '10 mesaj gönderme hakkı', 150, 'digital', '/images/marketplace/message_pack.png', false, true),
  ('Hediye Kartı', '50 TL değerinde hediye kartı', 500, 'voucher', '/images/marketplace/gift_card.png', false, true);
