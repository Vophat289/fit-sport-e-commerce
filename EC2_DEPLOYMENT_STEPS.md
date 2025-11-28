# 🚀 EC2 Deployment Steps - Quick Guide

**Domain:** fitsport.io.vn  
**Status:** Ready to deploy

---

## 📋 Pre-Deployment Checklist

Before starting, ensure:
- [x] Code pushed to Git repository
- [ ] EC2 instance is running
- [ ] You have SSH access to EC2
- [ ] Domain `fitsport.io.vn` points to EC2 public IP
- [ ] Security Groups open: Port 22, 80, 443

---

## 🔐 Step 1: SSH to EC2

```bash
# Replace with your actual key and EC2 IP
ssh -i /path/to/your-key.pem ubuntu@your-ec2-public-ip

# Or if using username/password
ssh your-username@your-ec2-public-ip
```

---

## 📦 Step 2: Install Prerequisites (if not already installed)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo apt install docker-compose -y

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Git
sudo apt install git -y

# Verify installations
docker --version
docker-compose --version
nginx -v
```

---

## 📥 Step 3: Clone or Pull Repository

```bash
# If first time:
cd ~
git clone https://github.com/your-username/fit-sport-e-commerce.git
cd fit-sport-e-commerce

# If already cloned:
cd ~/fit-sport-e-commerce
git pull origin main
```

---

## 🔑 Step 4: Create .env File on EC2

```bash
# Navigate to backend folder
cd ~/fit-sport-e-commerce/backend

# Create .env from example
cp .env.example .env

# Edit with your actual values
nano .env
```

**Fill in these REQUIRED values:**
```bash
PORT=3000
BASE_URL=https://fitsport.io.vn/
MONGO_URI=mongodb+srv://vohongphat2892005_db_user:SCR7BUSuA9QpKaKZ@fitsport.lmb9vyc.mongodb.net/fit_sport?retryWrites=true&w=majority&appName=FitSport
JWT_SECRET=your-secret-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM_NAME=Fit Sport
MAIL_RECEIVER=admin@fitsport.io.vn
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NODE_ENV=production
FRONTEND_URL=https://fitsport.io.vn
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 🐳 Step 5: Start Docker Containers

```bash
# Go back to project root
cd ~/fit-sport-e-commerce

# Start backend and frontend only (we'll use system Nginx)
docker-compose up -d backend frontend

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f
```

**Expected output:**
```
backend    Up (healthy)
frontend   Up
```

Press `Ctrl+C` to exit logs.

---

## 🌐 Step 6: Configure Nginx (System Nginx, not Docker)

```bash
# Copy Nginx config to sites-available
sudo cp ~/fit-sport-e-commerce/nginx/fitsport.io.vn.conf /etc/nginx/sites-available/fitsport.io.vn

# Enable the site
sudo ln -s /etc/nginx/sites-available/fitsport.io.vn /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 Step 7: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate (this will auto-configure Nginx for HTTPS)
sudo certbot --nginx -d fitsport.io.vn -d www.fitsport.io.vn

# Follow the prompts:
# - Enter your email
# - Agree to terms (A)
# - Choose to redirect HTTP to HTTPS (option 2)
```

**Certbot will:**
- ✅ Obtain SSL certificates
- ✅ Update Nginx config automatically
- ✅ Setup HTTP → HTTPS redirect
- ✅ Configure auto-renewal

---

## ✅ Step 8: Verify Deployment

### Test 1: Check Containers
```bash
docker-compose ps
docker-compose logs backend
docker-compose logs frontend
```

### Test 2: Test Backend API
```bash
# Test through localhost
curl http://localhost:3000/api/health

# Test through Nginx
curl http://localhost/api/health

# Test HTTPS (after SSL)
curl https://fitsport.io.vn/api/health
```

### Test 3: Open in Browser
```
https://fitsport.io.vn
```

**Check:**
- ✅ Frontend loads
- ✅ HTTPS padlock shows
- ✅ Can view products
- ✅ Login works
- ✅ Admin dashboard accessible

---

## 🔧 Troubleshooting

### Container won't start
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Port already in use
```bash
sudo lsof -i :3000
sudo lsof -i :4200
sudo lsof -i :80

# Kill process if needed
sudo kill -9 <PID>
```

### Nginx errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### MongoDB connection failed
- Check if EC2 IP is whitelisted in MongoDB Atlas
- Go to MongoDB Atlas → Network Access → Add IP Address
- Add your EC2 public IP or use 0.0.0.0/0 (allow all)

### SSL certificate issues
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

---

## 🔄 Future Deployments (Updates)

When you push new code:

```bash
# SSH to EC2
ssh ubuntu@your-ec2-ip

cd ~/fit-sport-e-commerce

# Use deployment script
./deploy.sh
```

Or manually:
```bash
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d backend frontend
docker-compose logs -f
```

---

## 📊 Useful Commands

```bash
# View all logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Stop all containers
docker-compose down

# Check Nginx status
sudo systemctl status nginx

# Reload Nginx config
sudo systemctl reload nginx

# Check SSL certificate
sudo certbot certificates

# Renew SSL manually
sudo certbot renew
```

---

## ✅ Success Checklist

After completing all steps:

- [ ] Containers running: `docker-compose ps` shows "Up"
- [ ] Backend responds: `curl https://fitsport.io.vn/api/health`
- [ ] Frontend loads: Open `https://fitsport.io.vn` in browser
- [ ] SSL works: 🔒 padlock shows in browser
- [ ] HTTP redirects to HTTPS automatically
- [ ] Login functionality works
- [ ] Products display correctly
- [ ] Admin dashboard accessible
- [ ] Images load properly

---

## 🎉 Done!

Your application is now live at **https://fitsport.io.vn**! 🚀

Need help? Check:
- Full guide: [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- Docker logs: `docker-compose logs -f`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`
