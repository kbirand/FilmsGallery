# Video Gallery Launch Guide

Follow these steps to start the application after a machine reboot.

## Prerequisites
- Node.js installed

## Step 1: Start the Backend Server
This handles video processing, thumbnail generation, and API requests.

1. Open a terminal (PowerShell or CMD).
2. Navigate to the project folder:
   ```bash
   cd C:\Users\info\Desktop\VideoGallery
   ```
3. Run the server:
   ```bash
   node server.js
   ```
   *You should see: `[STARTUP] Server running on http://localhost:3000`*

## Step 2: Start the Frontend Client
This is the user interface.

1. Open a **new** terminal window.
2. Navigate to the client folder:
   ```bash
   cd C:\Users\info\Desktop\VideoGallery\client
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *You should see a message indicating the server is running at `http://localhost:5173`*

## Step 3: Open the App
Open your web browser and go to:
**http://localhost:5173**

---

### Troubleshooting
- **Previews not generating?** Check `Logs/` folder for daily log files to see server activity.
- **Port already in use?** Ensure no other node processes are running. You can kill them with:
  ```powershell
  Get-Process node | Stop-Process
  ```
