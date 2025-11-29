# 🚀 Deployment Guide - FitSport E-commerce

Complete guide to deploy backend and frontend to EC2 with Docker, Nginx, and SSL.

**Domain:** `fitsport.io.vn`  
**Tech Stack:** Node.js (Backend) + Angular (Frontend) + MongoDB Atlas + Docker + Nginx

---

## 📋 Prerequisites Checklist

Before starting deployment, ensure you have:

- [x] EC2 instance running (Ubuntu/Debian)
- [x] Docker installed on EC2
- [x] Docker Compose installed on EC2
- [x] Nginx installed on EC2
- [x] Domain `fitsport.io.vn` pointing to EC2 public IP
- [x] MongoDB Atlas cluster created
- [ ] SSH access to EC2 instance
- [ ] Git repository accessible from EC2

---

## 🔧 Part 1: Local Preparation

### Step 1: Create Environment File

Create `backend/.env` from the template:

```bash
cd /home/vohongphat/WorkPlaces/FPT/fit-sport-e-commerce/backend
cp .env.example .env
```

Edit `.env` with your actual values:
```bash
nano .env
```

**Required values:**
- `MONGODB_URI` - Get from MongoDB Atlas (Connect → Drivers)
- `JWT_SECRET` - Generate a secure random string
- `FRONTEND_URL=https://fitsport.io.vn`

### Step 2: Test Build Locally (Optional but Recommended)

```bash
cd /home/vohongphat/WorkPlaces/FPT/fit-sport-e-commerce

# Build images
docker-compose build

# Start containers
docker-compose up

# In another terminal, test:
curl http://localhost:3000/api/health
curl http://localhost:4200
```

If everything works, stop with `Ctrl+C` and proceed to EC2 deployment.

### Step 3: Push Code to Repository

```bash
git add .
git commit -m "Add production deployment configuration"
git push origin main
```

---

## 🌐 Part 2: DNS Configuration

### Configure DNS Records

Go to your domain registrar and add/verify:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `<your-ec2-public-ip>` | 300 |
| A | www | `<your-ec2-public-ip>` | 300 |

Verify DNS propagation:
```bash
dig fitsport.io.vn
# or
nslookup fitsport.io.vn
```

---

## 🔐 Part 3: EC2 Security Configuration

### Configure Security Group

In AWS Console → EC2 → Security Groups, ensure these ports are open:

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 22 | TCP | Your IP | SSH access |
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |

**IMPORTANT:** Restrict port 22 to your IP only for security!

---

## 📦 Part 4: EC2 Deployment

### Step 1: SSH to EC2

```bash
ssh -i your-key.pem ubuntu@<ec2-public-ip>
# or if using username/password
ssh your-username@<ec2-public-ip>
```

### Step 2: Install Required Software (if not already installed)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo apt install docker-compose -y

# Add user to docker group (to run without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Install Git
sudo apt install git -y

# Verify installations
docker --version
docker-compose --version
git --version
```

### Step 3: Clone Repository

```bash
# Navigate to your desired directory
cd /home/ubuntu

# Clone your repository
git clone <your-repository-url>
cd fit-sport-e-commerce

# Or if already cloned, just pull
# cd fit-sport-e-commerce
# git pull origin main
```

### Step 4: Setup Environment Variables

```bash
# Create .env file from template
cd backend
cp .env.example .env

# Edit with your values
nano .env
```

Fill in your MongoDB Atlas URI and other secrets.

### Step 5: Initial Deployment WITHOUT SSL

First, we'll deploy without SSL to test everything works:

```bash
cd /home/ubuntu/fit-sport-e-commerce

# Temporarily comment out SSL in nginx.conf or start without nginx
# For now, just start backend and frontend
docker-compose up -d backend frontend
```

Check if services are running:
```bash
docker-compose ps
docker-compose logs -f
```

Test backend:
```bash
curl http://localhost:3000/api/health
```

### Step 6: Configure Nginx on Host

We'll use the system Nginx (already installed) instead of containerized one for easier SSL setup.

Copy Nginx config:
```bash
# Create sites directory if doesn't exist
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# Create Nginx config for fitsport.io.vn
sudo nano /etc/nginx/sites-available/fitsport.io.vn
```

Paste this configuration (HTTP only, for now):

```nginx
# HTTP server
server {
    listen 80;
    server_name fitsport.io.vn www.fitsport.io.vn;

    client_max_body_size 20M;

    # Backend API routes
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend uploads
    location /uploads/ {
        proxy_pass http://localhost:3000/uploads/;
        proxy_set_header Host $host;
    }

    # Frontend routes
    location / {
        proxy_pass http://localhost:4200/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/fitsport.io.vn /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 7: Test HTTP Access

Open browser and visit:
```
http://fitsport.io.vn
```

You should see your frontend! Test API calls from frontend.

---

## 🔒 Part 5: Setup SSL with Let's Encrypt

### Step 1: Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Step 2: Obtain SSL Certificate

```bash
# This will automatically configure Nginx for HTTPS
sudo certbot --nginx -d fitsport.io.vn -d www.fitsport.io.vn

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)
```

Certbot will:
- Obtain SSL certificates
- Automatically update your Nginx config
- Setup HTTP → HTTPS redirect

### Step 3: Test Auto-Renewal

```bash
# Test renewal process
sudo certbot renew --dry-run
```

Certbot will auto-renew certificates before expiry.

### Step 4: Verify HTTPS

Visit:
```
https://fitsport.io.vn
```

You should see the 🔒 lock icon!

---

## 🎯 Part 6: Using Deployment Script (Future Deployments)

For subsequent deployments, use the automated script:

```bash
cd /home/ubuntu/fit-sport-e-commerce
./deploy.sh
```

This script will:
- Pull latest code
- Rebuild containers
- Restart services
- Show logs

---

## 🔍 Part 7: Verification & Testing

### Check Container Status

```bash
docker-compose ps
```

All services should show `Up` status.

### View Logs

```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Test Backend API

```bash
# Health check
curl https://fitsport.io.vn/api/health

# Test specific endpoints
curl https://fitsport.io.vn/api/products
```

### Test Frontend

Open browser:
```
https://fitsport.io.vn
```

Test:
- Homepage loads
- Products display
- Login works
- Admin dashboard accessible
- Images upload correctly

---

## 🛠️ Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Check if port is already in use
sudo lsof -i :3000
sudo lsof -i :4200
```

### Nginx errors

```bash
# Check Nginx syntax
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### SSL certificate issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx SSL config
sudo nano /etc/nginx/sites-available/fitsport.io.vn
```

### Database connection errors

- Verify MongoDB Atlas connection string in `.env`
- Check if EC2 IP is whitelisted in MongoDB Atlas
- Test connection:
  ```bash
  docker-compose exec backend node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(err => console.log(err))"
  ```

### Frontend can't reach backend

- Check CORS settings in backend
- Verify `FRONTEND_URL` in backend `.env`
- Check Nginx reverse proxy configuration
- Check browser console for errors

---

## 📊 Monitoring & Maintenance

### Monitor Disk Space

```bash
df -h
docker system df
```

### Clean up Docker

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup (careful!)
docker system prune -a --volumes
```

### Backup Database

MongoDB Atlas handles backups automatically, but you can export manually:

```bash
# Install mongodump
sudo apt install mongo-tools

# Export database
mongodump --uri="<your-mongodb-uri>" --out=/backup/$(date +%Y%m%d)
```

### Update Application

```bash
cd /home/ubuntu/fit-sport-e-commerce
git pull origin main
./deploy.sh
```

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - They're gitignored for a reason
2. **Use strong JWT secrets** - Generate with: `openssl rand -base64 64`
3. **Keep EC2 security groups tight** - Only open necessary ports
4. **Enable AWS CloudWatch** - Monitor EC2 metrics
5. **Setup fail2ban** - Protect against brute force attacks
6. **Regular updates** - Keep system and Docker images updated
7. **Backup regularly** - Both database and uploaded files

---

## 📞 Quick Commands Reference

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs -f

# Rebuild and restart
docker-compose up -d --build

# Check status
docker-compose ps

# SSH to container
docker-compose exec backend sh

# Nginx commands
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t

# SSL certificate
sudo certbot certificates
sudo certbot renew
```

---

## ✅ Success Checklist

- [ ] DNS points to EC2
- [ ] Frontend loads at https://fitsport.io.vn
- [ ] Backend API responds at https://fitsport.io.vn/api
- [ ] SSL certificate valid (🔒 icon shows)
- [ ] HTTP redirects to HTTPS
- [ ] Login/Authentication works
- [ ] Product images display correctly
- [ ] Admin dashboard accessible
- [ ] File uploads work
- [ ] No console errors in browser

---

## 🎉 Done!

Your FitSport e-commerce is now live at **https://fitsport.io.vn**!

For issues or questions, check the logs first:
```bash
docker-compose logs -f
sudo tail -f /var/log/nginx/error.log
```
