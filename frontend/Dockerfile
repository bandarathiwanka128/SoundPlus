# Frontend Dockerfile for SoundPlus++
FROM node:18-alpine

# Install curl for healthcheck with retry logic
RUN apk update && \
    apk add --no-cache curl || \
    (apk update && apk add --no-cache curl) || \
    echo "Warning: curl installation failed, using node-based healthcheck instead"

# Set working directory
WORKDIR /usr/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Set environment to development
ENV NODE_ENV=development

# Health check - using curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start the development server (config in vite.config.js)
CMD ["npm", "run", "dev"]
