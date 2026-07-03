/**
 * Google Images Search (inline)
 * Busca imágenes en Google Images usando la API interna de Google.
 * No necesita API key. Reimplementación ligera de google-image-sr.
 */

import axios from "axios";

function getPayload(query: string) {
  return [[
    "HoAMBc",
    JSON.stringify([
      null, null,
      [0, null, 2529, 85, 2396, [], [9429, 9520], [194, 194], false, null, null, 9520],
      null, null, null, null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null, null, null, null, null,
      null, null, [query], null, null, null, null, null, null, null, null,
      [null, "CAE=", "GGwg=="], null, true,
    ]),
    null, "generic",
  ]];
}

function getHeaders() {
  return {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    "Origin": "https://www.google.com",
    "Referer": "https://www.google.com/",
  };
}

export interface GoogleImageResult {
  title?: string;
  url?: string;
  image?: string;
}

export async function searchGoogleImages(
  query: string,
  maxResults = 5
): Promise<GoogleImageResult[]> {
  if (!query) return [];

  try {
    const formData = new URLSearchParams();
    formData.append("f.req", JSON.stringify(getPayload(query)));
    formData.append("at", `${randomString(29)}:${Date.now()}`);

    const response = await axios.post(
      "https://www.google.com/_/VisualFrontendUi/data/batchexecute",
      formData,
      {
        params: {
          rpcids: "HoAMBc",
          "source-path": "/search",
          "f.sid": -Math.floor(Math.random() * 9e10),
          bl: "boq_visualfrontendserver_20220505.05_p0",
          hl: "en",
          authuser: 0,
          _reqid: -Math.floor(Math.random() * 9e5),
        },
        headers: getHeaders(),
        timeout: 10000,
      }
    );

    // Parsear la respuesta
    const raw = response.data;
    const match = raw.match(/\[null(.*?)\]\]/);
    if (!match) return [];

    const json = JSON.parse(`[null${match[1]}]`);
    const items = json?.[56]?.[1]?.[0]?.[0]?.[1]?.[0];
    if (!items || !Array.isArray(items)) return [];

    const results: GoogleImageResult[] = [];

    for (const el of items) {
      try {
        const item = el?.[0]?.[0]?.["444383007"];
        if (!item?.[1]) continue;

        const imageData = item[1]?.filter((e: any) => Array.isArray(e));
        const image = imageData?.[1];
        if (!image) continue;

        const title = item[1]?.find((e: any) => e?.[2001])?.["2008"]?.[1];
        const url = item[1]?.find((e: any) => e?.[2001])?.["2003"]?.[2];
        const imageURL = decodeURIComponent(
          JSON.parse('"' + image[0].replace(/"/g, '"') + '"')
        );

        if (imageURL && imageURL.startsWith("http")) {
          results.push({ title, url, image: imageURL });
        }
      } catch {}
    }

    return results.slice(0, maxResults);
  } catch (error) {
    console.error("[GoogleImages] Search error:", error);
    return [];
  }
}

function randomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
