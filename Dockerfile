# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Create the production image
FROM nginx:alpine

# Copy the build output from the previous stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration if it exists
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (nginx default)
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 