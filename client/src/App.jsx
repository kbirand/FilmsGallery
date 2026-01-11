import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutGrid,
  Image as ImageIcon,
  Film,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Check,
  ArrowUpDown,
  Upload,
  ImagePlus,
  Play,
  Download,
  RefreshCw
} from 'lucide-react';


const UploadModal = ({ isOpen, onClose, onConfirm, video }) => {
  const [mode, setMode] = useState('upload'); // 'upload' | 'frame'
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setMode('upload');
    }
  }, [isOpen]);

  // Keyboard Scrubbing Logic
  useEffect(() => {
    if (!isOpen || mode !== 'frame') return;

    const handleKeyDown = (e) => {
      const video = videoRef.current;
      if (!video) return;

      const FRAME_STEP = 0.04; // Approx 1 frame at 25fps
      const LARGE_STEP = 1.0;  // 1 Second

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - (e.shiftKey ? LARGE_STEP : FRAME_STEP));
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + (e.shiftKey ? LARGE_STEP : FRAME_STEP));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setMode('upload'); // Ensure we are in render preview mode
    }
  };

  const captureFrame = () => {
    const videoEl = videoRef.current;
    if (videoEl) {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "captured_frame.jpg", { type: "image/jpeg" });
          handleFile(file);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onConfirm(selectedFile);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-medium text-white mb-4">Change Cover Image</h3>
        <p className="text-sm text-zinc-400 mb-6">
          Update cover image for <span className="text-white font-medium">{video?.name}</span>
        </p>

        {/* Tabs */}
        {!previewUrl && (
          <div className="flex space-x-4 mb-6 border-b border-zinc-800 pb-2">
            <button
              onClick={() => setMode('upload')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${mode === 'upload' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
            >
              Upload Image
            </button>
            <button
              onClick={() => setMode('frame')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${mode === 'frame' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
            >
              Select from Video
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="min-h-[300px] flex flex-col justify-center">
          {previewUrl ? (
            // Preview State
            <div className="relative group mx-auto">
              <div className="aspect-video w-full max-w-lg bg-zinc-800 rounded-lg overflow-hidden relative border border-zinc-700">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div key="actions" className="flex justify-center mt-4 space-x-4">
                <button
                  onClick={() => { setPreviewUrl(null); setSelectedFile(null); }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors text-sm"
                >
                  Discard
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-md transition-colors text-sm font-medium flex items-center space-x-2"
                >
                  <Check size={16} />
                  <span>Confirm Save</span>
                </button>
              </div>
            </div>
          ) : mode === 'upload' ? (
            // Upload State
            <div
              className={`
                border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
                ${dragActive ? 'border-primary bg-primary/10' : 'border-zinc-700 hover:border-zinc-600'}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus size={48} className="mx-auto text-zinc-500 mb-4" />
              <p className="text-sm text-zinc-300 font-medium mb-1">
                Click or drag image here
              </p>
              <p className="text-xs text-zinc-500">
                Supports JPG, PNG, WEBP
              </p>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleChange}
              />
            </div>
          ) : (
            // Frame Capture State
            <div className="space-y-4">
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center">
                {video ? (
                  <video
                    ref={videoRef}
                    src={video.url} // Use direct stream URL (without download=true) for playback
                    crossOrigin="anonymous"
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-zinc-500">Video source not available</div>
                )}
              </div>
              <div className="flex justify-center">
                <button
                  onClick={captureFrame}
                  className="px-6 py-2 bg-white text-black hover:bg-zinc-200 rounded-full font-medium transition-colors flex items-center space-x-2"
                >
                  <ImageIcon size={16} />
                  <span>Capture This Frame</span>
                </button>
              </div>
              <p className="text-center text-xs text-zinc-500">
                Pause the video at the desired frame and click Capture
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VideoModal = ({ video, onClose, onNext, onPrev, hasNext, hasPrev, onChangeCover }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <div className="w-full h-full flex overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col relative bg-black">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-20 p-2 rounded-full bg-black/50 hover:bg-zinc-800 text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Navigation Arrows */}
          {hasPrev && (
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-all group border border-white/10"
            >
              <ChevronLeft size={28} className="text-white/70 group-hover:text-white" />
            </button>
          )}

          {hasNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-all group border border-white/10"
            >
              <ChevronRight size={28} className="text-white/70 group-hover:text-white" />
            </button>
          )}

          {/* Video Player */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black">
            <div className="w-full h-full flex items-center justify-center">
              <video
                key={video.url} // Force reload when video changes
                src={video.url}
                controls
                autoPlay
                className="max-w-full max-h-full w-auto h-auto object-contain outline-none"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          {/* Bottom Controls Bar (Mockup for visual consistency with design) */}
          <div className="h-16 px-8 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
            {/* This area is usually handled by the native video controls, but we can add custom overlays if needed */}
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="w-96 bg-zinc-900/95 border-l border-zinc-800 flex flex-col h-full overflow-y-auto backdrop-blur-md">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900/95 z-10">
            <div className="flex items-center space-x-2 text-zinc-400">
              <Film size={16} />
              <span className="text-sm font-medium">Video Details</span>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Created Date */}
            <div className="text-xs text-zinc-500">
              Created {new Date(video.date).toLocaleString()}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`${video.url}&download=true&type=original`}
                  download
                  className="w-full py-2 px-2 rounded-md border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-medium flex items-center justify-center space-x-2 transition-colors"
                >
                  <Download size={14} />
                  <span>Original</span>
                </a>
                <a
                  href={`${video.url}&download=true`}
                  download
                  className="w-full py-2 px-2 rounded-md border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs font-medium flex items-center justify-center space-x-2 transition-colors"
                >
                  <Download size={14} />
                  <span>MP4</span>
                </a>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center space-x-1">
                <Settings size={10} />
                <span>Name</span>
              </label>
              <div className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-md text-xs text-zinc-400 italic min-h-[50px] leading-relaxed">
                {video.name}
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center space-x-1">
                  <ImageIcon size={10} />
                  <span>Cover Image</span>
                </label>
                <button
                  onClick={() => onChangeCover(video)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
                >
                  <RefreshCw size={10} />
                  <span>Change</span>
                </button>
              </div>
              <div className="w-full aspect-video bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 relative group cursor-pointer">
                {video.thumbnail && <img src={video.thumbnail} alt="Cover" className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize size={14} className="text-white" />
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center space-x-1">
                <Settings size={10} />
                <span>Configuration</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-md">
                  <div className="text-[10px] text-zinc-500 mb-1">Resolution</div>
                  <div className="text-xs text-zinc-300 font-medium">{video.resolution || "Unknown"}</div>
                </div>
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-md">
                  <div className="text-[10px] text-zinc-500 mb-1">Aspect Ratio</div>
                  <div className="text-xs text-zinc-300 font-medium">16:9</div>
                </div>
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-md">
                  <div className="text-[10px] text-zinc-500 mb-1">Duration</div>
                  <div className="text-xs text-red-400 font-medium">{video.duration ? `${Math.round(video.duration)}s` : "--"}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const ManagerModal = ({ isOpen, onClose }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState({}); // { filename: true }

  useEffect(() => {
    if (isOpen) fetchStatus();
  }, [isOpen]);

  const fetchStatus = () => {
    setLoading(true);
    fetch('/api/manager/status')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const generateAsset = (videoName, type) => {
    setGenerating(prev => ({ ...prev, [videoName]: true }));
    fetch('/api/manager/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoName, type })
    })
      .then(res => res.json())
      .then(res => {
        if (!res.success) alert('Failed: ' + res.error);
      })
      .catch(console.error);
    // Note: Generation is async, so we don't clear 'generating' immediately 
    // or we could use polling/ws for real progress. For now, just show triggered state.
    setTimeout(() => {
      setGenerating(prev => {
        const next = { ...prev };
        delete next[videoName];
        return next;
      });
      fetchStatus(); // Refresh list to see if stats changed (though generation takes time)
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-4xl h-[80vh] flex flex-col relative">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-medium text-white flex items-center space-x-2">
            <Settings size={20} />
            <span>Media Manager</span>
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8 text-zinc-500">Scanning Library...</div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <Check size={48} className="mb-4 text-green-500" />
              <p>All assets are in sync!</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="pb-2 font-medium">Video File</th>
                  <th className="pb-2 font-medium text-center">Thumbnail (JPG)</th>
                  <th className="pb-2 font-medium text-center">Preview (MP4)</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {data.map((item) => (
                  <tr key={item.name} className="group hover:bg-zinc-900/50">
                    <td className="py-3 pr-4 text-zinc-300 font-mono text-xs">{item.name}</td>

                    <td className="py-3 text-center">
                      {item.hasThumbnail ? (
                        <span className="inline-flex items-center text-green-500 bg-green-500/10 px-2 py-0.5 rounded text-[10px] font-bold">OK</span>
                      ) : (
                        <span className="inline-flex items-center text-red-500 bg-red-500/10 px-2 py-0.5 rounded text-[10px] font-bold">MISSING</span>
                      )}
                    </td>

                    <td className="py-3 text-center">
                      {item.hasMp4 ? (
                        <span className="inline-flex items-center text-green-500 bg-green-500/10 px-2 py-0.5 rounded text-[10px] font-bold">OK</span>
                      ) : (
                        <span className="inline-flex items-center text-red-500 bg-red-500/10 px-2 py-0.5 rounded text-[10px] font-bold">MISSING</span>
                      )}
                    </td>

                    <td className="py-3 text-right space-x-2">
                      {!item.hasMp4 && (
                        <button
                          onClick={() => generateAsset(item.name, 'mp4')}
                          disabled={generating[item.name]}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded text-xs transition-colors"
                        >
                          {generating[item.name] ? 'Queued...' : 'Generate MP4'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const getResolutionLabel = (resString) => {
  if (!resString || resString === 'Unknown') return 'HD';
  const width = parseInt(resString.split('x')[0]);
  if (width >= 7680) return '8K';
  if (width >= 3840) return '4K';
  if (width >= 2560) return '2K';
  return 'HD';
};

function App() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [videoToUpdate, setVideoToUpdate] = useState(null);
  const [thumbnailSize, setThumbnailSize] = useState(300);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [hoveredVideo, setHoveredVideo] = useState(null);

  const refreshVideos = () => {
    setLoading(true);
    fetch('/api/videos')
      .then(res => res.json())
      .then(data => {
        setVideos(data);
        if (selectedVideo) {
          const updated = data.find(v => v.name === selectedVideo.name);
          if (updated) setSelectedVideo(updated);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch videos", err);
        setLoading(false);
      });
  };

  // Initial load
  useEffect(() => {
    refreshVideos();
  }, []);

  const handleCoverUpload = async (file) => {
    if (!videoToUpdate) return;

    const formData = new FormData();
    formData.append('thumbnail', file);

    try {
      const res = await fetch(`/api/thumbnails/${encodeURIComponent(videoToUpdate.name)}`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setShowUploadModal(false);
        setVideoToUpdate(null);
        refreshVideos();
      } else {
        console.error('Failed to upload thumbnail');
      }
    } catch (err) {
      console.error('Error uploading thumbnail:', err);
    }
  };

  const filteredVideos = videos
    .filter(video => video.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      return sortOrder === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });

  const handleNext = () => {
    if (!selectedVideo) return;
    const currentIndex = filteredVideos.findIndex(v => v.name === selectedVideo.name);
    if (currentIndex < filteredVideos.length - 1) {
      setSelectedVideo(filteredVideos[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (!selectedVideo) return;
    const currentIndex = filteredVideos.findIndex(v => v.name === selectedVideo.name);
    if (currentIndex > 0) {
      setSelectedVideo(filteredVideos[currentIndex - 1]);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white selection:bg-white selection:text-black">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #000;
        }
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>

      <ManagerModal isOpen={showManagerModal} onClose={() => setShowManagerModal(false)} />

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        video={videoToUpdate}
        onClose={() => { setShowUploadModal(false); setVideoToUpdate(null); }}
        onConfirm={handleCoverUpload}
      />

      {/* Video Modal */}
      <VideoModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={selectedVideo && filteredVideos.findIndex(v => v.name === selectedVideo.name) < filteredVideos.length - 1}
        hasPrev={selectedVideo && filteredVideos.findIndex(v => v.name === selectedVideo.name) > 0}
        onChangeCover={(video) => { setVideoToUpdate(video); setShowUploadModal(true); }}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${selectedVideo ? 'mr-[400px]' : ''}`}>
        {/* Header */}
        <div className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            <Film className="text-white" size={24} />
            <h1 className="text-xl font-bold tracking-tight">Koray Birand Film Archive</h1>
            <div className="h-4 w-px bg-zinc-800 mx-2"></div>
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Local Library</span>
          </div>

          <div className="flex items-center">
            <div className="relative group mr-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={16} />
              <input
                type="text"
                placeholder="Filter videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-sm text-white rounded-full py-1.5 pl-10 pr-4 w-64 focus:outline-none focus:border-zinc-600 focus:w-80 transition-all"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setShowManagerModal(true)}
                className="px-4 py-2 text-xs font-medium rounded-md bg-zinc-800 text-white hover:bg-zinc-700 flex items-center space-x-2 transition-colors border border-zinc-700"
              >
                <Settings size={14} />
                <span>Manager</span>
              </button>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 text-xs font-medium rounded-md bg-zinc-800 text-white hover:bg-zinc-700 flex items-center space-x-2 transition-colors border border-zinc-700"
              >
                <ArrowUpDown size={14} />
                <span>{sortOrder === 'asc' ? 'Sort A-Z' : 'Sort Z-A'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-6 ml-4">
            <div className="flex items-center space-x-4">
              <button className="text-zinc-400 hover:text-white">
                <div className="w-5 h-5 border-2 border-zinc-500 rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-zinc-500 rounded-full"></div>
                </div>
              </button>
              <button className="text-zinc-400 hover:text-white">
                <LayoutGrid size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-zinc-500">
              Showing {filteredVideos.length} videos
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-zinc-600 uppercase tracking-wider font-bold">Thumbnail Size</div>
              <div className="flex items-center w-32 px-2">
                <input
                  type="range"
                  min="200"
                  max="600"
                  value={thumbnailSize}
                  onChange={(e) => setThumbnailSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-full text-zinc-500">Loading library...</div>
          ) : (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize}px, 1fr))` }}
            >
              {filteredVideos.map((video, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedVideo(video)}
                  onMouseEnter={() => setHoveredVideo(video.name)}
                  onMouseLeave={() => setHoveredVideo(null)}
                  className={`
                    group relative aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 
                    cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-zinc-500 hover:shadow-2xl hover:shadow-black/50
                    ${selectedVideo?.name === video.name ? 'ring-2 ring-white border-transparent' : ''}
                  `}
                >
                  {/* Video Preview or Cover */}
                  {hoveredVideo === video.name && video.preview ? (
                    <video
                      src={video.preview}
                      autoPlay
                      muted
                      loop
                      className="w-full h-full object-cover"
                    />
                  ) : video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.name}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                      <Film className="text-zinc-700" size={32} />
                    </div>
                  )}

                  {/* Duration Badge */}
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-medium text-white shadow-sm backdrop-blur-sm">
                    {video.duration ? new Date(video.duration * 1000).toISOString().substr(11, 8).replace(/^00:/, '') : '--:--'}
                  </div>

                  {/* Resolution Badge */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[10px] font-bold text-zinc-300 uppercase tracking-wider backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    {getResolutionLabel(video.resolution)}
                  </div>

                  {/* Title Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end">
                    <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight drop-shadow-md">
                      {video.name}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-zinc-400">
                        {(video.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                      <Play size={12} className="text-white fill-current" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
