import * as React from 'react';
import Zmage from 'react-zmage';
import 'react-zmage/style.css';

export interface MediaItem {
  src: string;
  name: string;
  type: 'image' | 'video';
}

interface PhotoWallProps {
  items: MediaItem[];
}

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
            {item.type === 'image' ? (
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
            ) : (
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
