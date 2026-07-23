import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthed } from "@/lib/auth";
import { getBaseUrl, qrPngBuffer, storeUrl } from "@/lib/qr";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "İcazə yoxdur." }, { status: 401 });
  }

  const { slug } = await params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) {
    return NextResponse.json({ error: "Mağaza tapılmadı." }, { status: 404 });
  }

  const baseUrl = await getBaseUrl();
  const png = await qrPngBuffer(storeUrl(baseUrl, store.slug));

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${store.slug}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
