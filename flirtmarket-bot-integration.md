# FlirtMarket Telegram Bot Prompt: Mesaj Bildirimi

## 🎯 Amaç
Erkek kullanıcılar coin harcayarak şovcu profillere mesaj gönderiyor. Bu mesajlar gönderildikten sonra hedef şovcuya **Telegram bot** aracılığıyla **gerçek zamanlı bildirim** gitmeli.

---

## 📦 Yapı
- Bot dosyası: `server/telegram/bot.ts`
- Telegram bot zaten tanımlı
- `POST /api/messages/send` endpoint'i başarılı olduğunda şu event tetikleniyor:

```ts
server.emit("newMessage", {
  recipientId,
  senderId,
  senderName,
  message
});
```

---

## ✅ Yapılacaklar

### 1. `newMessage` Event Listener
`bot.ts` içinde aşağıdaki yapıyı tamamla:

```ts
server.on('newMessage', async (data: {
  recipientId: number,
  senderId: number,
  senderName: string,
  message: string
}) => {
  ...
});
```

---

### 2. Fonksiyon: `sendMessageToPerformer(...)`
- `recipientId` ile şovcu kullanıcıyı veritabanından bul
- Telegram ID yoksa sessizce geç
- Aşağıdaki mesaj formatını gönder:

```
💌 Yeni mesaj aldınız!
👤 {senderName}: "{message}"
```

- Altına "Yanıtla" butonu ekle:  
```ts
web_app.url = `${WEBAPP_URL}?chat={senderId}`
```

- Mesajı `Markdown` moduyla gönder
- Kod asenkron olsun, hata yönetimi `try/catch` ile sağlansın

---

## ☂️ Güvenlik ve Stabilite
- Kullanıcı yoksa `console.warn` logu at
- Telegram ID yoksa `return`
- Bot çalışmasa bile sistem çökmesin

---

## 🧠 Not
Bu fonksiyon ileride Redis kuyruk sistemiyle de entegre edilebilir. Bu yüzden:
- Fonksiyonu modüler yaz
- `async function sendMessageToPerformer(...)` gibi ayır

---

## 📁 Dosya Önerisi
- `server/telegram/notify.ts` dosyası oluşturulabilir
- Bu fonksiyon dışa aktarılır, `bot.ts` içinde import edilip çağrılır

