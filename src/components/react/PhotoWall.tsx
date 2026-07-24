import * as React from 'react';
import { createPortal } from 'react-dom';
import Zmage from 'react-zmage';
import 'react-zmage/style.css';

export interface MediaItem {
  src: string;
  name: string;
  type: 'image' | 'video' | 'livephoto';
  videoSrc?: string;
}

interface PhotoWallProps {
  items: MediaItem[];
}

const BATCH_SIZE = 12;

// Lazy media item: only loads content when scrolled near viewport
const LazyMediaItem: React.FC<{ item: MediaItem; index: number; onVideoClick: (src: string) => void }> = ({ item, index, onVideoClick }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      key={item.src}
      className="media-item"
      style={{ animationDelay: `${Math.min(index * 40, 800)}ms` }}
    >
      {visible ? (
        <>
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
            <div className="video-wrapper" onClick={() => onVideoClick(item.src)}>
              <video
                src={`${item.src}#t=0.1`}
                preload="metadata"
                className="media-video"
                muted
                playsInline
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
        </>
      ) : (
        <div className="media-placeholder" />
      )}
    </div>
  );
};

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

const LivePhotoView: React.FC<{ photoSrc: string; videoSrc: string; name: string }> = ({ photoSrc, videoSrc }) => {
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

      if (playerRef.current) {
        playerRef.current.destroy?.();
      }

      const LPK = (window as any).LivePhotosKit;
      const player = LPK.Player.create({ photoSrc, videoSrc });
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
  const [renderCount, setRenderCount] = React.useState(BATCH_SIZE);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Lock body scroll when video lightbox is open
  React.useEffect(() => {
    if (videoSrc) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [videoSrc]);

  // Infinite scroll: load more when sentinel enters viewport
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && renderCount < items.length) {
          setRenderCount((prev) => Math.min(prev + BATCH_SIZE, items.length));
        }
      },
      { rootMargin: '500px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [renderCount, items.length]);

  const visibleItems = items.slice(0, renderCount);

  return (
    <>
      <div className="masonry-gallery">
        {visibleItems.map((item, index) => (
          <LazyMediaItem key={item.src} item={item} index={index} onVideoClick={setVideoSrc} />
        ))}
      </div>

      {renderCount < items.length && (
        <div ref={sentinelRef} className="loading-sentinel">
          <div className="loading-spinner" />
          <span>加载更多...</span>
        </div>
      )}

      {/* Video Lightbox - portal to body to escape any transform ancestors */}
      {videoSrc && createPortal(
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
        </div>,
        document.body
      )}
    </>
  );
};

export default PhotoWall;
