import express from 'express';
import cors from 'cors';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import multer from 'multer';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
const envPath = path.join(__dirname, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Failed to load .env file:', result.error);
} else {
  console.log('Loaded .env from:', envPath);
}

// Global Error Handlers
process.on('uncaughtException', (err) => {
  console.error('CRITICAL ERROR (Uncaught Exception):', err);
  if (global.log) global.log(`CRITICAL ERROR: ${err.message}\n${err.stack}`, 'ERROR');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL ERROR (Unhandled Rejection):', reason);
  if (global.log) global.log(`CRITICAL ERROR (Unhandled Rejection): ${reason}`, 'ERROR');
});

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static video files
// Use env var or default to 'videos' dir
const VIDEOS_DIR = process.env.VIDEO_PATH || path.join(__dirname, 'videos');
console.log('VIDEOS_DIR:', VIDEOS_DIR); // Debug log

if (!fs.existsSync(VIDEOS_DIR)) {
  // Only try to create if it is NOT an absolute path or likely a system path
  if (!process.env.VIDEO_PATH) {
    fs.mkdirSync(VIDEOS_DIR);
  }
}

app.use('/videos', express.static(VIDEOS_DIR));

// Thumbnail cache directory
const THUMBNAILS_DIR = path.join(__dirname, 'thumbnails');
if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR);
}
app.use('/thumbnails', express.static(THUMBNAILS_DIR));

// Logs directory
const LOGS_DIR = path.join(__dirname, 'Logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR);
}

// Serve Frontend Build (for production)
const CLIENT_BUILD_DIR = path.join(__dirname, 'client/dist');
if (fs.existsSync(CLIENT_BUILD_DIR)) {
  app.use(express.static(CLIENT_BUILD_DIR));
}

// Logger helper
const log = (message, type = 'INFO') => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
  const logFile = path.join(LOGS_DIR, `${dateStr}.log`);
  const logEntry = `[${timeStr}] [${type}] ${message}\n`;

  // Write to file
  try {
    fs.appendFileSync(logFile, logEntry);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }

  // Write to console
  if (type === 'ERROR') {
    console.error(`[${type}] ${message}`);
  } else {
    console.log(`[${type}] ${message}`);
  }
};

// Make log globally available for error handlers
global.log = log;

// Configure multer for thumbnail uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, THUMBNAILS_DIR);
  },
  filename: function (req, file, cb) {
    // Save as [videoName].jpg
    const videoName = req.params.videoName;
    cb(null, `${videoName}.jpg`);
  }
});

const upload = multer({ storage: storage });

// Upload thumbnail endpoint
app.post('/api/thumbnails/:videoName', upload.single('thumbnail'), (req, res) => {
  try {
    if (!req.file) {
      log('No file uploaded for thumbnail update', 'WARN');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the new thumbnail URL
    const videoName = req.params.videoName;
    log(`Thumbnail updated for: ${videoName}`, 'INFO');
    res.json({
      success: true,
      thumbnail: `/thumbnails/${videoName}.jpg?t=${Date.now()}` // Add timestamp to bust cache
    });
  } catch (error) {
    log(`Error uploading thumbnail: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'Failed to upload thumbnail' });
  }
});

// Metadata Cache
const METADATA_CACHE_FILE = path.join(__dirname, 'metadata_cache.json');
let metadataCache = {};

// Load cache on startup
try {
  if (fs.existsSync(METADATA_CACHE_FILE)) {
    metadataCache = JSON.parse(fs.readFileSync(METADATA_CACHE_FILE, 'utf8'));
    log(`Loaded metadata cache with ${Object.keys(metadataCache).length} entries`, 'INFO');
  }
} catch (err) {
  log(`Failed to load metadata cache: ${err.message}`, 'ERROR');
}

const saveMetadataCache = () => {
  try {
    fs.writeFileSync(METADATA_CACHE_FILE, JSON.stringify(metadataCache, null, 2));
  } catch (err) {
    log(`Failed to save metadata cache: ${err.message}`, 'ERROR');
  }
};

// Helper to get video metadata
const extractVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return resolve({}); // Return empty if fails

      const stream = metadata.streams.find(s => s.codec_type === 'video');
      const format = metadata.format;

      resolve({
        duration: format.duration,
        width: stream ? stream.width : null,
        height: stream ? stream.height : null,
        fps: stream ? eval(stream.r_frame_rate) : null
      });
    });
  });
};

const getVideoMetadata = async (filePath, stats) => {
  const fileKey = `${filePath}_${stats.mtime.getTime()}_${stats.size}`;

  if (metadataCache[fileKey]) {
    return metadataCache[fileKey];
  }

  const meta = await extractVideoMetadata(filePath);
  if (meta.duration) { // Only cache if we got valid data
    metadataCache[fileKey] = meta;
    saveMetadataCache(); // Save on every update or debounce it
  }
  return meta;
};

// Thumbnail Generation Queue
const thumbnailQueue = [];
let isProcessingThumbnails = false;

const processThumbnailQueue = async () => {
  if (isProcessingThumbnails || thumbnailQueue.length === 0) return;

  isProcessingThumbnails = true;
  const task = thumbnailQueue.shift();
  const { filePath, thumbnailPath, videoName } = task;

  try {
    log(`Generating thumbnail for: ${videoName}`, 'INFO');
    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .screenshots({
          timestamps: ['00:01'], // 1st Second per requirement
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '320x?'
        })
        .on('end', resolve)
        .on('error', reject);
    });
    log(`Generated thumbnail for: ${videoName}`, 'SUCCESS');
  } catch (err) {
    log(`Error generating thumbnail for ${videoName}: ${err.message}`, 'ERROR');
  } finally {
    isProcessingThumbnails = false;
    processThumbnailQueue();
  }
};

const queueThumbnailGeneration = (filePath, thumbnailPath, videoName) => {
  // Check if already in queue to avoid duplicates
  if (thumbnailQueue.find(t => t.thumbnailPath === thumbnailPath)) return;

  thumbnailQueue.push({ filePath, thumbnailPath, videoName });
  processThumbnailQueue();
};

const generatingPreviews = new Set();
const previewQueue = [];
let isProcessingQueue = false;

const processQueue = async () => {
  if (isProcessingQueue || previewQueue.length === 0) return;

  isProcessingQueue = true;
  const task = previewQueue.shift();
  const fileName = path.basename(task.filePath);

  log(`Processing preview queue: ${fileName} (Remaining: ${previewQueue.length})`, 'INFO');

  try {
    await generatePreviewTask(task.filePath, task.previewPath, task.duration);
    log(`Successfully generated preview for: ${fileName}`, 'SUCCESS');
  } catch (error) {
    log(`Error processing preview for ${fileName}: ${error.message}`, 'ERROR');
  } finally {
    generatingPreviews.delete(task.previewPath);
    isProcessingQueue = false;
    processQueue(); // Process next item
  }
};

const generatePreviewTask = async (filePath, previewPath, duration) => {
  try {
    let clipCount = 9;
    let clipDuration = 2;

    // Adjust for shorter videos
    if (duration < 20) {
      clipCount = 5; // Take fewer clips
      clipDuration = 1; // Shorter clips
    }

    // Ensure we don't exceed video length
    if (clipCount * clipDuration > duration) {
      // Fallback for very short videos
      clipCount = 3;
      clipDuration = Math.floor(duration / 4);
      if (clipDuration < 1) clipDuration = 1;
    }

    const timestamps = [];

    for (let i = 1; i <= clipCount; i++) {
      // Distribute clips evenly
      const step = duration / (clipCount + 1);
      const start = step * i;
      timestamps.push(Math.max(0, start));
    }

    // Construct complex filter
    let filterComplex = [];
    let inputs = [];

    timestamps.forEach((start, i) => {
      filterComplex.push(`[0:v]trim=start=${start}:duration=${clipDuration},setpts=PTS-STARTPTS,scale=320:-2[v${i}]`);
      inputs.push(`[v${i}]`);
    });

    filterComplex.push(`${inputs.join('')}concat=n=${clipCount}:v=1:a=0[outv]`);

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .complexFilter(filterComplex)
        .outputOptions(['-map [outv]', '-an']) // No audio
        .output(previewPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  } catch (err) {
    throw err;
  }
};

const addToPreviewQueue = (filePath, previewPath, duration) => {
  if (generatingPreviews.has(previewPath)) return;

  generatingPreviews.add(previewPath);
  previewQueue.push({ filePath, previewPath, duration });
  log(`Added to preview queue: ${path.basename(filePath)}`, 'INFO');
  processQueue();
};

// MP4 Preview Directory
// Resolve to absolute path to avoid issues with res.sendFile
const rawMp4Path = process.env.MP4_PATH || path.join(__dirname, 'mp4');
const MP4_DIR = path.resolve(rawMp4Path);

if (!fs.existsSync(MP4_DIR)) {
  // Optional, don't crash if missing, simple warn or ensure exists if you want to write to it
  log(`MP4 directory not found at ${MP4_DIR} - Pre-generated previews disabled`, 'WARN');
} else {
  console.log('MP4_DIR:', MP4_DIR);
}

// Stream Video Endpoint (Transcoding or Direct Stream)
app.get('/api/stream', (req, res) => {
  const videoFile = req.query.file;
  if (!videoFile) {
    return res.status(400).send('Missing file parameter');
  }

  // Prevent path traversal
  const resolvedPath = path.resolve(VIDEOS_DIR, videoFile);
  if (!resolvedPath.startsWith(path.resolve(VIDEOS_DIR))) {
    return res.status(403).send('Access denied');
  }

  if (!fs.existsSync(resolvedPath)) {
    return res.status(404).send('File not found');
  }

  // Check if this is a download request
  const isDownload = req.query.download === 'true';
  const isOriginal = req.query.type === 'original';

  if (isOriginal) {
    log(`Downloading original file: ${videoFile}`, 'INFO');
    if (isDownload) {
      res.download(resolvedPath);
    } else {
      res.sendFile(resolvedPath);
    }
    return;
  }

  // Check for pre-generated MP4
  if (fs.existsSync(MP4_DIR)) {
    const videoBasename = path.basename(videoFile, path.extname(videoFile));

    // Try exact match with .mp4
    let mp4Path = path.join(MP4_DIR, `${videoBasename}.mp4`);

    // Attempt fallback for "_1.mp4" if exact match missing (as seen in some file examples)
    if (!fs.existsSync(mp4Path)) {
      mp4Path = path.join(MP4_DIR, `${videoBasename}_1.mp4`);
    }

    if (fs.existsSync(mp4Path)) {
      log(`Serving pre-generated MP4 for: ${videoFile} (Download: ${isDownload})`, 'INFO');
      if (isDownload) {
        res.download(mp4Path); // Use res.download to force download with correct headers
      } else {
        res.sendFile(mp4Path);
      }
      return;
    }
  }

  // Fallback to Transcoding
  log(`Starting transcode stream for: ${videoFile} (No pre-generated MP4 found)`, 'INFO');

  res.setHeader('Content-Type', 'video/mp4');
  if (isDownload) {
    // Force download filename for on-the-fly transcoding
    const downloadName = path.basename(videoFile, path.extname(videoFile)) + '.mp4';
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  }

  // Transcode to browser-compatible format (h264 + aac)
  // preset ultrafast for lower latency
  // Scale to 720p to reduce CPU load on Synology NAS (Ryzen V1500B has no iGPU)
  ffmpeg(resolvedPath)
    .format('mp4')
    .videoCodec('libx264')
    .audioCodec('aac')
    .outputOptions([
      '-movflags frag_keyframe+empty_moov', // Fragmented MP4 for streaming
      '-preset ultrafast',                  // Low latency
      '-crf 28',                            // Slightly higher CRF for lower bitrate/CPU usage
      '-pix_fmt yuv420p',                   // Ensure wide compatibility
      '-vf scale=-2:720'                    // Downscale to 720p (preserve aspect ratio)
    ])
    .on('error', (err) => {
      // It's normal for streaming to be cut off if client disconnects
      if (err.message !== 'Output stream closed') {
        log(`Streaming error for ${videoFile}: ${err.message}`, 'ERROR');
      }
    })
    .pipe(res, { end: true });
});

// Get list of videos
app.get('/api/videos', async (req, res) => {
  log('Received request for video list', 'INFO');
  try {
    // Recursive glob to find videos in subdirectories
    const videoFiles = await glob('**/*.{mp4,webm,mov,mkv}', { cwd: VIDEOS_DIR });
    log(`Found ${videoFiles.length} videos in ${VIDEOS_DIR}`, 'INFO');

    // Process in batches to limit concurrency
    const BATCH_SIZE = 5;
    const videos = [];

    for (let i = 0; i < videoFiles.length; i += BATCH_SIZE) {
      const batch = videoFiles.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(async (file) => {
        const filePath = path.join(VIDEOS_DIR, file);

        try {
          const stats = fs.statSync(filePath);

          // Flatten filename for thumbnail/preview storage
          // e.g. "subdir/video.mp4" -> "subdir__video.mp4"
          const safeFileName = file.split(path.sep).join('__');

          const thumbnailPath = path.join(THUMBNAILS_DIR, `${safeFileName}.jpg`);
          const previewPath = path.join(THUMBNAILS_DIR, `${safeFileName}_preview_9.mp4`);

          // Safe URL encoding for the video file path (for stream query param)
          // We can't just use file directly in URL path if we use query param
          const streamUrl = `/api/stream?file=${encodeURIComponent(file)}`;

          const thumbnailRelPath = `/thumbnails/${encodeURIComponent(safeFileName)}.jpg`;
          const previewRelPath = `/thumbnails/${encodeURIComponent(safeFileName)}_preview_9.mp4`;

          // Get metadata (Cached)
          const meta = await getVideoMetadata(filePath, stats);

          // Background Thumbnail Generation
          let hasThumbnail = fs.existsSync(thumbnailPath);
          let thumbnailWithTimestamp = null;

          if (hasThumbnail) {
            try {
              const tStats = fs.statSync(thumbnailPath);
              thumbnailWithTimestamp = `${thumbnailRelPath}?t=${tStats.mtimeMs}`;
            } catch (e) {
              thumbnailWithTimestamp = thumbnailRelPath;
            }
          } else {
            queueThumbnailGeneration(filePath, thumbnailPath, file);
          }

          // Background Preview Generation logic
          let hasPreview = fs.existsSync(previewPath);

          // Lower threshold to 5 seconds to support shorter clips like "15sn"
          if (!hasPreview && meta.duration > 5) {
            // Pass the duration so we can dynamically adjust clip count/length if needed
            addToPreviewQueue(filePath, previewPath, meta.duration);
          }

          return {
            name: file, // Keep original path structure for display if desired, or use path.basename(file)
            url: streamUrl, // Use streaming endpoint instead of static file
            thumbnail: thumbnailWithTimestamp,
            preview: hasPreview ? previewRelPath : null,
            size: stats.size,
            date: stats.mtime,
            duration: meta.duration || 0,
            resolution: meta.width && meta.height ? `${meta.width}x${meta.height}` : 'Unknown',
            width: meta.width,
            height: meta.height
          };
        } catch (err) {
          log(`Error processing file ${file}: ${err.message}`, 'ERROR');
          return null;
        }
      }));

      videos.push(...batchResults.filter(v => v !== null));
    }

    res.json(videos);
  } catch (error) {
    log(`Error listing videos: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'Failed to list videos' });
  }
});

// START SERVER
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  log(`Server started on port ${PORT}`, 'INFO');
});
