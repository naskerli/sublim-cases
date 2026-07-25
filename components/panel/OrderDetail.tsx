import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { PaymentMethodLabel } from "@/lib/constants";
import StatusControl from "./StatusControl";

type OrderWithRelations = {
  id: string;
  orderNumber: string;
  status: string;
  designImage: string | null;
  uploadedImage: string | null;
  customText: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingAddress: string | null;
  paymentMethod: string;
  casePrice: number;
  shippingFee: number;
  total: number;
  commissionRate: number;
  commissionAmount: number;
  store: { name: string };
  phoneModel: { name: string };
  pickupPoint: { name: string; address: string } | null;
  addons: {
    id: string;
    quantity: number;
    unitPrice: number;
    product: { name: string };
  }[];
};

// Hər iki paneldə istifadə olunur.
// Şəkil URL-ləri səhifədə imzalanıb ötürülür (Supabase Storage private-dir).
export default function OrderDetail({
  order,
  designImageUrl,
  uploadedImageUrl,
  backHref,
  backLabel = "Sifarişlərə qayıt",
  commissionTitle = "Mağaza (komissiya)",
  showStoreName = true,
}: {
  order: OrderWithRelations;
  designImageUrl: string | null;
  uploadedImageUrl: string | null;
  backHref: string;
  backLabel?: string;
  commissionTitle?: string;
  showStoreName?: boolean;
}) {
  return (
    <div>
      <Link href={backHref} className="text-sm text-indigo-600">
        ← {backLabel}
      </Link>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h1 className="font-mono text-lg font-bold text-gray-900 sm:text-xl">
          {order.orderNumber}
        </h1>
        <StatusControl orderId={order.id} current={order.status} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Dizayn */}
        <div className="lg:col-span-1">
          <p className="mb-2 text-sm font-medium text-gray-700">Dizayn</p>
          {designImageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={designImageUrl}
                alt="Dizayn"
                className="w-full rounded-xl border border-gray-200"
              />
              <a
                href={designImageUrl}
                download={`${order.orderNumber}-dizayn.jpg`}
                className="mt-2 inline-block rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 active:bg-gray-50"
              >
                Çap üçün yüklə
              </a>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
              {order.designImage
                ? "Şəkil əlçatan deyil"
                : "Şəkil yoxdur"}
            </div>
          )}
          {uploadedImageUrl && (
            <div className="mt-3">
              <p className="mb-1 text-xs text-gray-500">Yüklənən orijinal</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadedImageUrl}
                alt="Orijinal"
                className="w-32 rounded-lg border border-gray-200"
              />
            </div>
          )}
          {order.customText && (
            <p className="mt-3 text-sm text-gray-600">
              Mətn: <span className="font-medium">{order.customText}</span>
            </p>
          )}
        </div>

        {/* Detallar */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Müştəri">
            <Info label="Ad" value={order.customerName} />
            <Info label="Telefon" value={order.customerPhone} />
            {order.customerEmail && (
              <Info label="Email" value={order.customerEmail} />
            )}
            {order.shippingAddress && (
              <Info label="Ünvan" value={order.shippingAddress} />
            )}
          </Section>

          <Section title="Çatdırılma">
            <Info
              label="Pickup"
              value={
                order.pickupPoint
                  ? `${order.pickupPoint.name} — ${order.pickupPoint.address}`
                  : "—"
              }
            />
            <Info
              label="Ödəniş üsulu"
              value={
                PaymentMethodLabel[order.paymentMethod] ?? order.paymentMethod
              }
            />
          </Section>

          <Section title={commissionTitle}>
            {showStoreName && <Info label="Mağaza" value={order.store.name} />}
            <Info
              label="Komissiya nisbəti"
              value={`${(order.commissionRate * 100).toFixed(0)}%`}
            />
            <Info
              label="Komissiya məbləği"
              value={formatPrice(order.commissionAmount)}
            />
          </Section>

          <Section title="Məhsullar">
            <div className="text-sm">
              <Line
                label={`Kabro — ${order.phoneModel.name}`}
                value={formatPrice(order.casePrice)}
              />
              {order.addons.map((a) => (
                <Line
                  key={a.id}
                  label={`${a.product.name} × ${a.quantity}`}
                  value={formatPrice(a.unitPrice * a.quantity)}
                />
              ))}
              <Line label="Çatdırılma" value={formatPrice(order.shippingFee)} />
              <div className="my-2 border-t border-gray-200" />
              <Line label="Cəmi" value={formatPrice(order.total)} bold />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">{title}</h2>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-28 shrink-0 text-gray-500 sm:w-36">{label}</span>
      <span className="break-words text-gray-900">{value}</span>
    </div>
  );
}

function Line({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-1 ${
        bold ? "font-bold text-gray-900" : "text-gray-600"
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
