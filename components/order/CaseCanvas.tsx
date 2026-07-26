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
  | "galaxy-island-3" // Galaxy S26 — oval ada, 3 lens
  | "galaxy-ultra"; // Galaxy S26 Ultra — ayrı-ayrı halqalar

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

export type TextOptions = {
  text: string;
  font: string;
  color: string;
  size: number; // logical px
  x: number; // 0..1 (mərkəz nisbəti)
  y: number; // 0..1
};

export type PhotoTransform = {
  scale: number; // 1 = cover
  offsetX: number; // -1..1 (nisbi sürüşdürmə)
  offsetY: number;
};

export type CaseCanvasHandle = {
  toDataURL: () => string | null;
};

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
      if (img && img.complete && img.naturalWidth > 0) {
        // "cover" hesablaması + istifadəçi transformasiyası
        const scale =
          Math.max(W / img.naturalWidth, H / img.naturalHeight) *
          Math.max(0.2, transform.scale);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const dx = (W - dw) / 2 + transform.offsetX * (dw - W) * 0.5;
        const dy = (H - dh) / 2 + transform.offsetY * (dh - H) * 0.5;
        ctx.drawImage(img, dx, dy, dw, dh);
      }

      // Mətn overlay
      if (text.text.trim()) {
        ctx.save();
        ctx.font = `700 ${text.size * SCALE}px ${text.font}`;
        ctx.fillStyle = text.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 6 * SCALE;
        const tx = text.x * W;
        const ty = text.y * H;
        // Çoxsətirli dəstək
        const lines = text.text.split("\n");
        const lineH = text.size * SCALE * 1.2;
        const startY = ty - ((lines.length - 1) * lineH) / 2;
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
    ]);

    useImperativeHandle(ref, () => ({
      toDataURL: () => {
        draw();
        return canvasRef.current?.toDataURL("image/jpeg", 0.9) ?? null;
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
