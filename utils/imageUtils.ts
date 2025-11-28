import { GenerationConfig } from "../types";
import heic2any from "heic2any";

// Process image with HEIC support
// HEIC files are converted to JPEG before processing
export const processImage = (file: File): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      let processedFile = file;

      // Check if file is HEIC/HEIF format
      const isHEIC = file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif');

      if (isHEIC) {
        // Convert HEIC to JPEG
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9
        });

        // heic2any can return Blob or Blob[], handle both cases
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        processedFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), {
          type: 'image/jpeg'
        });
      }

      // Read file as base64
      const reader = new FileReader();
      reader.readAsDataURL(processedFile);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert image to base64"));
        }
      };
      reader.onerror = error => reject(error);
    } catch (error) {
      reject(new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
};

export const downloadSvg = (svgId: string, filename: string) => {
  const svgElement = document.getElementById(svgId);
  if (!svgElement) return;

  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgElement);

  // Ensure namespaces
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+xmlns:xlink/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  // Add XML declaration
  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
