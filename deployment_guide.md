# VPS Deployment Guide: The Cross Fellowship

This guide explains how to deploy **The Cross Fellowship** project on a Linux VPS (Ubuntu/Debian) where other services are already running. We will use **PM2** for process management and **Nginx** as a reverse proxy.

---

## 1. Prerequisites

Ensure your VPS has the following installed:
- **Node.js**: v18 or later
- **PostgreSQL**: v15 or later
- **PM2**: `npm install -g pm2`
- **Nginx**: `sudo apt install nginx`
- **Certbot**: `sudo apt install certbot python3-certbot-nginx`

---

## 2. Database Setup

### Option A: Using existing PostgreSQL
Create a new database and user:
```bash
sudo -u postgres psql
CREATE DATABASE thecross;
CREATE USER thecross_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE thecross TO thecross_user;
\q
```

### Option B: Using Docker (Quickest)
If you prefer Docker for the database only:
```bash
docker run --name thecross-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=thecross -p 5432:5432 -d postgres:15-alpine
```

---

## 3. Project Configuration

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url> /var/www/thecross
   cd /var/www/thecross
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   nano .env
   ```
   
   **Required Settings:**
   - `DATABASE_URL`: `postgresql://thecross_user:password@localhost:5432/thecross`
   - `JWT_SECRET`: Generate a strong random string
   - `TELEGRAM_BOT_TOKEN`: Your bot token from @BotFather
   - `FRONTEND_URL`: `https://thecross.yourdomain.com` (or your IP)

---

## 4. Build and Deploy

Use the provided `deploy.sh` script to build the project. This script installs dependencies, runs migrations, builds the frontend, and moves it to the backend's public folder.

```bash
chmod +x deploy.sh
./deploy.sh
```

> [!NOTE]
> The script will attempt to start the app with PM2 automatically.

---

## 5. Nginx Configuration

Since other services are running, we'll create a dedicated virtual host.

1. Create a new Nginx config:
   ```bash
   sudo nano /etc/nginx/sites-available/thecross
   ```

2. Paste the following configuration (replace `thecross.yourdomain.com` with your domain):
   ```nginx
   server {
       listen 80;
       server_name thecross.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           
           # Increase limits for audio/photo uploads
           client_max_body_size 20M;
       }
   }
   ```

3. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/thecross /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 6. SSL Registration (HTTPS)

Run Certbot to automatically fetch and configure an SSL certificate:
```bash
sudo certbot --nginx -d thecross.yourdomain.com
```

---

## 7. Maintenance

- **View Logs**: `pm2 logs thecross`
- **Restart App**: `pm2 restart thecross`
- **Stop App**: `pm2 stop thecross`
- **Update Code**:
  ```bash
  git pull
  ./deploy.sh
  ```

---

## 8. Troubleshooting: "Permission denied (publickey)"

If you see this error when cloning:

### Option 1: Use HTTPS (Simplest)
Instead of SSH, use the HTTPS URL which doesn't require SSH keys:
```bash
git clone https://github.com/gemBekele/theCrossRegistration.git /var/www/thecross
```
*(Note: You will need a **GitHub Personal Access Token (PAT)** as your password.)*

### Option 2: Setup SSH Keys on VPS
1. **Generate a new key**:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Press Enter to use default location, and Enter twice for no passphrase
   ```
2. **Copy the public key**:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
3. **Add to GitHub**:
   - Go to [GitHub SSH Settings](https://github.com/settings/keys).
   - Click "New SSH key".
   - Paste the content you copied.
4. **Test the connection**:
   ```bash
   ssh -T git@github.com
   ```

---

## Summary of URLs
- **Admin Dashboard**: `https://thecross.yourdomain.com`
- **API Base**: `https://thecross.yourdomain.com/api`
- **Telegram Bot**: Active immediately after PM2 start
