-- Users tablosu
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  username VARCHAR(255),
  type VARCHAR(50) NOT NULL,
  coins INTEGER NOT NULL DEFAULT 0,
  referral_code VARCHAR(255) NOT NULL,
  referred_by INTEGER REFERENCES users(id),
  profile_photo VARCHAR(255),
  bio TEXT,
  location VARCHAR(255),
  age INTEGER,
  interests JSONB,
  message_price INTEGER,
  rating INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  last_active TIMESTAMP NOT NULL,
  password_hash VARCHAR(255)
);

-- Conversations tablosu
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  regular_user_id INTEGER NOT NULL REFERENCES users(id),
  performer_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL,
  last_message_at TIMESTAMP NOT NULL
);

-- Messages tablosu
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  sender_id INTEGER NOT NULL REFERENCES users(id),
  recipient_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL
);

-- Transactions tablosu
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  related_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL
); 