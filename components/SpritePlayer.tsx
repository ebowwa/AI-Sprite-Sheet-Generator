import React, { useState, useEffect, useRef } from 'react';

interface SpritePlayerProps {
  imageUrl: string;
  columns: number;
  frames: number;
  fps: number;
  isPlaying: boolean;
}

const SpritePlayer: React.FC<SpritePlayerProps> = ({
  imageUrl,
  columns,
  frames,
  fps,
  isPlaying,
}) => {
  const [spriteDimensions, setSpriteDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [frameDimensions, setFrameDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const playerRef = useRef<HTMLDivElement>(null);
  const currentFrame = useRef(0);

  // Effect to load the sprite sheet image and calculate the dimensions of the full sheet and a single frame.
  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.onload = () => {
      const rows = Math.ceil(frames / columns);
      setSpriteDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setFrameDimensions({
        width: img.naturalWidth / columns,
        height: img.naturalHeight / rows,
      });
      // Reset animation to the first frame
      currentFrame.current = 0; 
      if (playerRef.current) {
        // Set initial position for the sprite layer
        playerRef.current.style.backgroundPosition = '0px 0px';
      }
    };
    img.src = imageUrl;
  }, [imageUrl, columns, frames]);

  // Effect to run the animation loop.
  useEffect(() => {
    if (!isPlaying || !frameDimensions.width || !frameDimensions.height || fps <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      currentFrame.current = (currentFrame.current + 1) % frames;
      
      const frameX = currentFrame.current % columns;
      const frameY = Math.floor(currentFrame.current / columns);

      const x = -frameX * frameDimensions.width;
      const y = -frameY * frameDimensions.height;

      if (playerRef.current) {
        // Update position for the sprite layer
        playerRef.current.style.backgroundPosition = `${x}px ${y}px`;
      }
    }, 1000 / fps);

    return () => clearInterval(intervalId);
  }, [isPlaying, fps, frames, columns, frameDimensions]);

  // Determine a scaling factor to make the sprite preview larger while fitting in the container.
  // Using a fixed max size for simplicity.
  const maxPreviewSize = 256; 
  const scale = frameDimensions.width > 0 
    ? Math.max(1, Math.min(maxPreviewSize / frameDimensions.width, maxPreviewSize / frameDimensions.height))
    : 1;

  if (frameDimensions.width === 0) {
    return null; // Don't render until dimensions are known to avoid layout shifts
  }

  return (
    <div
      ref={playerRef}
      style={{
        width: `${frameDimensions.width}px`,
        height: `${frameDimensions.height}px`,
        backgroundImage: `url(${imageUrl})`,
        backgroundColor: '#1e1e1e', // Replaced checkerboard with solid surface color
        backgroundSize: `${spriteDimensions.width}px ${spriteDimensions.height}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated', // Keeps pixel art crisp
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        transition: 'transform 0.2s ease-in-out',
      }}
      aria-label="Animated sprite sheet preview"
      role="img"
    />
  );
};

export default SpritePlayer;
