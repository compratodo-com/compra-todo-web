/**
 * Google Analytics event tracking helper
 */
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window === "undefined" || !(window as any).gtag) return;

  try {
    (window as any).gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  } catch {
    // Silently fail
  }
}

// Eventos predefinidos
export const Events = {
  addToCart: (productName: string, price: number) =>
    trackEvent("add_to_cart", "Ecommerce", productName, price),

  beginCheckout: (itemCount: number) =>
    trackEvent("begin_checkout", "Ecommerce", undefined, itemCount),

  addShippingInfo: (method: string) =>
    trackEvent("add_shipping_info", "Ecommerce", method),

  addPaymentInfo: () =>
    trackEvent("add_payment_info", "Ecommerce"),

  purchase: (orderId: string, value: number) =>
    trackEvent("purchase", "Ecommerce", orderId, value),

  signUp: (method: string) =>
    trackEvent("sign_up", "Engagement", method),

  login: () =>
    trackEvent("login", "Engagement"),

  spinWheel: (result: string) =>
    trackEvent("spin_wheel", "Game", result),

  viewProduct: (productName: string) =>
    trackEvent("view_item", "Ecommerce", productName),

  search: (query: string) =>
    trackEvent("search", "Ecommerce", query),
};
