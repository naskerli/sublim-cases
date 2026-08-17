"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

// Kamera adasının düzülüşü — hər model ailəsinin öz vizual imzası var.
export type CameraLayout =
  | "ios-pill-2" // iPhone 17 — şaquli pill modul, 2 lens
  | "ios-plateau-1" // iPhone Air — tam enli plato, 1 lens
  | "ios-plateau-3" // iPhone 17 Pro / Pro Max — tam enli plato, 3 lens
  | "ios-square-3" // iPhone 15/16 Pro/Pro Max — klassik kvadrat modul (tam enli plato deyil)
  | "galaxy-island-3" // Galaxy S25/S26 — oval ada, 3 lens
  | "galaxy-ultra" // Galaxy S25/S26 Ultra — ayrı-ayrı halqalar
  | "galaxy-a-pill" // Galaxy A36/A56/A37/A57 — dar şaquli pill, 3 lens
  | "xiaomi-square-3" // Mi 15/15 Pro — böyük kvadrat modul, fərdi halqalar
  | "redmi-squircle-3"; // Redmi Note 14/15 (Pro) — kompakt "squircle" modul

// Korpusun REAL fiziki ölçüləri (mm). Canvas bu nisbətlərə görə çəkilir,
// yəni Pro Max həqiqətən iPhone 17-dən böyük görünür.
export type CaseShape = {
  wMm: number;
  hMm: number;
  radiusMm: number;
  camera: CameraLayout;
};

// mm → logical px. 4.5 seçilib ki, tipik telefon ~320px enində çəkilsin.
const PX_PER_MM = 4.5;

// Mətnin arxa fonu: yoxdur / düz rəng / şəklin bulanıq təbəqəsi
export type TextBackground = "none" | "solid" | "blur";

export type TextOptions = {
  text: string;
  font: string;
  color: string;
  size: number; // logical px
  x: number; // 0..1 (mərkəz nisbəti)
  y: number; // 0..1
  bg: TextBackground;
  bgColor: string; // düz fon rəngi / blur üzərindəki çalar
  border: boolean; // çərçivə
};

export type PhotoTransform = {
  scale: number; // 1 = cover
  offsetX: number; // -1..1 (nisbi sürüşdürmə)
  offsetY: number;
};

// Foto sürüşdürülüb/kiçildiləndə kabronun kənarında boşluq qalırsa,
// AI outpaint sorğusu üçün lazım olan parametrlər (orijinal şəkil
// piksel fəzasında — Segmind kimi API-lər orijinal şəkli və onun
// daha böyük "hədəf" kətan üzərindəki mövqeyini gözləyir).
export type OutpaintParams = {
  imageDataUrl: string; // orijinal şəkil (lazım gələrsə kiçildilmiş)
  targetWidth: number;
  targetHeight: number;
  offsetX: number;
  offsetY: number;
};

export type CaseCanvasHandle = {
  toDataURL: () => string | null;
  // Kənarda boşluq yoxdursa (və ya şəkil hələ yüklənməyibsə) null qaytarır.
  getOutpaintParams: () => OutpaintParams | null;
};

// Segmind sd1.5-outpaint modelinin praktik rezolyusiya həddi —
// bundan böyük göndərmək yavaş/bahalı olur, ona görə mütənasib kiçildilir.
const MAX_OUTPAINT_DIM = 1024;
// SD modelləri adətən 8-in qatı ölçüləri gözləyir.
const roundTo8 = (v: number) => Math.round(v / 8) * 8;

type Props = {
  shape: CaseShape;
  photoSrc: string | null;
  transform: PhotoTransform;
  text: TextOptions;
  className?: string;
  // "width" — eni doldurur (default).
  // "height" — valideynin hündürlüyünə sığır; scroll-suz ekranlar üçün.
  fit?: "width" | "height";
};

const SCALE = 2; // rezolyusiya çarpanı (kəskinlik üçün)

// "#rrggbb" → "rgba(r,g,b,a)". Naməlum formatda olduğu kimi qaytarır.
function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// --- Kamera adası ---
// Ölçülər mm ilə verilir (məhsul şəkillərindən təxmin edilib), korpusun
// real ölçüsünə görə miqyaslanır. Bütün düzülüşlərdə kamera SOL yuxarıdadır.

function lens(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  // gövdə
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(18,18,22,0.94)";
  ctx.fill();
  // metal halqa
  ctx.lineWidth = r * 0.2;
  ctx.strokeStyle = "rgba(150,160,180,0.65)";
  ctx.stroke();
  // şüşə
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.58, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(28,32,48,0.95)";
  ctx.fill();
  // parıltı
  ctx.beginPath();
  ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(190,205,235,0.55)";
  ctx.fill();
}

function dot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string,
) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function moduleBase(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = "rgba(15,15,20,0.42)";
  ctx.fill();
  ctx.lineWidth = Math.max(1, w * 0.006);
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.stroke();
}

function drawCamera(ctx: CanvasRenderingContext2D, shape: CaseShape) {
  const k = PX_PER_MM * SCALE; // mm → cihaz pikseli
  const mm = (v: number) => v * k;
  const W = shape.wMm * k;

  ctx.save();

  switch (shape.camera) {
    // iPhone 17 — şaquli pill modul, 2 lens üst-üstə, flaş modulun sağında
    case "ios-pill-2": {
      const x = mm(8.5);
      const y = mm(8.5);
      const w = mm(27);
      const h = mm(46);
      moduleBase(ctx, x, y, w, h, w / 2);
      const r = mm(8.2);
      lens(ctx, x + w / 2, y + mm(12.5), r);
      lens(ctx, x + w / 2, y + mm(33.5), r);
      // flaş — modulun sağında
      dot(ctx, x + w + mm(7), y + mm(11), mm(2.8), "rgba(255,240,205,0.9)");
      break;
    }

    // iPhone Air — tam enli plato, tək lens solda
    case "ios-plateau-1": {
      const x = mm(5.5);
      const y = mm(6.5);
      const w = W - mm(11);
      const h = mm(24);
      moduleBase(ctx, x, y, w, h, mm(8));
      lens(ctx, x + mm(15), y + h / 2, mm(8.5));
      dot(ctx, x + mm(31), y + h / 2, mm(2.6), "rgba(255,240,205,0.9)");
      // sağda mikrofon
      dot(ctx, x + w - mm(12), y + h / 2, mm(1.6), "rgba(60,60,70,0.8)");
      break;
    }

    // iPhone 17 Pro / Pro Max — tam enli plato, solda üçbucaq 3 lens
    case "ios-plateau-3": {
      const x = mm(5.5);
      const y = mm(6.5);
      const w = W - mm(11);
      const h = mm(31);
      moduleBase(ctx, x, y, w, h, mm(9));
      const r = mm(8.6);
      const cx1 = x + mm(14);
      const cx2 = cx1 + mm(17.5);
      lens(ctx, cx1, y + mm(9.5), r);
      lens(ctx, cx1, y + mm(21.5), r);
      lens(ctx, cx2, y + h / 2, r);
      // sağ tərəf: LiDAR + flaş
      dot(ctx, x + w - mm(20), y + h / 2 - mm(5), mm(3.2), "rgba(35,38,50,0.95)");
      dot(ctx, x + w - mm(20), y + h / 2 + mm(5), mm(3.4), "rgba(255,240,205,0.9)");
      break;
    }

    // Galaxy S26 — pill formalı ada, 3 lens şaquli; flaş adadan kənarda
    case "galaxy-island-3": {
      const w = mm(23);
      const x = mm(9);
      const y = mm(10);
      const h = mm(55);
      moduleBase(ctx, x, y, w, h, w / 2);
      const r = mm(7.2);
      const cx = x + w / 2;
      lens(ctx, cx, y + mm(11.5), r);
      lens(ctx, cx, y + mm(27.5), r);
      lens(ctx, cx, y + mm(43.5), r);
      dot(ctx, x + w + mm(7), y + mm(12), mm(2.4), "rgba(255,240,205,0.9)");
      break;
    }

    // Galaxy S26 Ultra — pill ada içində 3 lens (main, telefoto, ultra-geniş);
    // 4-cü sensor və flaş adadan kənarda, ayrıca çıxıntıdadır.
    case "galaxy-ultra": {
      const w = mm(25);
      const x = mm(9.5);
      const y = mm(10);
      const h = mm(60);
      moduleBase(ctx, x, y, w, h, w / 2);
      const r = mm(7.8);
      const cx = x + w / 2;
      lens(ctx, cx, y + mm(12.5), r);
      lens(ctx, cx, y + mm(30), r);
      lens(ctx, cx, y + mm(47.5), r);
      // adadan kənar: 4-cü sensor + flaş
      const ox = x + w + mm(9.5);
      lens(ctx, ox, y + mm(14), mm(4.6));
      dot(ctx, ox, y + mm(27), mm(2.7), "rgba(255,240,205,0.9)");
      break;
    }

    // iPhone 15/16 Pro/Pro Max — klassik kvadrat modul (17 Pro-nun tam enli
    // platosundan fərqli olaraq korpusun eninə uzanmır). Ölçülər Apple-ın
    // rəsmi ölçü çertyojlarından: modul ~38mm, lens diametri 16.2mm.
    case "ios-square-3": {
      const x = mm(5.5);
      const y = mm(6.5);
      const size = mm(38);
      moduleBase(ctx, x, y, size, size, mm(13));
      const r = mm(8.1);
      const cx1 = x + mm(13);
      const cx2 = x + mm(28);
      const cyMid = y + size / 2;
      lens(ctx, cx1, y + mm(12), r);
      lens(ctx, cx1, y + mm(28), r);
      lens(ctx, cx2, cyMid, r);
      // LiDAR + flaş qalan küncdə
      dot(ctx, x + size - mm(7), y + mm(7), mm(3), "rgba(20,20,25,0.9)");
      dot(ctx, x + size - mm(7), y + size - mm(8), mm(3.2), "rgba(255,240,205,0.9)");
      break;
    }

    // Galaxy A36/A56/A37/A57 — dar şaquli pill, 3 lens bir modulda
    // birləşdirilib (S-seriyadan fərqli, daha kompakt).
    case "galaxy-a-pill": {
      const w = mm(20);
      const x = mm(9);
      const y = mm(9);
      const h = mm(48);
      moduleBase(ctx, x, y, w, h, w / 2);
      const r = mm(6.8);
      const cx = x + w / 2;
      lens(ctx, cx, y + mm(10), r);
      lens(ctx, cx, y + mm(24), r);
      lens(ctx, cx, y + mm(38), r);
      dot(ctx, x + w + mm(6), y + mm(10), mm(2.2), "rgba(255,240,205,0.9)");
      break;
    }

    // Mi 15 / Mi 15 Pro — Xiaomi-nin böyük kvadrat modulu, hər lens öz
    // fərdi çıxıntısında (L-formalı düzülüş).
    case "xiaomi-square-3": {
      const x = mm(7);
      const y = mm(7);
      const size = mm(42);
      moduleBase(ctx, x, y, size, size, mm(14));
      const r = mm(9.5);
      lens(ctx, x + mm(13), y + mm(13), r);
      lens(ctx, x + mm(29), y + mm(13), r);
      lens(ctx, x + mm(13), y + mm(29), r);
      dot(ctx, x + mm(29), y + mm(29), mm(3.5), "rgba(255,240,205,0.9)");
      break;
    }

    // Redmi Note 14/15 (Pro) — kompakt "squircle" modul, 2 funksional lens
    // + dərinlik sensoru (bəzi modellərdə "3-cü lens" faktiki dərinlikdir).
    case "redmi-squircle-3": {
      // Üç əsl lens L-formada: yuxarı-sol (böyük), yuxarı-sağ (kiçik),
      // aşağı-sol (böyük) + flaş aşağı-sağda.
      const x = mm(6);
      const y = mm(6.5);
      const size = mm(36);
      moduleBase(ctx, x, y, size, size, mm(12));
      const rBig = mm(7.5);
      const rSmall = mm(6.3);
      lens(ctx, x + mm(12), y + mm(12), rBig);
      lens(ctx, x + mm(26), y + mm(12), rSmall);
      lens(ctx, x + mm(12), y + mm(26), rBig);
      dot(ctx, x + mm(26), y + mm(26), mm(3), "rgba(255,240,205,0.9)");
      break;
    }
  }

  ctx.restore();
}

export const CaseCanvas = forwardRef<CaseCanvasHandle, Props>(
  function CaseCanvas(
    { shape, photoSrc, transform, text, className, fit = "width" },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const k = PX_PER_MM * SCALE;
      const W = shape.wMm * k;
      const H = shape.hMm * k;
      const radius = shape.radiusMm * k;
      canvas.width = W;
      canvas.height = H;

      ctx.clearRect(0, 0, W, H);

      // Kabro forması — kəsmə sahəsi
      ctx.save();
      roundedRectPath(ctx, 0, 0, W, H, radius);
      ctx.clip();

      // Fon (şəkil yoxdursa)
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(0, 0, W, H);

      const img = imgRef.current;
      // Şəklin yerləşməsi — blur fonu üçün sonra təkrar istifadə olunur.
      let placement: { dx: number; dy: number; dw: number; dh: number } | null =
        null;
      if (img && img.complete && img.naturalWidth > 0) {
        // "cover" hesablaması + istifadəçi transformasiyası
        const scale =
          Math.max(W / img.naturalWidth, H / img.naturalHeight) *
          Math.max(0.2, transform.scale);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const dx = (W - dw) / 2 + transform.offsetX * (dw - W) * 0.5;
        const dy = (H - dh) / 2 + transform.offsetY * (dh - H) * 0.5;
        placement = { dx, dy, dw, dh };
        ctx.drawImage(img, dx, dy, dw, dh);
      }

      // Mətn overlay (fon + çərçivə + mətn)
      if (text.text.trim()) {
        const fontPx = text.size * SCALE;
        const lines = text.text.split("\n");
        const lineH = fontPx * 1.2;
        const tx = text.x * W;
        const ty = text.y * H;
        const startY = ty - ((lines.length - 1) * lineH) / 2;

        ctx.save();
        ctx.font = `700 ${fontPx}px ${text.font}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const hasBox = text.bg !== "none" || text.border;

        if (hasBox) {
          // Mətn qutusunun ölçüsü
          const maxLine = Math.max(
            ...lines.map((ln) => ctx.measureText(ln).width),
          );
          const padX = fontPx * 0.55;
          const padY = fontPx * 0.4;
          const boxW = maxLine + padX * 2;
          const boxH = lines.length * lineH + padY * 2 - (lineH - fontPx);
          const boxX = tx - boxW / 2;
          const boxY = ty - boxH / 2;
          const boxR = Math.min(fontPx * 0.45, boxH / 2);

          if (text.bg === "blur" && placement) {
            // Şəklin həmin hissəsini bulanıq şəkildə təkrar çək
            ctx.save();
            roundedRectPath(ctx, boxX, boxY, boxW, boxH, boxR);
            ctx.clip();
            ctx.filter = `blur(${Math.max(2, fontPx * 0.22)}px)`;
            ctx.drawImage(
              img!,
              placement.dx,
              placement.dy,
              placement.dw,
              placement.dh,
            );
            ctx.filter = "none";
            // Oxunaqlılıq üçün yüngül çalar (blur dəstəklənməsə də işləyir)
            ctx.fillStyle = withAlpha(text.bgColor, 0.32);
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.restore();
          } else if (text.bg === "solid") {
            roundedRectPath(ctx, boxX, boxY, boxW, boxH, boxR);
            ctx.fillStyle = withAlpha(text.bgColor, 0.82);
            ctx.fill();
          }

          if (text.border) {
            roundedRectPath(ctx, boxX, boxY, boxW, boxH, boxR);
            ctx.lineWidth = Math.max(1.5, fontPx * 0.075);
            ctx.strokeStyle = text.color;
            ctx.stroke();
          }
        }

        // Mətnin özü
        ctx.fillStyle = text.color;
        if (!hasBox) {
          // Fon yoxdursa kölgə oxunaqlılığı artırır
          ctx.shadowColor = "rgba(0,0,0,0.35)";
          ctx.shadowBlur = 6 * SCALE;
        }
        lines.forEach((ln, i) => {
          ctx.fillText(ln, tx, startY + i * lineH);
        });
        ctx.restore();
      }

      ctx.restore();

      // Kamera modulu (kəsmədən sonra, üstdə)
      drawCamera(ctx, shape);

      // Kabro kənarı — incə işıq
      ctx.save();
      roundedRectPath(
        ctx,
        SCALE,
        SCALE,
        W - 2 * SCALE,
        H - 2 * SCALE,
        radius,
      );
      ctx.lineWidth = 3 * SCALE;
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.stroke();
      ctx.restore();
    };

    // Şəkli yüklə
    useEffect(() => {
      if (!photoSrc) {
        imgRef.current = null;
        draw();
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imgRef.current = img;
        draw();
      };
      img.src = photoSrc;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [photoSrc]);

    // Digər dəyişikliklərdə yenidən çək
    useEffect(() => {
      draw();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      shape.wMm,
      shape.hMm,
      shape.radiusMm,
      shape.camera,
      transform.scale,
      transform.offsetX,
      transform.offsetY,
      text.text,
      text.font,
      text.color,
      text.size,
      text.x,
      text.y,
      text.bg,
      text.bgColor,
      text.border,
    ]);

    useImperativeHandle(ref, () => ({
      toDataURL: () => {
        draw();
        return canvasRef.current?.toDataURL("image/jpeg", 0.9) ?? null;
      },

      getOutpaintParams: () => {
        const img = imgRef.current;
        if (!img || !img.complete || img.naturalWidth === 0) return null;

        const k = PX_PER_MM * SCALE;
        const W = shape.wMm * k;
        const H = shape.hMm * k;

        const coverScale =
          Math.max(W / img.naturalWidth, H / img.naturalHeight) *
          Math.max(0.2, transform.scale);
        const dw = img.naturalWidth * coverScale;
        const dh = img.naturalHeight * coverScale;
        const dx = (W - dw) / 2 + transform.offsetX * (dw - W) * 0.5;
        const dy = (H - dh) / 2 + transform.offsetY * (dh - H) * 0.5;

        // Kənarların hər hansı birində 1px-dən çox boşluq varsa
        const EPS = 1;
        const hasGap =
          dx > EPS || dy > EPS || dx + dw < W - EPS || dy + dh < H - EPS;
        if (!hasGap) return null;

        // Orijinal şəkil fəzasında hədəf kətan ölçüsü və şəklin ofseti
        let targetW = W / coverScale;
        let targetH = H / coverScale;
        let offsetX = Math.max(0, dx / coverScale);
        let offsetY = Math.max(0, dy / coverScale);

        // Praktik rezolyusiya həddinə mütənasib kiçiltmə
        const longSide = Math.max(targetW, targetH);
        const clamp =
          longSide > MAX_OUTPAINT_DIM ? MAX_OUTPAINT_DIM / longSide : 1;

        targetW = roundTo8(targetW * clamp);
        targetH = roundTo8(targetH * clamp);
        offsetX = roundTo8(offsetX * clamp);
        offsetY = roundTo8(offsetY * clamp);

        // Göndərilən şəkil eyni əmsalla kiçildilir ki, offset/hədəflə uyğun qalsın
        const sendW = Math.max(8, roundTo8(img.naturalWidth * clamp));
        const sendH = Math.max(8, roundTo8(img.naturalHeight * clamp));

        const off = document.createElement("canvas");
        off.width = sendW;
        off.height = sendH;
        const octx = off.getContext("2d");
        if (!octx) return null;
        octx.drawImage(img, 0, 0, sendW, sendH);

        return {
          imageDataUrl: off.toDataURL("image/jpeg", 0.9),
          targetWidth: targetW,
          targetHeight: targetH,
          offsetX,
          offsetY,
        };
      },
    }));

    const sizing =
      fit === "height"
        ? { height: "100%", width: "auto", maxWidth: "100%" }
        : { width: "100%", maxWidth: shape.wMm * PX_PER_MM };

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          ...sizing,
          aspectRatio: `${shape.wMm} / ${shape.hMm}`,
          borderRadius: `${(shape.radiusMm / shape.wMm) * 100}% / ${(shape.radiusMm / shape.hMm) * 100}%`,
          boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
          background: "#e5e7eb",
        }}
      />
    );
  },
);
