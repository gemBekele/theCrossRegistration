# The Cross Fellowship - Quick Reference

## 🚀 Current Status: RUNNING

### Access URLs
- **Admin Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

### Admin Login
- **Username**: admin
- **Password**: admin123
- ⚠️ Change password after first login!

### Telegram Bot
- **Bot Token**: 8525803759:AAEi1ztDisR6Mz7LrTftyh-NFj-nrKu6Feo
- **Status**: Polling for messages

---

## 🛠️ Process Management

### Check Status
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check if frontend is running
curl -I http://localhost:3000

# View running processes
ps aux | grep -E "(theCross|cross)" | grep -v grep
```

### View Logs
```bash
# Backend logs
cd /home/barch/projects/theCross/backend && tail -f backend.log

# Frontend logs
cd /home/barch/projects/theCross/frontend && tail -f frontend.log

# PostgreSQL logs
tail -f ~/postgres-data/server.log
```

### Stop Services
```bash
# Stop backend
kill 14105

# Stop frontend
kill 14142

# Stop PostgreSQL
export PATH=$PATH:/usr/lib/postgresql/16/bin
pg_ctl -D ~/postgres-data stop

# Stop all
kill 14105 14142
export PATH=$PATH:/usr/lib/postgresql/16/bin
pg_ctl -D ~/postgres-data stop
```

### Start Services
```bash
# Start PostgreSQL
export PATH=$PATH:/usr/lib/postgresql/16/bin
pg_ctl -D ~/postgres-data -o "-p 5433 -k /tmp" -l ~/postgres-data/server.log start

# Start Backend
cd /home/barch/projects/theCross/backend
export DATABASE_URL="postgresql://barch@localhost:5433/thecross?host=/tmp"
export PATH=$PATH:/usr/lib/postgresql/16/bin
pnpm start

# Start Frontend
cd /home/barch/projects/theCross/frontend
pnpm dev
```

---

## 🗄️ Database

### Connect to Database
```bash
export PATH=$PATH:/usr/lib/postgresql/16/bin
psql -h /tmp -p 5433 thecross
```

### Reset Database
```bash
export PATH=$PATH:/usr/lib/postgresql/16/bin
dropdb -h /tmp -p 5433 thecross
createdb -h /tmp -p 5433 thecross
cd /home/barch/projects/theCross/backend
export DATABASE_URL="postgresql://barch@localhost:5433/thecross?host=/tmp"
pnpm migrate
node dist/seed-admin.js
```

---

## 📦 Project Structure

```
/home/barch/projects/theCross/
├── backend/              # Express API + Telegram Bot
│   ├── src/
│   ├── dist/            # Compiled JavaScript
│   ├── uploads/         # Photos & audio files
│   └── .env            # Environment variables
├── frontend/            # React Admin Dashboard
│   ├── src/
│   └── dist/           # Production build
└── README.md           # Full documentation
```

---

## 🔧 Configuration

### Backend .env
```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://barch@localhost:5433/thecross?host=/tmp
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
TELEGRAM_BOT_TOKEN=8525803759:AAEi1ztDisR6Mz7LrTftyh-NFj-nrKu6Feo
MAX_AUDIO_SIZE=5242880
MAX_PHOTO_SIZE=10485760
UPLOAD_DIR=./uploads
FRONTEND_URL=http://localhost:3000
```

---

## 🧪 Testing

### Test Backend API
```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Test Telegram Bot
1. Open Telegram
2. Search for your bot (using the token provided)
3. Start the bot with `/start`
4. Complete the registration flow

---

## 📊 Features

### Telegram Bot
- ✅ Bilingual (English/Amharic)
- ✅ Singer registration with audio upload
- ✅ Mission registration with bio
- ✅ Phone validation (+251 format)
- ✅ Photo upload (optional)
- ✅ Review before submit

### Admin Dashboard
- ✅ Login/Authentication
- ✅ Statistics overview
- ✅ Applicant list with filters
- ✅ Applicant details with audio player
- ✅ Accept/Reject applications
- ✅ CSV export
- ✅ User management (Super Admin)

---

## 🚀 Deployment

### Local Development
```bash
cd /home/barch/projects/theCross
./setup.sh
```

### Docker
```bash
cd /home/barch/projects/theCross
docker-compose up -d
```

### Production
```bash
cd /home/barch/projects/theCross
./deploy.sh
```

---

## 📞 Support

For issues or questions:
1. Check the logs (backend.log, frontend.log)
2. Verify all services are running
3. Check database connection
4. Review README.md for detailed documentation

---

Last updated: 2026-02-13
Status: ✅ All services running