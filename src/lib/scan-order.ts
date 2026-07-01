import { scanOrderImage, type ScannedData } from "./scan-order.functions";

export type { ScannedData };

/**
 * Client-side helper. Downscales an image to <=1024px and returns a base64
 * JPEG payload ready to send to the server function `scanOrderImage`.
 * The Gemini API key is NEVER exposed to the browser — see
 * `src/lib/scan-order.functions.ts`.
 */
export function compressImage(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const MAX = 1024;
      let w = img.width;
      let h = img.height;
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      ctx?.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      const base64 = dataUrl.split(",")[1] ?? "";
      resolve({ base64, mediaType: "image/jpeg" });
    };

    img.onerror = () => reject(new Error("Failed to load image for compression"));

    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Client wrapper — proxies the image to the server function which holds the
 * Gemini API key. Signature is preserved for compatibility with existing
 * callers.
 */
export async function scanOrderWithGemini(
  base64: string,
  mediaType: string,
): Promise<ScannedData> {
  return scanOrderImage({ data: { base64, mediaType } });
}
