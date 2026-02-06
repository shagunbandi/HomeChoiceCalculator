# Mortgage Calculator - Just Commands

# Default recipe - show available commands
default:
    @just --list

# Development Commands

# Start development server
dev:
    npm run dev

# Install dependencies
install:
    npm install

# Build the application
build:
    npm run build

# Preview production build locally
preview:
    npm run preview

# Run TypeScript type checking
check:
    npm run check

# Production Environment Commands

# Start production environment
prod-up:
    docker-compose up -d

# Build and start production environment
prod-up-build:
    docker-compose up --build

# Stop production environment
prod-down:
    docker-compose down

# View production logs
prod-logs:
    docker-compose logs -f

# Restart production environment
prod-restart:
    docker-compose restart

# Utility Commands

# Clean up Docker resources
clean:
    docker system prune -f
