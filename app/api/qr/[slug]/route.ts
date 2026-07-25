import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role, getSessionUser } from "@/lib/auth";
import { getBaseUrl, qrPngBuffer, storeUrl } from "@/lib/qr";

export const runtime = "nodejs";

// Çap üçün yüksək rezolyusiyalı QR PNG.
// Platforma admini bütün mağazalar üçün, mağaza admini yalnız öz mağazası üçün.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "İcazə yoxdur." }, { status: 401 });
  }

  const { slug } = await params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) {
    return NextResponse.json({ error: "Mağaza tapılmadı." }, { status: 404 });
  }

  if (user.role !== Role.PLATFORM_ADMIN && user.storeId !== store.id) {
    return NextResponse.json({ error: "İcazə yoxdur." }, { status: 403 });
  }

  const png = await qrPngBuffer(storeUrl(await getBaseUrl(), store.slug));

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${store.slug}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
