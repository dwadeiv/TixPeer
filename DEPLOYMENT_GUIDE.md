# TixPeer Deployment Guide

This guide will help you deploy TixPeer to production and connect your tixpeer.com domain.

## Prerequisites

- GitHub account (for code repository)
- tixpeer.com domain (purchased from GoDaddy)
- Application fully tested locally

---

## Option 1: Vercel (Frontend) + Railway (Backend) - Recommended

This is the easiest and fastest deployment option with free tiers available.

### Step 1: Deploy Backend to Railway

1. **Sign up at [Railway.app](https://railway.app)**
   - Use GitHub to sign in

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select your TixPeer repository

3. **Configure Backend Service**
   - Railway will auto-detect the monorepo
   - Set root directory: `/backend`
   - Add PostgreSQL database:
     - Click "+ New"
     - Select "Database" → "PostgreSQL"
     - Railway will create and link it automatically

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_HOST=<provided by Railway>
   DATABASE_PORT=5432
   DATABASE_USER=<provided by Railway>
   DATABASE_PASSWORD=<provided by Railway>
   DATABASE_NAME=<provided by Railway>
   JWT_SECRET=<generate a secure random string>
   JWT_EXPIRATION=7d
   BACKEND_PORT=3001
   CORS_ORIGIN=https://tixpeer.com
   ```

5. **Deploy**
   - Railway will automatically deploy
   - Note your backend URL: `https://tixpeer-production.up.railway.app`

### Step 2: Deploy Frontend to Vercel

1. **Sign up at [Vercel.com](https://vercel.com)**
   - Use GitHub to sign in

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your TixPeer GitHub repository

3. **Configure Build Settings**
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

4. **Set Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Note your frontend URL: `https://tixpeer.vercel.app`

### Step 3: Connect Domain (GoDaddy → Vercel)

1. **In Vercel Dashboard**
   - Go to your project → Settings → Domains
   - Add domain: `tixpeer.com` and `www.tixpeer.com`
   - Vercel will provide DNS records

2. **In GoDaddy Dashboard**
   - Go to My Products → Domains → tixpeer.com → DNS
   - Click "Manage DNS"

3. **Add DNS Records** (provided by Vercel)
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel's IP, check Vercel for current)
   TTL: 600

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 600
   ```

4. **Wait for Propagation**
   - DNS changes can take 24-48 hours
   - Usually propagates in 1-2 hours

### Step 4: Set Up API Subdomain (Optional)

If you want `api.tixpeer.com` for your backend:

1. **In GoDaddy DNS**
   ```
   Type: CNAME
   Name: api
   Value: your-backend-url.railway.app
   TTL: 600
   ```

2. **Update Frontend Environment Variable**
   ```
   NEXT_PUBLIC_API_URL=https://api.tixpeer.com
   ```

---

## Option 2: DigitalOcean App Platform

### Frontend + Backend in One Platform

1. **Sign up at [DigitalOcean](https://www.digitalocean.com)**

2. **Create App**
   - Go to "App Platform" → "Create App"
   - Connect GitHub repository

3. **Configure Services**

   **Backend Service:**
   - Name: tixpeer-api
   - Source Directory: `/backend`
   - Build Command: `npm install && npm run build`
   - Run Command: `npm run start:prod`
   - HTTP Port: 3001

   **Frontend Service:**
   - Name: tixpeer-web
   - Source Directory: `/frontend`
   - Build Command: `npm install && npm run build`
   - Run Command: `npm start`
   - HTTP Port: 3000

4. **Add Database**
   - Add PostgreSQL database component
   - DigitalOcean will auto-configure connection

5. **Set Environment Variables**
   (Same as Railway/Vercel setup above)

6. **Connect Domain**
   - In App Settings → Domains
   - Add `tixpeer.com`
   - Follow DNS instructions for GoDaddy

---

## Option 3: Self-Hosted (VPS/Droplet)

### Requirements
- Ubuntu 22.04 server (DigitalOcean Droplet, AWS EC2, etc.)
- SSH access
- Basic Linux knowledge

### Steps

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib

   # Install Nginx (reverse proxy)
   sudo apt install nginx

   # Install PM2 (process manager)
   sudo npm install -g pm2
   ```

2. **Clone Repository**
   ```bash
   cd /var/www
   git clone <your-repo-url> tixpeer
   cd tixpeer
   npm install
   ```

3. **Configure PostgreSQL**
   ```bash
   sudo -u postgres createuser tixpeer
   sudo -u postgres createdb tixpeer_db
   sudo -u postgres psql
   ```
   ```sql
   ALTER USER tixpeer WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE tixpeer_db TO tixpeer;
   \q
   ```

4. **Set Up Environment**
   ```bash
   cp .env.example .env
   nano .env
   # Edit with production values
   ```

5. **Build and Start**
   ```bash
   # Build backend
   cd backend
   npm run build
   pm2 start dist/main.js --name tixpeer-api

   # Build frontend
   cd ../frontend
   npm run build
   pm2 start npm --name tixpeer-web -- start

   # Save PM2 config
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/tixpeer
   ```

   ```nginx
   # Frontend
   server {
       listen 80;
       server_name tixpeer.com www.tixpeer.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }

   # Backend API
   server {
       listen 80;
       server_name api.tixpeer.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/tixpeer /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Set Up SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d tixpeer.com -d www.tixpeer.com -d api.tixpeer.com
   ```

8. **Point Domain (GoDaddy)**
   ```
   Type: A
   Name: @
   Value: <Your Server IP>
   TTL: 600

   Type: A
   Name: www
   Value: <Your Server IP>
   TTL: 600

   Type: A
   Name: api
   Value: <Your Server IP>
   TTL: 600
   ```

---

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All features tested locally
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] JWT_SECRET is a strong random string (not the dev default)
- [ ] CORS_ORIGIN set to production domain
- [ ] Production database credentials secured
- [ ] Code pushed to GitHub (or version control)
- [ ] SSL/HTTPS will be enabled (automatic with Vercel/Railway)

---

## Post-Deployment Steps

1. **Test Production Site**
   - Visit https://tixpeer.com
   - Test user registration
   - Test ticket creation
   - Test all API endpoints

2. **Monitor Application**
   - Set up error tracking (Sentry, LogRocket)
   - Monitor server resources
   - Set up uptime monitoring

3. **Set Up Backups**
   - Database backups (automatic with Railway/managed services)
   - Code backups (GitHub already does this)

4. **Update Environment**
   - Update CORS settings if needed
   - Verify all environment variables are set correctly

---

## Troubleshooting

### Common Issues

**"Cannot connect to database"**
- Verify DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD
- Check if database service is running
- Verify firewall rules allow connection

**"CORS error"**
- Check CORS_ORIGIN matches your frontend URL exactly
- Include protocol (https://) in CORS_ORIGIN

**"502 Bad Gateway"**
- Backend service may not be running
- Check logs: `pm2 logs` or platform dashboard
- Verify PORT environment variable

**"Domain not working"**
- DNS propagation can take 24-48 hours
- Check DNS with: `nslookup tixpeer.com`
- Verify DNS records in GoDaddy are correct

---

## Cost Estimates

### Free Tier (Hobby Projects)
- **Vercel**: Free for personal projects
- **Railway**: $5/month (500 hours)
- **Total**: ~$5/month

### Production Ready
- **Vercel Pro**: $20/month
- **Railway**: $10-20/month (database + backend)
- **Total**: $30-40/month

### Self-Hosted
- **DigitalOcean Droplet**: $6-12/month
- **Managed PostgreSQL**: $15/month (optional)
- **Total**: $6-27/month

---

## Need Help?

When you're ready to deploy, follow this guide step-by-step. If you run into issues:

1. Check the platform's documentation
2. Verify environment variables
3. Check application logs
4. Test locally first with production-like settings

Good luck with your deployment! 🚀
