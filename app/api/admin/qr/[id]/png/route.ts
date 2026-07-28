import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role, getSessionUser } from "@/lib/auth";
import { getBaseUrl, qrPngBuffer, standUrl } from "@/lib/qr";

export const runtime = "nodejs";

// Stend maketi üçün yüksək rezolyusiyalı QR PNG.
export async function GET(
  _req: Request,
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

  const png = await qrPngBuffer(standUrl(await getBaseUrl(), qr.code));

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="stend-${qr.code}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
