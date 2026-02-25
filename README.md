# The Cross Fellowship Registration System

A bilingual (English/Amharic) registration system for The Cross Fellowship with Telegram Bot for registration and Web Dashboard for screening applications.

## Features

### Telegram Bot Registration
- 🌍 Bilingual support (English & Amharic)
- 🎤 Singer Registration
  - Full name, church, phone, address
  - Worship ministry involvement
  - Photo upload (optional)
  - Audio sample (max 1 min, 5MB)
- 🌍 Mission Registration
  - Full name, church, phone, address
  - Profession
  - Mission interest
  - Bio and motivation
  - Photo upload (optional)
- 📱 Phone number validation (+251 format)
- ✅ Review before submission

### Admin Dashboard
- 📊 Statistics and analytics
- 🔍 Search and filter applicants
- 🎵 Listen to audio samples
- 📸 View applicant photos
- ✅ Accept/Reject applications
- 📝 Add reviewer notes
- 📥 Export to CSV
- 👥 User management (Super Admin only)

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL
- **Frontend**: React, TypeScript, Tailwind CSS, React Query
- **Bot**: node-telegram-bot-api
- **Database**: PostgreSQL
- **Deployment**: Docker, PM2

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or use Docker)
- Telegram Bot Token

### Option 1: Development Setup

```bash
# Clone and setup
git clone <repository>
cd theCross
./setup.sh

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env and add your Telegram bot token

# Set up database
createdb thecross
cd backend
npm run migrate

# Create default admin
psql thecross -c "INSERT INTO users (username, password_hash, role) VALUES ('admin', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin');"
# Password: admin123

# Start development servers
npm run dev          # Terminal 1: Backend
cd ../frontend
npm run dev          # Terminal 2: Frontend
```

### Option 2: Docker Deployment

```bash
# Setup
cp backend/.env.example .env
# Edit .env and add your Telegram bot token

# Deploy
docker-compose up -d

# Create default admin
docker-compose exec postgres psql -U postgres -d thecross -c "INSERT INTO users (username, password_hash, role) VALUES ('admin', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin');"
# Password: admin123
```

### Option 3: Production Deployment (VPS)

```bash
# On your VPS
git clone <repository>
cd theCross
./deploy.sh
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/thecross
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
MAX_AUDIO_SIZE=5242880
MAX_PHOTO_SIZE=10485760
UPLOAD_DIR=./uploads
FRONTEND_URL=http://localhost:5000
```

## Telegram Bot Setup

1. Create a bot with [@BotFather](https://t.me/botfather)
2. Copy the token
3. Add it to your `.env` file
4. Start the server

## Default Credentials

- **Username**: admin
- **Password**: admin123

**⚠️ Change this immediately after first login!**

## Database Schema

```sql
-- Users (Admins)
users: id, username, password_hash, role, created_at

-- Applicants
applicants: id, telegram_id, telegram_username, type, name, phone, church, address, status, photo_url, reviewer_id, reviewer_notes, created_at, updated_at

-- Singer Details
singer_details: applicant_id, worship_ministry_involved, audio_url, audio_duration

-- Mission Details
mission_details: applicant_id, profession, mission_interest, bio, motivation

-- Sessions (Bot state)
sessions: telegram_id, current_step, data, language, created_at
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/change-password` - Change password

### Applicants
- `GET /api/applicants` - List applicants
- `GET /api/applicants/:id` - Get applicant details
- `PATCH /api/applicants/:id/status` - Update status
- `GET /api/applicants/stats` - Get statistics
- `GET /api/applicants/export` - Export to CSV
- `GET /api/applicants/file/:folder/:filename` - Download file

### Users (Super Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `DELETE /api/users/:id` - Delete user

## Project Structure

```
theCross/
├── backend/
│   ├── src/
│   │   ├── config/         # Database config
│   │   ├── models/         # Database models
│   │   ├── controllers/    # API controllers
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation
│   │   ├── services/       # Business logic
│   │   ├── bot/            # Telegram bot
│   │   └── utils/          # Utilities
│   ├── uploads/            # Photos & audio
│   └── migrations/         # Database migrations
├── frontend/
│   └── src/
│       ├── components/     # React components
│       ├── pages/          # Dashboard pages
│       ├── services/       # API calls
│       └── contexts/       # Auth context
└── docker-compose.yml      # Docker config
```

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- CORS configuration
- File upload validation
- SQL injection prevention (parameterized queries)

## License

MIT