# Step-by-Step Fix Instructions

## Step 1: Clean Up Docker Environment

```bash
# Stop all containers
docker-compose down

# Remove old images to force rebuild
docker rmi soundplus-backend soundplus-frontend

# Clean up dangling images
docker system prune -f
```

## Step 2: Verify Files are Updated

Check these files have been updated:
- ✓ `backend/Dockerfile` - uses `npm install`
- ✓ `frontend/Dockerfile` - uses `npm install`  
- ✓ `docker-compose.yml` - healthchecks removed
- ✓ `backend/index.js` - health endpoint simplified
- ✓ `backend/.env` - has valid MONGODB_URI

## Step 3: Start Fresh Build

```bash
# From project root directory
cd /mnt/d/Docker\ project/SoundPlus++

# Build and start containers (will take 2-3 minutes)
docker-compose up -d --build

# Wait 10 seconds for startup
sleep 10

# Check status
docker-compose ps
```

## Step 4: Verify Containers Running

```bash
# Should show both containers as "Up"
docker-compose ps

# Check backend logs (should show no npm errors)
docker logs soundplus-backend

# Check frontend logs
docker logs soundplus-frontend
```

## Step 5: Test Services

```bash
# Test backend health
curl http://localhost:5000/health

# Expected response: 
# {"status":"OK","message":"SoundPlus++ Backend is running!","timestamp":"..."}

# Test frontend
curl http://localhost:3000

# Or open browser:
# - Backend: http://localhost:5000
# - Frontend: http://localhost:3000
```

## Step 6: Run Jenkins Pipeline Again

Once local testing passes:

```bash
# Push changes to GitHub
git add .
git commit -m "Fix: Docker healthcheck and npm install issues"
git push origin main

# Trigger Jenkins pipeline
# Go to Jenkins UI and click "Build Now"
```

## Troubleshooting

If containers still fail to start:

### Check backend error:
```bash
docker logs soundplus-backend --tail 50
```

### Common issues and fixes:

**Issue**: `Cannot find module 'dotenv'`
- **Fix**: Run `docker-compose build --no-cache backend`

**Issue**: Container keeps restarting
- **Fix**: Check `.env` file has valid MONGODB_URI

**Issue**: Port 5000 already in use
- **Fix**: `docker ps` and `docker kill <container>`

### Nuclear Option (if all else fails):
```bash
docker-compose down -v  # Removes volumes too
docker system prune -a  # Remove all unused images
docker-compose up -d --build
```

## Performance Tips

1. **First build takes longer** (downloads Node.js image)
2. **Subsequent builds are faster** (uses cache)
3. **npm install can take 1-2 minutes** (installing 20+ packages)
4. **Database connection happens after startup** (not blocking)

## Success Indicators

✅ All containers show "Up" status  
✅ `docker logs` shows no "Cannot find module" errors  
✅ `/health` endpoint returns success  
✅ Frontend loads at localhost:3000  
✅ Jenkins pipeline completes without container errors
