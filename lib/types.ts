import type { CaseShape } from "@/components/order/CaseCanvas";

// Server komponentindən client wizard-a ötürülən (serializasiya olunmuş) məlumat.
export type StoreDTO = {
  slug: string;
  name: string;
  city: string | null;
};

export type PhoneModelDTO = {
  id: string;
  brand: string;
  name: string;
  slug: string;
  shape: CaseShape;
};

export type ProductDTO = {
  id: string;
  name: string;
  description: string | null;
  price: number;
};

export type PickupPointDTO = {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
};

export const SHIPPING_FEE = 3.5;
