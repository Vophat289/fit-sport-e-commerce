# FitSport E-commerce - Production Deployment

## 🚀 Quick Start (30-Second Overview)

1. **On EC2:** Install Docker, Docker Compose, Nginx
2. **Clone repo** and create `backend/.env` from template
3. **Start containers:** `docker-compose up -d backend frontend`
4. **Configure Nginx** on host with provided config
5. **Get SSL:** `sudo certbot --nginx -d fitsport.io.vn`
6. **Done!** Visit https://fitsport.io.vn

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Orchestrate backend, frontend, nginx containers |
| `backend/Dockerfile` | Backend container image |
| `frontend/Dockerfile` | Frontend container image (multi-stage build) |
| `backend/.env.example` | Environment variables template |
| `nginx/nginx.conf` | Nginx reverse proxy (containerized version) |
| `nginx/fitsport.io.vn.conf` | Nginx config for system Nginx (recommended) |
| `deploy.sh` | Automated deployment script |
| `DEPLOYMENT.md` | Complete deployment guide |

---

## ⚡ Recommended Approach

**Use System Nginx (not Docker Nginx)** for easier SSL management:

1. Start only backend + frontend containers
2. Use system Nginx as reverse proxy
3. Let Certbot auto-configure SSL

See [`DEPLOYMENT.md`](file:///home/vohongphat/WorkPlaces/FPT/fit-sport-e-commerce/DEPLOYMENT.md) for complete instructions.

---

## 🔑 Critical Steps

### 1. Create `.env` file

```bash
cd backend
cp .env.example .env
nano .env
```

Fill in:
- `MONGODB_URI` (from MongoDB Atlas)
- `JWT_SECRET` (generate random string)
- `FRONTEND_URL=https://fitsport.io.vn`

### 2. Configure DNS

Point `fitsport.io.vn` to your EC2 public IP

### 3. Open Security Groups

- Port 22 (SSH - your IP only)
- Port 80 (HTTP)
- Port 443 (HTTPS)

### 4. Deploy

```bash
# On EC2
git clone <repo>
cd fit-sport-e-commerce
docker-compose up -d backend frontend

# Configure Nginx
sudo cp nginx/fitsport.io.vn.conf /etc/nginx/sites-available/fitsport.io.vn
sudo ln -s /etc/nginx/sites-available/fitsport.io.vn /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Get SSL
sudo certbot --nginx -d fitsport.io.vn -d www.fitsport.io.vn
```

**Done!** Visit https://fitsport.io.vn

---

## 📚 Documentation

- **Full Guide:** [`DEPLOYMENT.md`](file:///home/vohongphat/WorkPlaces/FPT/fit-sport-e-commerce/DEPLOYMENT.md)
- **Troubleshooting:** See DEPLOYMENT.md section 8
- **Security:** See DEPLOYMENT.md section 9

---

## 🛠️ Quick Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart backend

# Update deployment
git pull && ./deploy.sh

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check SSL
sudo certbot certificates
```
