# FilmsGallery

A modern, self-hosted video gallery application designed for managing and viewing local video archives. Optimized for performance on NAS devices (like Synology) with support for on-the-fly transcoding and pre-generated 4K previews.

## Features

- **Local Video Scanning**: Recursively scans directories for `.mov`, `.mp4`, `.mkv`, and `.webm` files.
- **Smart Playback**:
  - **Direct Stream**: Plays pre-generated MP4s for instant, CPU-light playback.
  - **Transcoding Fallback**: Automatically transcodes unsupported formats (like ProRes `.mov`) to browser-compatible H.264/AAC on the fly.
  - **Low-Latency**: Optimized `ultrafast` preset and 720p scaling for efficient streaming on lower-power CPUs (e.g., Ryzen V1500B).
- **Media Manager**:
  - Dashboard to identify missing Thumbnails or Preview MP4s.
  - One-click generation of missing assets (4K, High Profile 5.2, 40Mbps).
- **Rich Thumbnails**:
  - **Dynamic Previews**: Hover over thumbnails to see a 9-clip fast-forward preview.
  - **Frame Capture**: Built-in tool to play a video, scrub frame-by-frame, and capture the perfect cover image.
- **Download Options**:
  - **Download Original**: Get the source file (e.g., ProRes master).
  - **Download MP4**: Get the optimized/transcoded MP4 version.
- **Modern UI**: Dark mode, responsive grid, sortable library, and detailed video metadata.

## Prerequisites

- **Node.js**: v16 or higher (for local development).
- **FFmpeg**: Required for thumbnail generation and transcoding.
  - *Note*: The application uses `ffmpeg-static` and `ffprobe-static` for local execution, ensuring binaries are available.
- **Docker**: Recommended for deployment.

## Installation & Running Locally

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/FilmsGallery.git
   cd FilmsGallery
   ```

2. **Install Dependencies**
   ```bash
   # Install server dependencies
   npm install

   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Configuration (.env)**
   Create a `.env` file in the root directory:
   ```env
   PORT=3004
   VIDEO_PATH=Z:\01_FilmArchive  # Path to your video source
   MP4_PATH=./mp4                # Path to store/read pre-generated MP4s
   ```

4. **Start the Development Server**
   ```bash
   # Terminal 1: Backend
   npm start

   # Terminal 2: Frontend
   cd client
   npm run dev
   ```
   Access the app at `http://localhost:5173`.

## Deployment (Docker / Synology NAS)

This application is containerized and ready for deployment using Docker Compose.

1. **Prepare Directory Structure**
   On your NAS/Server:
   ```text
   /volume1/docker/filmsgallery/
   ├── docker-compose.yml
   ├── mp4/                  # Storage for generated previews
   └── thumbnails/           # Storage for generated thumbnails
   ```

2. **docker-compose.yml**
   ```yaml
   version: "3"
   services:
     app:
       image: node:18-alpine
       working_dir: /app
       volumes:
         - ./:/app
         - /volume1/01_FilmArchive:/videos:ro  # Read-only mount of your video library
         - ./mp4:/app/mp4                      # Read/Write for pre-generated MP4s
         - ./thumbnails:/app/thumbnails        # Read/Write for thumbnails
       ports:
         - "3004:3004"
       environment:
         - PORT=3004
         - VIDEO_PATH=/videos
         - MP4_PATH=/app/mp4
       command: sh -c "npm install && npm start"
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   ```

## Project Structure

```text
FilmsGallery/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── App.jsx         # Main UI Component
│   │   └── ...
│   └── vite.config.js      # Vite Config (Proxy to Backend)
├── server.js               # Node.js Express Backend
├── videos/                 # Default local video directory (if env not set)
├── thumbnails/             # Generated thumbnails cache
├── mp4/                    # Pre-generated MP4 storage
├── package.json            # Server dependencies
└── docker-compose.yml      # Docker deployment config
```

## Media Manager

The **Media Manager** is a built-in tool accessible via the settings icon in the header.
- **Status Check**: Scans your recursive video library.
- **Missing Asset Detection**: Flags files missing `.jpg` thumbnails or `.mp4` previews.
- **Generator**: Uses FFmpeg to generate compliant 4K H.264 MP4s for missing items.

---
Built with Node.js, Express, React, Vite, and FFmpeg.
