# Auto-Launch & Process Management Guide (Windows)

This guide explains how to keep your VideoGallery application running in the background automatically, even after you close the terminal or restart your computer.

## We use PM2 (Process Manager 2)
PM2 is a production process manager for Node.js applications. It allows you to keep applications alive forever, reload them without downtime, and manage them easily.

## 1. Installation

Run the following command in PowerShell (Administrator) to install PM2 globally:

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```
*Note: `pm2-windows-startup` helps with auto-starting PM2 on Windows boot.*

## 2. Starting the Applications

We need to start both the **Backend** (server.js) and the **Frontend** (Vite).

### Step 1: Start Backend
```powershell
cd C:\Users\info\Desktop\VideoGallery
pm2 start server.js --name "vg-server"
```

### Step 2: Start Frontend
Since Vite is a dev server, we can run it via npm.
```powershell
cd C:\Users\info\Desktop\VideoGallery\client
pm2 start npm --name "vg-client" -- run dev
```

Your app is now running in the background! You can close the terminal window.

## 3. Managing the Application

### Check Status
See if your apps are running, their uptime, and memory usage:
```powershell
pm2 status
```

### View Logs
See the console output (real-time) for debugging:
```powershell
# View all logs
pm2 logs

# View specific logs
pm2 logs vg-server
pm2 logs vg-client
```

### Restart
If you make changes to the code:
```powershell
pm2 restart vg-server
pm2 restart vg-client
# Or restart all
pm2 restart all
```

### Stop
To stop the application:
```powershell
pm2 stop all
```

## 4. Auto-Launch on Startup

To make sure VideoGallery starts automatically when your computer turns on:

1. **Install the Startup Script:**
   Run this in PowerShell as Administrator:
   ```powershell
   pm2-startup install
   ```

2. **Save the Current Process List:**
   Once both apps are running (from Section 2), save the configuration:
   ```powershell
   pm2 save
   ```

Now, PM2 will automatically resurrect your app after a reboot!

## 5. Troubleshooting

### App keeps restarting (Crash Loop)
Check the logs to see the error:
```powershell
pm2 logs vg-server --lines 100
```

### Remove the App
If you want to stop using PM2 for this app:
```powershell
pm2 delete all
```

### Update PM2
```powershell
npm install pm2 -g && pm2 update
```
