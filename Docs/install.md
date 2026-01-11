# Installation Guide

## Prerequisites
- Node.js (v18 or higher recommended)
- npm

## Setup Steps

### 1. Root Dependencies
Install the server dependencies:
```bash
npm install
```

### 2. Client Setup
Install client dependencies and build the frontend:
```bash
cd client
npm install
npm run build
cd ..
```

### 3. Environment Configuration
Ensure you have a `.env` file in the root directory. You can use `.env.example` as a template.
```bash
cp .env.example .env
```
Update `YOUTUBE_CHANNEL_ID` and `VIDEO_PATH` in `.env` if necessary.

## Running the Application

Start the server:
```bash
node server.js
```

The application will be available at [http://localhost:3000](http://localhost:3000).
