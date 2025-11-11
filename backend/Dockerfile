# Backend Dockerfile for SoundPlus++
FROM node:18-alpine

# Install curl for healthcheck with retry logic
RUN apk update && \
    apk add --no-cache curl || \
    (apk update && apk add --no-cache curl) || \
    echo "Warning: curl installation failed, using node-based healthcheck instead"

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (production + dev dependencies for nodemon)
RUN npm ci --only=production && npm install

# Copy application files
COPY . .

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chmod 755 uploads

# Expose port
EXPOSE 5000

# Health check - with curl fallback
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "index.js"]
