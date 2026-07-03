import fs from "fs";
import path from "path";
import crypto from "crypto";
import https from "https";
import http from "http";

const IMAGES_DIR = path.join(process.cwd(), "public", "images", "products");

/**
 * Downloads an image from a URL and saves it locally.
 * Returns the local path relative to /public.
 */
export async function downloadImage(
  imageUrl: string,
  productExternalId: string
): Promise<string | null> {
  try {
    // Ensure directory exists
    const productDir = path.join(IMAGES_DIR, productExternalId);
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
    }

    // Generate unique filename from URL hash
    const hash = crypto.createHash("md5").update(imageUrl).digest("hex");
    const ext = path.extname(new URL(imageUrl).pathname) || ".webp";
    const filename = `${hash}${ext}`;
    const localPath = path.join(productDir, filename);
    const relativePath = `/images/products/${productExternalId}/${filename}`;

    // Skip if already downloaded
    if (fs.existsSync(localPath)) {
      return relativePath;
    }

    // Download
    await downloadFile(imageUrl, localPath);

    return relativePath;
  } catch (error) {
    console.error(`[ImageDownloader] Failed to download ${imageUrl}:`, error);
    return null;
  }
}

/**
 * Downloads all images for a product. Returns array of local paths.
 */
export async function downloadProductImages(
  imageUrls: string[],
  productExternalId: string
): Promise<string[]> {
  const results = await Promise.allSettled(
    imageUrls.map((url) => downloadImage(url, productExternalId))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<string> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;

    const req = protocol
      .get(url, { headers: { "User-Agent": "CompraTodo/1.0" } }, (response) => {
        // Handle redirects
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          const redirectUrl = new URL(response.headers.location, url).toString();
          downloadFile(redirectUrl, dest).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }

        const fileStream = fs.createWriteStream(dest);
        response.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });
        fileStream.on("error", (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
      })
      .on("error", reject)
      .setTimeout(30000, () => {
        req.destroy();
        reject(new Error(`Timeout downloading ${url}`));
      });
  });
}

/**
 * Cleans up old product images that are no longer in the catalog.
 */
export function cleanupOrphanImages(
  activeExternalIds: string[]
): number {
  let deleted = 0;
  if (!fs.existsSync(IMAGES_DIR)) return 0;

  const dirs = fs.readdirSync(IMAGES_DIR);
  for (const dir of dirs) {
    if (!activeExternalIds.includes(dir)) {
      const dirPath = path.join(IMAGES_DIR, dir);
      fs.rmSync(dirPath, { recursive: true, force: true });
      deleted++;
    }
  }

  return deleted;
}
