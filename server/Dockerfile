
# Stage 1: Build
FROM node:22-alpine AS builder

# Install build dependencies for native modules (bcrypt, sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

COPY package*.json ./

# Install ALL dependencies
RUN npm install

COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

# Install runtime dependencies for native modules (sqlite3/bcrypt sometimes need these on alpine)
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy build artifacts explicitly
# NestJS builds to /usr/src/app/dist
COPY --from=builder /usr/src/app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p data && chmod 777 data

EXPOSE 3000

# Using explicit node command to avoid npm overhead and clarify entrypoint
# NestJS 11 uses main.js in the root of dist
CMD ["node", "dist/main.js"]
