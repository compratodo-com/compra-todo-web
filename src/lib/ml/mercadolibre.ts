import axios from "axios";

const ML_API_BASE = "https://api.mercadolibre.com";
const ML_SITE = "MLC"; // Chile

interface MLConfig {
  appId?: string;
  clientSecret?: string;
  accessToken?: string;
}

let config: MLConfig = {};

export function configureML(cfg: MLConfig) {
  config = cfg;
}

function getClient() {
  const headers: Record<string, string> = {};
  if (config.accessToken) {
    headers.Authorization = `Bearer ${config.accessToken}`;
  }
  return axios.create({
    baseURL: ML_API_BASE,
    headers,
  });
}

export interface MLProduct {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  currency_id: string;
  available_quantity: number;
  sold_quantity: number;
  condition: string;
  pictures: Array<{ url: string }>;
  thumbnail: string;
  category_id: string;
  catalog_product_id?: string;
  attributes: Array<{
    id: string;
    name: string;
    value_name: string | null;
  }>;
  shipping: {
    free_shipping: boolean;
  };
  tags: string[];
}

export interface MLSearchResult {
  results: MLProduct[];
  paging: {
    total: number;
    offset: number;
    limit: number;
  };
  filters: Array<{
    id: string;
    name: string;
    values: Array<{
      id: string;
      name: string;
      results: number;
    }>;
  }>;
  available_filters: Array<{
    id: string;
    name: string;
    values: Array<{
      id: string;
      name: string;
      results: number;
    }>;
  }>;
}

export async function searchProducts(query: string, options?: {
  category?: string;
  limit?: number;
  offset?: number;
  sort?: string;
}): Promise<MLSearchResult> {
  const client = getClient();
  const params: Record<string, string | number> = {
    q: query,
    site: ML_SITE,
    limit: options?.limit || 50,
    offset: options?.offset || 0,
  };
  if (options?.category) params.category = options.category;
  if (options?.sort) params.sort = options.sort;

  const { data } = await client.get("/sites/MLC/search", { params });
  return data;
}

export async function getTopProducts(categoryId?: string, limit = 50) {
  const params: Record<string, string | number> = {
    site: ML_SITE,
    sort: "sold_quantity_desc",
    limit,
  };
  if (categoryId) params.category = categoryId;

  const client = getClient();
  const { data } = await client.get("/sites/MLC/search", { params });
  return data as MLSearchResult;
}

export async function getProductById(productId: string): Promise<MLProduct> {
  const client = getClient();
  const { data } = await client.get(`/items/${productId}`);
  return data;
}

export async function getProductDescription(productId: string): Promise<string> {
  const client = getClient();
  try {
    const { data } = await client.get(`/items/${productId}/description`);
    return data.plain_text || "";
  } catch {
    return "";
  }
}

export async function getCategories() {
  const client = getClient();
  const { data } = await client.get("/sites/MLC/categories");
  return data as Array<{
    id: string;
    name: string;
    picture?: string;
  }>;
}

export async function getCategoryProducts(categoryId: string, limit = 50) {
  return getTopProducts(categoryId, limit);
}

// Trending products based on sold quantity
export async function getTrendingProducts(limit = 20) {
  const client = getClient();
  const { data } = await client.get("/sites/MLC/trends/search", {
    params: { q: "" },
  });
  return data;
}

export function transformMLProduct(product: MLProduct) {
  const brand = product.attributes?.find((a) => a.id === "BRAND")?.value_name || null;
  return {
    externalId: product.id,
    source: "mercadolibre",
    title: product.title,
    price: product.price,
    originalPrice: product.original_price,
    currency: product.currency_id,
    images: product.pictures?.map((p) => p.url) || [product.thumbnail],
    thumbnail: product.thumbnail,
    categoryId: product.category_id,
    brand,
    condition: product.condition,
    availableQty: product.available_quantity,
    soldQuantity: product.sold_quantity,
    tags: product.tags || [],
    metadata: {
      free_shipping: product.shipping?.free_shipping,
      catalog_product_id: product.catalog_product_id,
    },
  };
}
