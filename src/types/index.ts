export interface CatalogProduct {
  id: string;
  externalId: string;
  title: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  currency: string;
  images: string[];
  thumbnail: string | null;
  categoryId: string | null;
  categoryName?: string;
  brand: string | null;
  condition: string;
  soldQuantity: number;
  rating: number | null;
  isFeatured: boolean;
  tags: string[];
  discount?: number;
}

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderWithTracking {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  coinsEarned: number;
  isExpress: boolean;
  trackingCode: string | null;
  courier: string | null;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  createdAt: string;
  products: Array<{
    id: string;
    title: string;
    image: string;
    quantity: number;
    unitPrice: number;
  }>;
  events: Array<{
    id: string;
    status: string;
    title: string;
    description: string | null;
    location: string | null;
    isMilestone: boolean;
    createdAt: string;
  }>;
}

export interface GameState {
  coins: number;
  level: number;
  xp: number;
  totalSpent: number;
  streak: number;
  title: string;
  nextLevel: string | null;
  progress: number;
}

export interface SpinResult {
  type: "coins" | "discount" | "boost" | "nothing";
  label: string;
  value: number | null;
  multiplier: number;
}

export type MissionType = "daily" | "weekly" | "seasonal" | "achievement";
export type MissionRequirement =
  | "buy_product"
  | "buy_category"
  | "spend_amount"
  | "complete_orders"
  | "spin_wheel"
  | "login_streak"
  | "collect_coins"
  | "complete_collection";

export interface AgentManifest {
  name: string;
  schedule: string;
  description: string;
}

export interface AgentResult {
  agent: string;
  action: string;
  status: "success" | "warning" | "error";
  details?: Record<string, unknown>;
}
