# Multi-stage build for Rabbitask Angular App
# Based on feat/container refactoring for environment-agnostic deployments

# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build the application
# Build argument for API URL can be passed at build time
ARG API_URL=https://localhost:7263/api
ENV ANGULAR_API_URL=${API_URL}

RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/www /usr/share/nginx/html

# Create entrypoint script to inject environment variables
COPY docker/entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Environment variables (set at runtime)
ENV ANGULAR_API_URL=""

# Run entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

# Expose port
EXPOSE 80

# Labels
LABEL maintainer="Rabbitask Team"
LABEL version="1.0"
LABEL description="Rabbitask Angular Application - Container Image"
