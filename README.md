# FlirtMarket

FlirtMarket is a modern messaging platform that connects regular users with performers through a coin-based economy. The platform enables meaningful interactions while providing monetization opportunities for performers.

## 🚀 Features

- **Coin-Based Economy**: Regular users spend coins to message performers
- **User Profiles**: Detailed profiles with bio, interests, and photos
- **Real-Time Messaging**: Instant messaging between users
- **Telegram Integration**: Notifications via Telegram bot
- **Referral System**: Earn coins by referring new users
- **Transaction History**: Track coin spending and earnings
- **Admin Dashboard**: Manage users and monitor platform activity

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based auth system
- **Messaging**: WebSockets for real-time communication
- **Notifications**: Telegram Bot API
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js >= 20.9.0
- PostgreSQL
- Telegram Bot Token (for notifications)

## 🔧 Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/FlirtMarket.git
cd FlirtMarket
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create `.env` files in the root, client, and server directories with the necessary environment variables. See the example files for reference.

4. **Set up the database**

```bash
npm run db:migrate
```

5. **Start the development server**

```bash
npm run dev
```

## 🏗️ Project Structure

```
FlirtMarket/
├── client/                # Frontend React application
│   ├── src/               # Source files
│   ├── performer/         # Performer-specific frontend
│   └── public/            # Static assets
├── server/                # Backend Node.js application
│   ├── src/               # Source files
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── telegram/      # Telegram bot integration
│   │   └── db/            # Database configuration
├── shared/                # Shared code between client and server
│   └── schema.ts          # Database schema and types
├── migrations/            # Database migrations
└── scripts/               # Utility scripts
```

## 🚀 Deployment

The application is configured for deployment on Vercel. The `vercel.json` file contains the necessary configuration.

```bash
npm run build
```

## 👥 User Types

- **Regular Users**: Male users who spend coins to interact with performers
- **Performers**: Female users who receive messages and earn coins
- **Admins**: System administrators with full access to the platform

## 💰 Coin System

- Regular users can purchase coins through the platform
- Coins are spent when sending messages to performers
- Performers earn coins when receiving messages
- Users can earn bonus coins through referrals and daily logins

## 🔒 Security

- Password hashing using bcrypt
- JWT-based authentication
- HTTPS for all communications
- Rate limiting to prevent abuse

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## 👨‍💻 Contributors

- [Onur Mutlu](https://github.com/onurmutlu)
