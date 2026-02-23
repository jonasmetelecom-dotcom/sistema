
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies
RUN npm install

COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy build artifacts and ensuring we get everything in dist
COPY --from=builder /usr/src/app/dist ./dist

# Ensure we have the data directory for SQLite
RUN mkdir -p data

EXPOSE 3000

# Using npm script to run
CMD ["npm", "run", "start:prod"]
