# Synology NAS (DSM 7+) Deployment Guide

This guide explains how to deploy the Video Gallery application on your Synology NAS using **Docker (Container Manager)**. This is the recommended method as it ensures all dependencies (FFmpeg, Python, yt-dlp) are bundled and compatible.

## Prerequisites

1.  **Container Manager**: Installed from Synology Package Center (formerly "Docker").
2.  **Access**: SSH access to your NAS (optional but easier) OR ability to upload files via File Station.
3.  **Video Folder**: A shared folder containing your YouTube archive (e.g., `/volume1/Works/02_YTArchive`).

## Step 1: Prepare Files

You need to copy the project files to your NAS.
1.  Create a folder on your NAS, e.g., `/volume1/docker/video-gallery`.
2.  Copy the entire project content to this folder.

## Step 2: Configure Environment

1.  Open the `.env` file on your NAS (or rename `env.example` if you have one).
2.  **CRITICAL**: Update the `VIDEO_PATH` variable in `.env` to point to the **HOST** path on your Synology.
    ```env
    # On Synology, this should be the path visible to the docker-compose file context,
    # OR simpler: rely on the docker-compose mapping.
    # IN DOCKER, the internal path is ALWAYS /app/videos
    VIDEO_PATH=/volume1/Works/02_YTArchive 
    ```
    *Note: In the provided `docker-compose.yml`, we map `${VIDEO_PATH}` from the host to `/app/videos` in the container.*

## Step 3: Run with Docker Compose

### Method A: SSH (Recommended)
1.  SSH into your NAS: `ssh admin@192.168.1.X`
2.  Navigate to the folder: `cd /volume1/docker/video-gallery`
3.  Build and run:
    ```bash
    sudo docker-compose up -d --build
    ```
4.  The app will start on port `3000`. Access it at `http://YOUR-NAS-IP:3000`.

### Method B: Synology Container Manager UI
1.  Open **Container Manager**.
2.  Go to **Project** -> **Create**.
3.  Name: `video-gallery`.
4.  Path: Select the folder where you uploaded the files (`/docker/video-gallery`).
5.  Select "Use existing docker-compose.yml".
6.  Click **Next** and **Done**. Synology will build the image and start the container.

## Troubleshooting

-   **Permission Errors**: Ensure the Docker container has read/write access to your Video folder. You may need to adjust permissions in File Station (give access to `Everyone` or the specific docker user ID if known).
-   **Performance**: Generating embeddings (AI Search) requires CPU. On a DS1821+, the Ryzen CPU handles this well, but the initial index might take time.
-   **FFmpeg/yt-dlp**: These are inside the container only. You do NOT need to install them on DSM.

## Updates
If you update the code, simply run:
```bash
sudo docker-compose up -d --build
```
This rebuilds the container with the latest changes.
