import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductType } from "@/lib/constants";
import OrderWizard from "@/components/order/OrderWizard";
import type {
  PhoneModelDTO,
  PickupPointDTO,
  ProductDTO,
} from "@/lib/types";
import type {
  CameraLayout,
  CaseShape,
} from "@/components/order/CaseCanvas";

export const dynamic = "force-dynamic";

const CAMERA_LAYOUTS: CameraLayout[] = [
  "ios-pill-2",
  "ios-plateau-1",
  "ios-plateau-3",
  "galaxy-island-3",
  "galaxy-ultra",
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

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store || !store.active) notFound();

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
        store={{ slug: store.slug, name: store.name, city: store.city }}
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
