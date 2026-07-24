import * as React from 'react';
import Zmage from 'react-zmage';
import 'react-zmage/style.css';

export interface MediaItem {
  src: string;
  name: string;
  type: 'image' | 'video' | 'livephoto';
  videoSrc?: string; // For livephoto: paired MOV/MP4
}

interface PhotoWallProps {
  items: MediaItem[];
}

// Load LivePhotosKit script once
let livephotoskitLoaded = false;
function loadLivePhotosKit() {
  if (livephotoskitLoaded) return;
  if ((window as any).LivePhotosKit) {
    livephotoskitLoaded = true;
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdn.apple.com/livephotoskit/livephotoskit/1.5.6/LivePhotosKit.js';
  script.async = true;
  document.head.appendChild(script);
  livephotoskitLoaded = true;
}

const LivePhotoView: React.FC<{ photoSrc: string; videoSrc: string; name: string }> = ({ photoSrc, videoSrc, name }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<any>(null);

  React.useEffect(() => {
    let mounted = true;

    function initPlayer() {
      if (!containerRef.current || !mounted) return;
      if (!(window as any).LivePhotosKit) {
        setTimeout(initPlayer, 200);
        return;
      }

      // Clear previous player
      if (playerRef.current) {
        playerRef.current.destroy?.();
      }

      const LPK = (window as any).LivePhotosKit;
      const player = LPK.Player.create({
        photoSrc,
        videoSrc,
      });
      player.style.width = '100%';
      player.style.height = '100%';
      player.style.display = 'block';
      player.style.cursor = 'pointer';

      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(player);
      playerRef.current = player;
    }

    loadLivePhotosKit();
    initPlayer();

    return () => {
      mounted = false;
      if (playerRef.current) {
        playerRef.current.destroy?.();
        playerRef.current = null;
      }
    };
  }, [photoSrc, videoSrc]);

  return (
    <div className="livephoto-wrapper">
      <div ref={containerRef} className="livephoto-container" />
      <div className="livephoto-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="9" opacity="0.4">
            <animate attributeName="r" values="9;10;9" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
        LIVE
      </div>
    </div>
  );
};

const PhotoWall: React.FC<PhotoWallProps> = ({ items }) => {
  const [videoSrc, setVideoSrc] = React.useState<string | null>(null);

  return (
    <>
      <div className="masonry-gallery">
        {items.map((item, index) => (
          <div
            key={item.src}
            className="media-item"
            style={{ animationDelay: `${Math.min(index * 40, 800)}ms` }}
          >
            {item.type === 'image' && (
              <Zmage
                src={item.src}
                alt={item.name}
                className="media-img"
                preset="auto"
                backdrop="rgba(0,0,0,0.92)"
                controller={{
                  close: true,
                  zoom: true,
                  download: false,
                  rotate: false,
                  flip: false,
                }}
              />
            )}
            {item.type === 'livephoto' && item.videoSrc && (
              <LivePhotoView photoSrc={item.src} videoSrc={item.videoSrc} name={item.name} />
            )}
            {item.type === 'video' && (
              <div
                className="video-wrapper"
                onClick={() => setVideoSrc(item.src)}
              >
                <video
                  src={item.src}
                  preload="metadata"
                  className="media-video"
                  muted
                />
                <div className="video-overlay">
                  <div className="play-btn">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Video Lightbox */}
      {videoSrc && (
        <div className="video-lightbox" onClick={() => setVideoSrc(null)}>
          <div className="video-lightbox-backdrop" />
          <button className="video-lightbox-close" aria-label="关闭">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <video
            src={videoSrc}
            controls
            autoPlay
            playsInline
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default PhotoWall;
