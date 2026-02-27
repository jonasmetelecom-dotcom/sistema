# Stage 1: Build
FROM node:22-alpine AS builder

# Install build dependencies for native modules (bcrypt, sqlite3)
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /usr/src/app

COPY package*.json ./

# Install ALL dependencies
RUN npm install

COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

# Install runtime dependencies
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy build artifacts
COPY --from=builder /usr/src/app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p data && chmod 777 data

EXPOSE 3000

# Using npm script to run
CMD ["npm", "run", "start:prod"]
