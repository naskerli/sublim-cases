import { prisma } from "@/lib/prisma";
import { ProductType } from "@/lib/constants";
import OrderWizard from "@/components/order/OrderWizard";
import type {
  CameraLayout,
  CaseShape,
} from "@/components/order/CaseCanvas";
import type {
  PhoneModelDTO,
  PickupPointDTO,
  ProductDTO,
} from "@/lib/types";

const CAMERA_LAYOUTS: CameraLayout[] = [
  "ios-pill-2",
  "ios-plateau-1",
  "ios-plateau-3",
  "ios-square-3",
  "galaxy-island-3",
  "galaxy-ultra",
  "galaxy-a-pill",
  "xiaomi-square-3",
  "redmi-squircle-3",
];

function parseShape(printArea: string | null): CaseShape {
  // Ölçüsüz köhnə qeydlər üçün neytral fallback (iPhone 17 ölçüləri).
  const fallback: CaseShape = {
    wMm: 71.5,
    hMm: 149.6,
    radiusMm: 12,
    camera: "ios-pill-2",
  };
  if (!printArea) return fallback;
  try {
    const p = JSON.parse(printArea);
    return {
      wMm: Number(p.wMm) || fallback.wMm,
      hMm: Number(p.hMm) || fallback.hMm,
      radiusMm: Number(p.radiusMm) || fallback.radiusMm,
      camera: CAMERA_LAYOUTS.includes(p.camera)
        ? (p.camera as CameraLayout)
        : fallback.camera,
    };
  } catch {
    return fallback;
  }
}

// Müştəri sifariş səhifəsi — həm QR koddan (/q/<code>), həm də birbaşa
// mağaza linkindən (/s/<slug>) istifadə olunur.
export default async function OrderPage({
  store,
  qrCode,
}: {
  store: { slug: string; name: string; city: string | null };
  // Sifarişin hansı stenddən gəldiyini yazmaq üçün
  qrCode?: string | null;
}) {
  const [phoneModels, caseProduct, addonProducts, pickupPoints] =
    await Promise.all([
      prisma.phoneModel.findMany({
        where: { active: true },
        orderBy: [{ brand: "asc" }, { sortOrder: "asc" }],
      }),
      prisma.product.findFirst({
        where: { type: ProductType.CASE, active: true },
      }),
      prisma.product.findMany({
        where: { type: ProductType.ADDON, active: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.pickupPoint.findMany({ where: { active: true } }),
    ]);

  if (!caseProduct) {
    throw new Error("Əsas kabro məhsulu tapılmadı. Seed işlədin.");
  }

  const models: PhoneModelDTO[] = phoneModels.map((m) => ({
    id: m.id,
    brand: m.brand,
    name: m.name,
    slug: m.slug,
    shape: parseShape(m.printArea),
  }));

  const addons: ProductDTO[] = addonProducts.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    price: a.price,
  }));

  const points: PickupPointDTO[] = pickupPoints.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    city: p.city,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
  }));

  return (
    <main className="min-h-screen bg-white">
      <OrderWizard
        store={store}
        qrCode={qrCode ?? null}
        phoneModels={models}
        caseProduct={{
          id: caseProduct.id,
          name: caseProduct.name,
          description: caseProduct.description,
          price: caseProduct.price,
        }}
        addons={addons}
        pickupPoints={points}
      />
    </main>
  );
}
