import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const SEGMIND_ENDPOINT = "https://api.segmind.com/v1/sd1.5-outpaint";
const MAX_BYTES = 10 * 1024 * 1024;

// Dəyişənin adı "SEGMIND_URL"dur, amma dəyəri Segmind API açarıdır
// (Segmind-in özündə API ünvanı sabitdir, hər istifadəçi üçün fərqli
// deyil — burada saxlanılan yalnız "x-api-key" dəyəridir).
const SEGMIND_KEY = process.env.SEGMIND_URL;

const schema = z.object({
  imageDataUrl: z
    .string()
    .regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "Yanlış şəkil formatı."),
  targetWidth: z.number().int().min(64).max(2048),
  targetHeight: z.number().int().min(64).max(2048),
  offsetX: z.number().int().min(0),
  offsetY: z.number().int().min(0),
});

function parseDataUrl(dataUrl: string): { buffer: Buffer; mime: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { buffer: Buffer.from(match[2], "base64"), mime: match[1] };
}

// Foto sürüşdürülüb kənarda boşluq qalanda çağırılır — Segmind-in
// sd1.5-outpaint modeli ilə boşluğu süni şəkildə tamamlayır.
export async function POST(req: Request) {
  if (!SEGMIND_KEY) {
    return NextResponse.json(
      { error: "AI tamamlama xidməti konfiqurasiya olunmayıb." },
      { status: 503 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Yanlış məlumat." }, { status: 400 });
  }
  const { imageDataUrl, targetWidth, targetHeight, offsetX, offsetY } =
    parsed.data;

  const img = parseDataUrl(imageDataUrl);
  if (!img) {
    return NextResponse.json({ error: "Şəkil oxuna bilmədi." }, { status: 400 });
  }
  if (img.buffer.length > MAX_BYTES) {
    return NextResponse.json(
      { error: "Şəkil çox böyükdür." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(SEGMIND_ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": SEGMIND_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: img.buffer.toString("base64"),
        prompt: "seamless natural continuation of the background, photorealistic",
        negative_prompt: "blurry, distorted, artifacts, text, watermark",
        scheduler: "DDIM",
        num_inference_steps: 25,
        img_width: targetWidth,
        img_height: targetHeight,
        scale: 1,
        strength: 1,
        offset_x: offsetX,
        offset_y: offsetY,
        guidance_scale: 7.5,
        mask_expand: 8,
        seed: Math.floor(Math.random() * 1_000_000),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[outpaint] Segmind ${res.status}: ${detail}`);
      return NextResponse.json(
        { error: "AI tamamlama alınmadı. Bir az sonra yenidən cəhd edin." },
        { status: 502 },
      );
    }

    const contentType = res.headers.get("content-type") ?? "image/png";
    const buffer = Buffer.from(await res.arrayBuffer());
    const dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;

    return NextResponse.json({ dataUrl });
  } catch (err) {
    console.error("[outpaint] request failed:", err);
    return NextResponse.json(
      { error: "AI xidmətinə qoşulmaq mümkün olmadı." },
      { status: 502 },
    );
  }
}
