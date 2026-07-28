import { NextResponse } from "next/server";
import { z } from "zod";
import { Role, getSessionUser } from "@/lib/auth";
import { createBatch } from "@/lib/qrcodes";

export const runtime = "nodejs";

const schema = z.object({
  count: z.number().int().min(1).max(200),
  batch: z.string().max(40).optional().or(z.literal("")),
});

// Yeni QR kod partiyası yaradır (mağazaya bağlanmamış).
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== Role.PLATFORM_ADMIN) {
    return NextResponse.json({ error: "İcazə yoxdur." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Say 1–200 aralığında olmalıdır." },
      { status: 400 },
    );
  }

  try {
    const codes = await createBatch(
      parsed.data.count,
      parsed.data.batch || null,
    );
    return NextResponse.json({ ok: true, count: codes.length, codes });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kodlar yaradılmadı." },
      { status: 500 },
    );
  }
}
