# Use the official Node.js 18 LTS image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the application code
COPY . .

# Remove development files and test directories
RUN rm -rf tests/ jest.config.json .env.test.example

# Create logs directory and set permissions
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app

# Switch to the non-root user
USER nodejs

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]
