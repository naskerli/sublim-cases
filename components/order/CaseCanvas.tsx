"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export type CaseShape = {
  w: number;
  h: number;
  radius: number;
  camera: "single" | "triple";
};

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

function drawCamera(
  ctx: CanvasRenderingContext2D,
  shape: CaseShape,
) {
  // Kamera modulu — sağ yuxarı künc
  const pad = 24 * SCALE;
  const modW = (shape.camera === "triple" ? 120 : 78) * SCALE;
  const modH = (shape.camera === "triple" ? 120 : 78) * SCALE;
  const mx = shape.w * SCALE - pad - modW;
  const my = pad;

  ctx.save();
  roundedRectPath(ctx, mx, my, modW, modH, 28 * SCALE);
  ctx.fillStyle = "rgba(15,15,20,0.55)";
  ctx.fill();
  ctx.lineWidth = 2 * SCALE;
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.stroke();

  const lens = (cx: number, cy: number, r: number) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(10,10,12,0.9)";
    ctx.fill();
    ctx.lineWidth = 3 * SCALE;
    ctx.strokeStyle = "rgba(120,130,150,0.6)";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(150,170,200,0.5)";
    ctx.fill();
  };

  if (shape.camera === "triple") {
    const r = 20 * SCALE;
    lens(mx + modW * 0.32, my + modH * 0.32, r);
    lens(mx + modW * 0.68, my + modH * 0.32, r);
    lens(mx + modW * 0.32, my + modH * 0.68, r);
    // flash
    ctx.beginPath();
    ctx.arc(mx + modW * 0.68, my + modH * 0.68, 8 * SCALE, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,240,200,0.85)";
    ctx.fill();
  } else {
    lens(mx + modW * 0.5, my + modH * 0.5, 26 * SCALE);
  }
  ctx.restore();
}

export const CaseCanvas = forwardRef<CaseCanvasHandle, Props>(
  function CaseCanvas({ shape, photoSrc, transform, text, className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = shape.w * SCALE;
      const H = shape.h * SCALE;
      canvas.width = W;
      canvas.height = H;

      ctx.clearRect(0, 0, W, H);

      // Kabro forması — kəsmə sahəsi
      ctx.save();
      roundedRectPath(ctx, 0, 0, W, H, shape.radius * SCALE);
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
        shape.radius * SCALE,
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
      shape.w,
      shape.h,
      shape.radius,
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

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          width: "100%",
          maxWidth: shape.w,
          aspectRatio: `${shape.w} / ${shape.h}`,
          borderRadius: shape.radius,
          boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
          background: "#e5e7eb",
        }}
      />
    );
  },
);
