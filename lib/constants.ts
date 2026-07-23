// Domen sabitləri — SQLite enum dəstəkləmədiyi üçün string kimi saxlanılır.

export const OrderStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  IN_PRODUCTION: "IN_PRODUCTION",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const OrderStatusLabel: Record<string, string> = {
  PENDING: "Gözləyir",
  PAID: "Ödənilib",
  IN_PRODUCTION: "İstehsalda",
  SHIPPED: "Göndərilib",
  DELIVERED: "Çatdırılıb",
  CANCELLED: "Ləğv edilib",
};

export const PaymentMethod = {
  CARD: "CARD",
  CASH_ON_DELIVERY: "CASH_ON_DELIVERY",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentMethodLabel: Record<string, string> = {
  CARD: "Kartla ödəniş",
  CASH_ON_DELIVERY: "Çatdırılmada ödəniş",
};

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export const ProductType = {
  CASE: "CASE",
  ADDON: "ADDON",
} as const;

export const CURRENCY = "AZN";
