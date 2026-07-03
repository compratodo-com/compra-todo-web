/**
 * Image Storage Utility
 * 
 * Usa Vercel Blob en producción, filesystem local en desarrollo.
 * Las imágenes se descargan desde MercadoLibre y se almacenan
 * de forma persistente.
 */

import { put, del, list } from "@vercel/blob";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import https from "https";
import http from "http";

const isProduction = process.env.NODE_ENV === "production";
const LOCAL_IMAGES_DIR = path.join(process.cwd(), "public", "images", "products");
const BLOB_PREFIX = "products/";

/** Sube una imagen desde una URL a blob storage (o local) */
export async function uploadImageFromUrl(
  imageUrl: string,
  productExternalId: string
): Promise<string | null> {
  try {
    const ext = path.extname(new URL(imageUrl).pathname) || ".webp";
    const hash = crypto.createHash("md5").update(imageUrl).digest("hex");
    const filename = `${hash}${ext}`;
    const blobPath = `${BLOB_PREFIX}${productExternalId}/${filename}`;

    if (isProduction) {
      return await uploadToBlob(imageUrl, blobPath);
    } else {
      return await saveLocally(imageUrl, productExternalId, filename);
    }
  } catch (error) {
    console.error(`[ImageStorage] Error uploading ${imageUrl}:`, error);
    return null;
  }
}

/** Sube múltiples imágenes de un producto */
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

async function uploadToBlob(
  imageUrl: string,
  blobPath: string
): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("[Blob] No BLOB_READ_WRITE_TOKEN configured, falling back to local");
    return await saveLocally(
      imageUrl,
      blobPath.split("/")[1],
      blobPath.split("/").slice(2).join("/")
    );
  }

  try {
    // Download the image first
    const buffer = await downloadImageBuffer(imageUrl);
    if (!buffer) return null;

    // Upload to Vercel Blob
    const blob = await put(blobPath, buffer, {
      access: "public",
      addRandomSuffix: false,
    });

    return blob.url;
  } catch (error) {
    console.error("[Blob] Upload failed:", error);
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

  if (fs.existsSync(localPath)) {
    return relativePath;
  }

  try {
    const buffer = await downloadImageBuffer(imageUrl);
    if (!buffer) return null;
    fs.writeFileSync(localPath, buffer);
    return relativePath;
  } catch (error) {
    console.error(`[Local] Failed to save ${imageUrl}:`, error);
    return null;
  }
}

function downloadImageBuffer(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        timeout: 30000,
      },
      (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          // Follow redirect
          const redirectUrl = new URL(
            response.headers.location,
            url
          ).toString();
          downloadImageBuffer(redirectUrl).then(resolve);
          return;
        }

        if (response.statusCode !== 200) {
          resolve(null);
          return;
        }

        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
        response.on("error", () => resolve(null));
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
  });
}

/** Lista todas las imágenes almacenadas para un producto */
export async function listProductImages(
  productExternalId: string
): Promise<string[]> {
  if (isProduction) {
    try {
      const { blobs } = await list({
        prefix: `${BLOB_PREFIX}${productExternalId}/`,
      });
      return blobs.map((b) => b.url);
    } catch {
      return [];
    }
  } else {
    const dir = path.join(LOCAL_IMAGES_DIR, productExternalId);
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .map((f) => `/images/products/${productExternalId}/${f}`);
  }
}
