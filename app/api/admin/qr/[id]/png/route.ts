import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role, getSessionUser } from "@/lib/auth";
import { getBaseUrl, qrPngBuffer, standUrl } from "@/lib/qr";

export const runtime = "nodejs";

// Stend maketi üçün yüksək rezolyusiyalı QR PNG.
// ?side=front (default) — müştəri QR-ı
// ?side=back            — satıcı QR-ı
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== Role.PLATFORM_ADMIN) {
    return NextResponse.json({ error: "İcazə yoxdur." }, { status: 403 });
  }

  const { id } = await params;
  const qr = await prisma.qrCode.findUnique({ where: { id } });
  if (!qr) {
    return NextResponse.json({ error: "Kod tapılmadı." }, { status: 404 });
  }

  const side = new URL(req.url).searchParams.get("side") === "back"
    ? "back"
    : "front";

  if (side === "back" && !qr.staffCode) {
    return NextResponse.json(
      { error: "Bu stendin satıcı kodu yoxdur." },
      { status: 404 },
    );
  }

  const baseUrl = await getBaseUrl();
  const target =
    side === "back"
      ? `${baseUrl}/m/${qr.staffCode}`
      : standUrl(baseUrl, qr.code);
  const label = side === "back" ? `arxa-${qr.staffCode}` : `on-${qr.code}`;

  const png = await qrPngBuffer(target);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="stend-${label}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
