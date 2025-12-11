
import { ExportSettings } from '../types';

declare class GIF {
  constructor(options: any);
  addFrame(element: any, options?: any): void;
  on(event: string, callback: (blob: Blob) => void): void;
  render(): void;
}

/**
 * Generate animated GIF from WebGL canvas
 * Uses shader-based animations only (no additional effects)
 */
export const generateWebGLGif = async (
  canvasId: string,
  filename: string,
  captureFrameCallback: (frameIndex: number) => Promise<void>,
  exportSettings: ExportSettings
): Promise<void> => {
  // 1. Load GIF.js worker (same CORS fix as before)
  const workerScriptUrl = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js';
  let localWorkerUrl: string;

  try {
    const response = await fetch(workerScriptUrl);
    if (!response.ok) throw new Error("Failed to load GIF worker script");
    const blob = await response.blob();
    localWorkerUrl = URL.createObjectURL(blob);
  } catch (e) {
    console.error("Worker load failed:", e);
    throw new Error("Could not initialize GIF engine (CORS/Network error)");
  }

  return new Promise((resolve, reject) => {
    // 2. Get WebGL canvas element
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      URL.revokeObjectURL(localWorkerUrl);
      reject(new Error("Canvas element not found"));
      return;
    }

    if (!(canvas instanceof HTMLCanvasElement)) {
      URL.revokeObjectURL(localWorkerUrl);
      reject(new Error("Element is not a canvas"));
      return;
    }

    // Calculate scaled dimensions
    const sourceWidth = canvas.width;
    const sourceHeight = canvas.height;
    const targetWidth = Math.round(sourceWidth * exportSettings.scale);
    const targetHeight = Math.round(sourceHeight * exportSettings.scale);

    // Create temporary canvas for downsampling if needed
    let frameCanvas: HTMLCanvasElement;
    let frameCtx: CanvasRenderingContext2D | null;

    if (exportSettings.scale < 1.0) {
      frameCanvas = document.createElement('canvas');
      frameCanvas.width = targetWidth;
      frameCanvas.height = targetHeight;
      frameCtx = frameCanvas.getContext('2d');
    } else {
      frameCanvas = canvas;
      frameCtx = null;
    }

    // 3. Initialize GIF.js
    const gif = new GIF({
      workers: 2,
      quality: 20, // Balanced compression (1=best quality/largest, 30=lowest quality/smallest)
      width: targetWidth,
      height: targetHeight,
      workerScript: localWorkerUrl,
      transparent: null,
      background: '#0a0a0a'
    });

    // 4. Animation parameters from exportSettings
    const fps = exportSettings.fps;
    const durationSeconds = exportSettings.duration;
    const totalFrames = fps * durationSeconds;

    // 5. Capture frames sequentially
    const captureFrames = async () => {
      try {
        for (let i = 0; i < totalFrames; i++) {
          // Tell WebGL component to render frame at specific time
          await captureFrameCallback(i);

          // Wait for render to complete
          await new Promise(resolve => requestAnimationFrame(resolve));

          // Downsample if needed
          if (frameCtx && exportSettings.scale < 1.0) {
            frameCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
            gif.addFrame(frameCanvas, {
              copy: true,
              delay: 1000 / fps
            });
          } else {
            // Capture current canvas state directly
            gif.addFrame(canvas, {
              copy: true,
              delay: 1000 / fps
            });
          }
        }

        // 6. Encode and download
        gif.on('finished', (blob: Blob) => {
          const gifUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = gifUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Cleanup
          URL.revokeObjectURL(gifUrl);
          URL.revokeObjectURL(localWorkerUrl);
          resolve();
        });

        gif.render();
      } catch (error) {
        URL.revokeObjectURL(localWorkerUrl);
        reject(error);
      }
    };

    captureFrames();
  });
};
