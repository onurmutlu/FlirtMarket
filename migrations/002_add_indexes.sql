-- Coin işlemleri için indeksler
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Kullanıcı istatistikleri için indeksler
CREATE INDEX idx_users_total_purchased ON users(total_purchased);
CREATE INDEX idx_users_last_purchase_at ON users(last_purchase_at);
CREATE INDEX idx_users_purchase_count ON users(purchase_count); 