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

