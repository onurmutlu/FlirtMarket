-- Yetkilendirmeleri ayarla
SET ROLE postgres;

-- Tabloları oluştur
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    username VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    coins INTEGER NOT NULL DEFAULT 0,
    referral_code VARCHAR(255) NOT NULL,
    referred_by INTEGER,
    profile_photo VARCHAR(255),
    bio TEXT,
    location VARCHAR(255),
    age INTEGER,
    interests JSONB,
    message_price INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    password_hash VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}',
    blocked_status BOOLEAN DEFAULT FALSE,
    total_purchased INTEGER DEFAULT 0,
    last_purchase_at TIMESTAMP,
    purchase_count INTEGER DEFAULT 0,
    rating DECIMAL DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    regular_user_id INTEGER NOT NULL REFERENCES users(id),
    performer_id INTEGER NOT NULL REFERENCES users(id),
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
    sender_id INTEGER NOT NULL REFERENCES users(id),
    recipient_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    cost INTEGER,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    related_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndexleri oluştur
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(regular_user_id, performer_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);

-- Test kullanıcılarını oluştur
INSERT INTO users (telegram_id, first_name, last_name, username, type, coins, referral_code, password_hash)
VALUES 
    ('admin123', 'Admin', 'User', 'admin', 'admin', 1000, 'ADMIN001', '$2b$10$rQnZ9l8TkE6q6ZjQ0xQ5q.YzK5XzZ5X5X5X5X5X5X5X5X5X5X5'),
    ('test123', 'Test', 'User', 'test', 'user', 500, 'TEST001', '$2b$10$rQnZ9l8TkE6q6ZjQ0xQ5q.YzK5XzZ5X5X5X5X5X5X5X5X5X5X5'),
    ('performer123', 'Performer', 'Test', 'performer', 'performer', 1000, 'PERF001', '$2b$10$rQnZ9l8TkE6q6ZjQ0xQ5q.YzK5XzZ5X5X5X5X5X5X5X5X5X5X5');

-- Yetkileri ayarla
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres; 