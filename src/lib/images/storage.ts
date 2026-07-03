/**
 * Image Storage Utility
 * 
 * Usa Vercel Blob en producción (API REST directa, sin SDK),
 * filesystem local en desarrollo.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import https from "https";
import http from "http";

const isProduction = process.env.NODE_ENV === "production";
const LOCAL_IMAGES_DIR = path.join(process.cwd(), "public", "images", "products");

const BLOB_API_BASE = "https://api.vercel.com/v1/blob";

/** Sube imágenes de un producto desde URLs externas */
export async function uploadProductImages(
  imageUrls: string[],
  productExternalId: string
): Promise<string[]> {
  const results = await Promise.allSettled(
    imageUrls.map((url) => uploadImageFromUrl(url, productExternalId))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<string> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);
}

async function uploadImageFromUrl(
  imageUrl: string,
  productExternalId: string
): Promise<string | null> {
  try {
    const ext = path.extname(new URL(imageUrl).pathname) || ".webp";
    const hash = crypto.createHash("md5").update(imageUrl).digest("hex");
    const filename = `${hash}${ext}`;

    if (isProduction) {
      return await uploadToBlob(imageUrl, productExternalId, filename);
    } else {
      return await saveLocally(imageUrl, productExternalId, filename);
    }
  } catch (error) {
    console.error(`[ImageStorage] Error:`, error);
    return null;
  }
}

async function uploadToBlob(
  imageUrl: string,
  productExternalId: string,
  filename: string
): Promise<string | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.warn("[Blob] No BLOB_READ_WRITE_TOKEN configured");
    return await saveLocally(imageUrl, productExternalId, filename);
  }

  try {
    // Download image buffer
    const buffer = await downloadImageBuffer(imageUrl);
    if (!buffer) return null;

    const blobPath = `products/${productExternalId}/${filename}`;

    // Upload via Vercel Blob REST API
    const response = await fetch(`${BLOB_API_BASE}/put/${blobPath}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
        "x-vercel-blob-access": "public",
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Blob] Upload failed: ${response.status} ${text}`);
      return null;
    }

    const data = await response.json() as { url?: string };
    return data.url || null;
  } catch (error) {
    console.error("[Blob] Upload error:", error);
    return null;
  }
}

async function saveLocally(
  imageUrl: string,
  productExternalId: string,
  filename: string
): Promise<string | null> {
  const productDir = path.join(LOCAL_IMAGES_DIR, productExternalId);
  if (!fs.existsSync(productDir)) {
    fs.mkdirSync(productDir, { recursive: true });
  }

  const localPath = path.join(productDir, filename);
  const relativePath = `/images/products/${productExternalId}/${filename}`;

  if (fs.existsSync(localPath)) return relativePath;

  const buffer = await downloadImageBuffer(imageUrl);
  if (!buffer) return null;

  fs.writeFileSync(localPath, buffer);
  return relativePath;
}

function downloadImageBuffer(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        timeout: 30000,
      },
      (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          const redirectUrl = new URL(response.headers.location, url).toString();
          downloadImageBuffer(redirectUrl).then(resolve);
          return;
        }
        if (response.statusCode !== 200) { resolve(null); return; }

        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
        response.on("error", () => resolve(null));
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}
