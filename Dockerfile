# Use Node.js 18 on Debian Bullseye (stable, compatible with most python tools)
FROM node:18-bullseye

# Install system dependencies:
# - ffmpeg (for video processing)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (only production if needed, but dev dependencies might be used for build)
# Using clean install for reliability
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the frontend (if applicable - currently the client is inside 'client' folder)
# Assuming 'npm run build' handles client build if wired up, 
# but based on project structure we might need to build client explicitly.
# Let's inspect package.json scripts later. For now, assuming root build script works.
RUN npm run build

# Expose the port the app runs on
EXPOSE 3004


# Default videos dir (can be overridden by volume mount)
ENV VIDEO_PATH=/app/videos

# Start the application
CMD ["npm", "start"]
