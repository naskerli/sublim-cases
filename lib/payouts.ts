import { prisma } from "./prisma";
import { OrderStatus } from "./constants";

// Mağazaya nağd ödəniş bu həddə çatanda edilir.
export const PAYOUT_THRESHOLD = 50;

// Komissiya hansı sifarişlərdən hesablanır:
// ləğv edilməmiş və hələ heç bir ödənişlə bağlanmamış sifarişlər.
// Ləğv edilən sifariş üçün pul geri qaytarılır — komissiya da yaranmır.
export const payableWhere = {
  status: { not: OrderStatus.CANCELLED },
  payoutId: null,
};

export type StoreBalance = {
  storeId: string;
  storeName: string;
  commissionRate: number;
  pending: number; // ödənilməmiş komissiya
  orderCount: number; // həmin komissiyanı yaradan sifariş sayı
  paidTotal: number; // indiyədək ödənilmiş cəm
  ready: boolean; // hədd keçilibmi
};

// Bütün mağazalar üzrə cari borc mənzərəsi.
export async function getStoreBalances(): Promise<StoreBalance[]> {
  const [stores, pendingGroups, paidGroups] = await Promise.all([
    prisma.store.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, commissionRate: true },
    }),
    prisma.order.groupBy({
      by: ["storeId"],
      where: payableWhere,
      _sum: { commissionAmount: true },
      _count: true,
    }),
    prisma.payout.groupBy({
      by: ["storeId"],
      _sum: { amount: true },
    }),
  ]);

  const pendingMap = new Map(
    pendingGroups.map((g) => [
      g.storeId,
      { sum: g._sum.commissionAmount ?? 0, count: g._count },
    ]),
  );
  const paidMap = new Map(
    paidGroups.map((g) => [g.storeId, g._sum.amount ?? 0]),
  );

  return stores.map((s) => {
    const p = pendingMap.get(s.id);
    const pending = round2(p?.sum ?? 0);
    return {
      storeId: s.id,
      storeName: s.name,
      commissionRate: s.commissionRate,
      pending,
      orderCount: p?.count ?? 0,
      paidTotal: round2(paidMap.get(s.id) ?? 0),
      ready: pending >= PAYOUT_THRESHOLD,
    };
  });
}

// Tək mağazanın ödənilməmiş komissiyası.
export async function getPendingForStore(
  storeId: string,
): Promise<{ pending: number; orderCount: number }> {
  const agg = await prisma.order.aggregate({
    where: { ...payableWhere, storeId },
    _sum: { commissionAmount: true },
    _count: true,
  });
  return {
    pending: round2(agg._sum.commissionAmount ?? 0),
    orderCount: agg._count,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
