
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
  captureFrameCallback: (frameIndex: number) => Promise<void>
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

    const width = canvas.width;
    const height = canvas.height;

    // 3. Initialize GIF.js
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width,
      height,
      workerScript: localWorkerUrl,
      transparent: null,
      background: '#0a0a0a'
    });

    // 4. Animation parameters (match shader-based timing)
    const fps = 15;
    const durationSeconds = 2;
    const totalFrames = fps * durationSeconds;

    // 5. Capture frames sequentially
    const captureFrames = async () => {
      try {
        for (let i = 0; i < totalFrames; i++) {
          // Tell WebGL component to render frame at specific time
          await captureFrameCallback(i);

          // Wait for render to complete
          await new Promise(resolve => requestAnimationFrame(resolve));

          // Capture current canvas state directly
          // No additional effects - shader handles everything
          gif.addFrame(canvas, {
            copy: true,
            delay: 1000 / fps
          });
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
