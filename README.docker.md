# Home Choice Calculator - Setup Guide

This document explains how to run the Home Choice Calculator application.

## Prerequisites

- Node.js (v18 or higher)
- npm
- Docker & Docker Compose (for production deployment only)
- [just](https://github.com/casey/just) command runner (optional, but recommended)

## Quick Start

### Development

Run the application locally with hot-reloading:

```bash
# Using just
just dev

# Or using npm directly
npm install
npm run dev
```

Access the application at http://localhost:5173

### Production Deployment

Deploy the application using Docker:

```bash
# Using just
just prod-up-build

# Or using docker-compose directly
docker-compose up --build -d
```

The application will be served via Nginx and accessible through Traefik at the configured domain.

## Available Commands

The project uses [just](https://github.com/casey/just) for task management. Run `just` to see all available commands:

### Development Commands

- `just dev` - Start development server
- `just install` - Install npm dependencies
- `just build` - Build the application
- `just preview` - Preview production build locally
- `just check` - Run TypeScript type checking

### Production Commands

- `just prod-up` - Start production environment
- `just prod-up-d` - Start production in detached mode
- `just prod-up-build` - Build and start production
- `just prod-down` - Stop production environment
- `just prod-logs` - View production logs
- `just prod-restart` - Restart production environment

### Utility Commands

- `just clean` - Clean up Docker resources

## Configuration

### Production Setup

- The production build uses Nginx to serve static files
- Traefik handles SSL certificates and routing
- The application is accessible at `mortgage.geekynavigator.com`
- Nginx configuration is in `nginx.conf`

### Customization

- To modify Nginx settings, edit `nginx.conf`
- To change Docker configuration, edit `Dockerfile` or `docker-compose.yml`
- To update Traefik labels, edit the labels section in `docker-compose.yml` 