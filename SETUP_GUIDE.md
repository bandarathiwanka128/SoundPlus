# SoundPlus++ Complete Setup & Running Guide

## 📚 Table of Contents
1. [Quick Start (Easiest)](#quick-start-easiest)
2. [Prerequisites](#prerequisites)
3. [Running the Project](#running-the-project)
4. [Jenkins Integration Setup](#jenkins-integration-setup)
5. [GitHub Configuration](#github-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start (Easiest)

**If you just want to run the project quickly:**

```bash
# 1. Navigate to project root
cd SoundPlus++

# 2. Start everything with Docker Compose
docker-compose up --build

# 3. Access the application
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
# Health:   http://localhost:5000/health
```

That's it! The entire application (Frontend + Backend) will start in ~2-3 minutes.

---

## Prerequisites

Before running this project, ensure you have:

### Required Software
- **WSL 2 (Windows Subsystem for Linux)** - [Setup Guide](https://docs.microsoft.com/en-us/windows/wsl/install)
  - Run: `wsl --install`
  - Recommended: Ubuntu distribution
  
- **Docker (inside WSL)** - Install via apt in WSL terminal:
  ```bash
  sudo apt-get update
  sudo apt-get install docker.io docker-compose
  sudo usermod -aG docker $USER
  ```
  
- **Git** - [Download here](https://git-scm.com/)
  - For cloning and managing the repository
  - Or install in WSL: `sudo apt-get install git`

### Optional (for local development without Docker)
- **Node.js v18+** - [Download here](https://nodejs.org/)
- **MongoDB Atlas Account** - [Create free account](https://www.mongodb.com/cloud/atlas)

### Hardware Requirements
- At least 4GB RAM available
- 2+ CPU cores
- 2GB free disk space

---

## Running the Project

### Method 1: Using Docker Compose (Recommended ⭐)

**Step 1: Prepare Environment Files**

Create backend configuration file: `backend/.env`
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/soundplus?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here_change_me_in_production
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

Create frontend configuration file: `frontend/.env`
```bash
VITE_API_URL=http://localhost:5000
NODE_ENV=production
```

**Step 2: Start Services**

```bash
cd SoundPlus++

# Build and start all services
docker-compose up --build

# Or if images already built, just start:
docker-compose up

# To run in background:
docker-compose up -d --build
```

**Step 3: Access Application**

| Component | URL |
|-----------|-----|
| Frontend (UI) | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/health |

**Step 4: Stop Services**

```bash
# Stop but keep containers
docker-compose stop

# Stop and remove everything
docker-compose down

# Remove everything including volumes
docker-compose down -v
```

---

### Method 2: Local Development (Without Docker)

**Backend Setup:**

```bash
cd backend

# Install dependencies
npm install

# Create .env file
# Add same variables as above

# Start backend
npm start

# Or use nodemon for auto-reload
npm run dev
```

Backend runs on: `http://localhost:5000`

**Frontend Setup:**

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
# Add VITE_API_URL=http://localhost:5000

# Start frontend dev server
npm run dev

# Build for production
npm run build
```

Frontend runs on: `http://localhost:5173` (or specified port)

---

## Jenkins Integration Setup

### 🎯 What is Jenkins?
Jenkins is a **Continuous Integration/Continuous Deployment (CI/CD) tool**. It automatically builds, tests, and deploys your code when you push to GitHub.

### Prerequisites for Jenkins
- Linux/Mac machine (or Windows with WSL)
- Jenkins installed and running
- Docker installed on Jenkins machine
- GitHub repository access

### Step 1: Install Jenkins (if not already installed)

**On Ubuntu/Debian:**
```bash
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update
sudo apt-get install jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins
```

Access Jenkins at: `http://localhost:8080`

### Step 2: Run Setup Script

```bash
# Make script executable
chmod +x scripts/setup-jenkins.sh

# Run with sudo (required for Docker group modifications)
sudo bash scripts/setup-jenkins.sh
```

This script will:
- ✅ Add Jenkins user to Docker group
- ✅ Verify Docker socket permissions
- ✅ Test Jenkins Docker access
- ✅ Restart Jenkins

### Step 3: Create Jenkins Job

**In Jenkins Web Interface:**

1. Click **"New Item"** → **"Pipeline"** → Name it **"SoundPlus-CI-CD"**

2. Under **Pipeline** section:
   - Select **"Pipeline script from SCM"**
   - SCM: **Git**
   - Repository URL: `https://github.com/YourUsername/SoundPlus++.git`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`

3. Click **Save**

### Step 4: Add GitHub Webhook (Auto-trigger builds)

**In GitHub:**
1. Go to your repository → **Settings** → **Webhooks**
2. Click **"Add webhook"**
3. Payload URL: `http://your-jenkins-domain/github-webhook/`
4. Content type: `application/json`
5. Select: **"Just the push event"**
6. Click **"Add webhook"**

Now every push to `main` branch will **automatically trigger Jenkins build**.

### Step 5: Add Docker Hub Credentials

**In Jenkins Web Interface:**

1. Go to **Manage Jenkins** → **Manage Credentials**
2. Click **"global"** → **"Add Credentials"**
3. Add Docker Hub username:
   - Kind: **Secret text**
   - Secret: `your-docker-username`
   - ID: `dockerhub-username`
4. Repeat for Docker Hub password/token

### Step 6: Test the Pipeline

1. In Jenkins, go to **"SoundPlus-CI-CD"** job
2. Click **"Build Now"**
3. Check the **Console Output** for logs

**Expected Pipeline Stages:**
- ✅ Checkout (Clone from GitHub)
- ✅ Pre-flight Check (Docker version verification)
- ✅ Setup Environment (.env files)
- ✅ Build Images (Docker build)
- ✅ Start Services (Docker run)
- ✅ Verify Services (Health checks)
- ✅ Success (Deployment complete)

---

## GitHub Configuration

### Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click **"New repository"**
3. Name: `SoundPlus++`
4. Description: `Premium audio equipment e-commerce platform`
5. Public or Private (your choice)
6. Click **"Create repository"**

### Step 2: Push Your Code to GitHub

```bash
cd SoundPlus++

# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: SoundPlus++ e-commerce platform"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YourUsername/SoundPlus++.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 3: Configure GitHub Secrets (Optional but Recommended)

**For Jenkins to access private repos:**

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add secrets:
   - `DOCKER_HUB_USERNAME`: Your Docker Hub username
   - `DOCKER_HUB_PASSWORD`: Your Docker Hub token
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key

### Step 4: Protect Main Branch (Optional)

1. Go to **Settings** → **Branches**
2. Click **"Add rule"**
3. Branch name pattern: `main`
4. Enable **"Require pull request reviews"**
5. Enable **"Require status checks to pass"**

This ensures code review before merging to main.

---

## Useful Docker Commands

```bash
# List all containers
docker ps -a

# List all images
docker images

# View container logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute command in container
docker-compose exec backend npm install

# Rebuild images
docker-compose up --build

# Remove everything (warning: deletes containers and volumes)
docker-compose down -v

# Check resource usage
docker stats

# Clean up unused resources
docker system prune
```

---

## Environment Variables Explained

### Backend (.env)

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | Environment mode | `production` or `development` |
| `PORT` | Backend server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/soundplus` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-random-secret-key` |
| `BACKEND_URL` | Public backend URL | `http://localhost:5000` |
| `FRONTEND_URL` | Public frontend URL | `http://localhost:3000` |

### Frontend (.env)

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | Backend API endpoint | `http://localhost:5000` |
| `NODE_ENV` | Environment mode | `production` or `development` |

---

## Project Structure

```
SoundPlus++/
├── backend/                 # Node.js + Express API
│   ├── Dockerfile          # Docker config for backend
│   ├── index.js            # Main server file
│   ├── package.json        # Dependencies
│   └── uploads/            # User-uploaded images
├── frontend/               # React + Vite UI
│   ├── Dockerfile          # Docker config for frontend
│   ├── vite.config.js      # Vite configuration
│   ├── package.json        # Dependencies
│   └── src/
│       ├── components/     # React components
│       ├── pages/          # Page components
│       └── main.jsx        # App entry point
├── scripts/
│   └── setup-jenkins.sh    # Jenkins setup automation
├── docker-compose.yml      # Multi-container orchestration
├── Jenkinsfile             # Jenkins pipeline definition
└── README.md               # Project documentation
```

---

## Troubleshooting

### Problem: Port Already in Use
```bash
# Kill process using port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Kill process using port 5000 (backend)
lsof -ti:5000 | xargs kill -9
```

### Problem: Docker Not Found
```bash
# Ensure Docker is installed and running
docker --version
docker ps

# On Windows, start Docker Desktop application
```

### Problem: MongoDB Connection Failed
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure network connectivity

### Problem: Jenkins Cannot Access Docker
```bash
# Add jenkins user to docker group
sudo usermod -aG docker jenkins

# Verify permissions
sudo -u jenkins docker ps

# Restart Jenkins
sudo systemctl restart jenkins
```

### Problem: Frontend Cannot Connect to Backend
- Check `VITE_API_URL` in `frontend/.env`
- Ensure backend is running: `curl http://localhost:5000/health`
- Check browser console for errors (F12)

### Problem: Docker Compose Build Fails
```bash
# Clear Docker cache
docker-compose down -v
docker system prune -a

# Try again
docker-compose up --build
```

---

## Quick Reference Checklist

- [ ] Docker Desktop installed and running
- [ ] Git installed
- [ ] `.env` files created (backend and frontend)
- [ ] `docker-compose up --build` command runs successfully
- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend accessible at http://localhost:5000
- [ ] GitHub repository created and code pushed
- [ ] Jenkins installed (if using CI/CD)
- [ ] Jenkins webhooks configured
- [ ] MongoDB Atlas URI set in backend .env

---

## Next Steps

1. **Run locally**: `docker-compose up --build`
2. **Push to GitHub**: `git push origin main`
3. **Setup Jenkins**: Follow Jenkins Integration section
4. **Configure webhooks**: Auto-trigger builds on push
5. **Monitor logs**: `docker-compose logs -f`

---

## Support & Resources

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Guide](https://docs.docker.com/compose)
- [Jenkins Documentation](https://www.jenkins.io/doc)
- [GitHub Actions Guide](https://docs.github.com/en/actions)
- [MongoDB Atlas](https://docs.atlas.mongodb.com)

---

**Last Updated**: January 2026
**Project**: SoundPlus++ - Premium Audio E-commerce Platform
