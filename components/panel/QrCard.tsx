import { qrDataUrl, storeUrl } from "@/lib/qr";

// Mağazanın QR kodunu göstərir + çap üçün yükləmə linki.
export default async function QrCard({
  baseUrl,
  slug,
  hint = "Bu QR-ı çap edib mağaza vitrininə yerləşdirin.",
}: {
  baseUrl: string;
  slug: string;
  hint?: string;
}) {
  const url = storeUrl(baseUrl, slug);
  const qr = await qrDataUrl(url);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">QR kod</h2>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qr}
          alt={`${slug} QR kodu`}
          className="h-40 w-40 shrink-0 rounded-lg border border-gray-200 bg-white p-1.5"
          width={160}
          height={160}
        />
        <div className="w-full min-w-0 text-center sm:text-left">
          <p className="break-all font-mono text-xs text-gray-600">{url}</p>
          <p className="mt-2 text-xs text-gray-500">{hint}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <a
              href={`/api/qr/${slug}`}
              download={`qr-${slug}.png`}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-xs font-semibold text-white active:bg-indigo-700"
            >
              QR-ı yüklə (çap üçün)
            </a>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-center text-xs font-semibold text-gray-700 active:bg-gray-50"
            >
              Səhifəni aç
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
