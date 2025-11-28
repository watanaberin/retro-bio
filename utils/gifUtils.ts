
declare class GIF {
  constructor(options: any);
  addFrame(element: any, options?: any): void;
  on(event: string, callback: (blob: Blob) => void): void;
  render(): void;
}

export const generateGif = async (svgId: string, filename: string): Promise<void> => {
  // 1. Fix for CORS "Script Error": Load worker code into a local Blob
  // Web Workers often fail to load from cross-origin CDNs due to security policies.
  // We fetch the text content, create a local blob, and use that as the worker source.
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
    const svgElement = document.getElementById(svgId);
    if (!svgElement) {
      URL.revokeObjectURL(localWorkerUrl);
      reject(new Error("SVG element not found"));
      return;
    }

    // 2. Serialize SVG to String
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    // FIX 1: Ensure Namespaces exist
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+xmlns:xlink/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    // FIX 2: Ensure Explicit Dimensions (Vital for Image loading)
    let width = svgElement.clientWidth;
    let height = svgElement.clientHeight;
    const viewBox = svgElement.getAttribute('viewBox');

    if (viewBox) {
      const parts = viewBox.split(' ');
      if (parts.length === 4) {
        const vbWidth = parseFloat(parts[2]);
        const vbHeight = parseFloat(parts[3]);
        if (!width) width = vbWidth;
        if (!height) height = vbHeight;
      }
    }

    // Inject width/height if missing in the string tag
    if (!source.match(/<svg[^>]+width="/)) {
      source = source.replace(/<svg/, `<svg width="${width}" height="${height}"`);
    }

    // FIX 3: REMOVE External Font Imports to prevent taint/loading errors
    const fontStyle = `
      <style>
        text { 
          font-family: 'Courier New', 'Courier', monospace; 
          font-weight: bold; 
        }
      </style>
    `;

    if (source.includes('</defs>')) {
      source = source.replace('</defs>', `${fontStyle}</defs>`);
    } else {
      source = source.replace('>', `>${fontStyle}`);
    }

    // 3. Create Blob and Image
    const img = new Image();
    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // 4. Setup Canvas and GIF
      const canvas = document.createElement("canvas");
      // Use standard scale
      const scale = 1;

      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(localWorkerUrl);
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Initialize GIF.js with LOCAL worker URL
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: canvas.width,
        height: canvas.height,
        workerScript: localWorkerUrl, // <--- Key fix
        transparent: null,
        background: '#0a0a0a'
      });

      // 5. Animation Parameters
      const fps = 15;
      const durationSeconds = 2; // Loop duration
      const totalFrames = fps * durationSeconds;

      // CRT Effect Loop
      for (let i = 0; i < totalFrames; i++) {
        // Clear
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // -- Jitter Effect --
        const jitterX = (Math.random() > 0.8) ? (Math.random() - 0.5) * 2 : 0;

        // Draw Base Image
        ctx.drawImage(img, jitterX, 0, width, height);

        // -- Scanline Beam --
        const progress = (i / totalFrames);
        const scanY = progress * height;
        const beamHeight = height * 0.15;

        const gradient = ctx.createLinearGradient(0, scanY, 0, scanY + beamHeight);
        gradient.addColorStop(0, 'rgba(51, 255, 0, 0)');
        gradient.addColorStop(0.5, 'rgba(200, 255, 200, 0.15)');
        gradient.addColorStop(1, 'rgba(51, 255, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, scanY - (beamHeight / 2), width, beamHeight);

        // -- Global Flicker --
        const flicker = 0.96 + Math.random() * 0.04;
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - flicker})`;
        ctx.fillRect(0, 0, width, height);

        // -- Scanlines Overlay (Static) -- REMOVED to match preview consistency
        // The SVG already has scanlines, so adding them here creates a double-dark effect.

        // Add frame to GIF
        gif.addFrame(ctx, { copy: true, delay: (1000 / fps) });
      }

      // 6. Render
      gif.on('finished', (blob: Blob) => {
        const gifUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = gifUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(localWorkerUrl);
        resolve();
      });

      gif.render();
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      URL.revokeObjectURL(localWorkerUrl);
      reject(new Error("Failed to load SVG into memory. This is usually caused by external resources (like fonts) which are blocked in this context."));
    };

    img.src = url;
  });
};
