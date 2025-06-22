# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN npm ci --include=dev && npm cache clean --force
COPY . .
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production dependencies stage
FROM base AS deps
ENV NODE_ENV=production
RUN npm ci --only=production && npm cache clean --force

# Production build stage
FROM base AS build
ENV NODE_ENV=production
RUN npm ci --include=dev && npm cache clean --force
COPY . .
# Run any build steps if needed (e.g., TypeScript compilation, asset building)
# RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Remove development files and unnecessary directories
RUN rm -rf \
    tests/ \
    jest.config.json \
    .env.test.example \
    .eslintrc.json \
    .prettierrc.json \
    docs/ \
    *.md \
    .git \
    .gitignore

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/temp && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
