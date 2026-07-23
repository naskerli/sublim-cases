import { CURRENCY } from "./constants";

// Qiyməti AZN formatında göstərir: 24.99 ₼
export function formatPrice(value: number): string {
  return `${value.toFixed(2)} ₼`;
}

export { CURRENCY };

// Sifariş nömrəsi generatoru: SC-<YYMMDD>-<random4>
export function generateOrderNumber(): string {
  const d = new Date();
  const ymd =
    d.getFullYear().toString().slice(2) +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SC-${ymd}-${rand}`;
}
