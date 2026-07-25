import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { getBaseUrl } from "@/lib/qr";
import QrCard from "@/components/panel/QrCard";
import StatCards from "@/components/panel/StatCards";
import OrderList from "@/components/panel/OrderList";
import AddAdminForm from "./AddAdminForm";

export const dynamic = "force-dynamic";

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [store, baseUrl] = await Promise.all([
    prisma.store.findUnique({
      where: { id },
      include: {
        users: { orderBy: { createdAt: "asc" } },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { store: true, phoneModel: true },
        },
      },
    }),
    getBaseUrl(),
  ]);
  if (!store) notFound();

  const agg = await prisma.order.aggregate({
    where: { storeId: store.id },
    _sum: { total: true, commissionAmount: true },
    _count: true,
  });

  return (
    <div>
      <Link href="/admin/stores" className="text-sm text-indigo-600">
        ← Mağazalara qayıt
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
          <p className="text-sm text-gray-500">
            {store.city ?? ""} {store.address ? `· ${store.address}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs ${
            store.active
              ? "bg-emerald-100 text-emerald-700"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          {store.active ? "Aktiv" : "Deaktiv"}
        </span>
      </div>

      <div className="mt-5">
        <StatCards
          stats={[
            { label: "Sifariş", value: String(agg._count) },
            { label: "Dövriyyə", value: formatPrice(agg._sum.total ?? 0) },
            {
              label: `Komissiya (${(store.commissionRate * 100).toFixed(0)}%)`,
              value: formatPrice(agg._sum.commissionAmount ?? 0),
            },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <QrCard baseUrl={baseUrl} slug={store.slug} />

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            Mağaza adminləri
          </h2>
          {store.users.length === 0 ? (
            <p className="text-sm text-gray-400">
              Hələ admin təyin olunmayıb. Admin olmadan mağaza öz panelinə
              girə bilməz.
            </p>
          ) : (
            <ul className="space-y-2">
              {store.users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {u.name ?? u.email}
                    </p>
                    <p className="truncate text-xs text-gray-500">{u.email}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${
                      u.active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {u.active ? "Aktiv" : "Deaktiv"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <AddAdminForm storeId={store.id} />
        </div>
      </div>

      <h2 className="mb-3 mt-6 text-sm font-semibold text-gray-900">
        Son sifarişlər
      </h2>
      <OrderList
        orders={store.orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          storeName: o.store.name,
          phoneModelName: o.phoneModel.name,
          total: o.total,
          commissionAmount: o.commissionAmount,
          status: o.status,
          createdAt: o.createdAt,
        }))}
        basePath="/admin/orders"
        showStore={false}
        emptyText="Bu mağazadan hələ sifariş gəlməyib."
      />
    </div>
  );
}
