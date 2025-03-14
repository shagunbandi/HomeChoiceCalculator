# Dockerized Home Choice Calculator

This document explains how to use the Docker setup for the Home Choice Calculator application.

## Prerequisites

- Docker
- Docker Compose

## Getting Started

### Production Build

To build and run the production version of the application:

```bash
# Build and start the container
docker-compose up -d app

# Access the application at http://localhost:8080
```

### Development Mode

For development with hot-reloading:

```bash
# Build and start the container in development mode
docker-compose up dev

# Access the application at http://localhost:3000
```

## Docker Commands Reference

### Building the Images

```bash
# Build both images
docker-compose build

# Build only the production image
docker-compose build app

# Build only the development image
docker-compose build dev
```

### Managing Containers

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Access a shell in the container
docker-compose exec app sh
docker-compose exec dev sh
```

## Configuration

- The production build serves the application on port 8080
- The development build serves the application on port 3000 with hot-reloading
- The Nginx configuration for the production build is in `nginx.conf`

## Customization

- To modify the Nginx configuration, edit the `nginx.conf` file
- To modify the Docker setup, edit the `Dockerfile`, `Dockerfile.dev`, or `docker-compose.yml` files
- To change the exposed ports, edit the `ports` section in `docker-compose.yml` 