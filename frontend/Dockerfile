# Frontend Dockerfile for SoundPlus++
FROM node:18-slim

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with verbose output
RUN npm install --verbose && npm cache clean --force

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Set environment to production (Vite will optimize build)
ENV NODE_ENV=production

# Health check - using curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:3000 || exit 1

# Start the development server (config in vite.config.js)
CMD ["npm", "run", "dev"]
