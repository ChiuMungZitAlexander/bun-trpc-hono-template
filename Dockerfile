# Use the official Bun image
FROM oven/bun:1 as base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies (skip prepare script to avoid husky error)
RUN bun install --frozen-lockfile --ignore-scripts

# Copy source code
COPY . .

# Build the project
RUN bun run build

# Create production stage
FROM oven/bun:1 as production

WORKDIR /app

# Copy built dist folder and necessary files
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./
COPY --from=base /app/bun.lock ./

# Install only production dependencies (skip prepare script)
RUN bun install --frozen-lockfile --production --ignore-scripts

# Set environment variable for port
ENV PORT=8080

# Expose port 8080
EXPOSE 8080

# Start the application using the built dist
CMD ["bun", "run", "start"] 
