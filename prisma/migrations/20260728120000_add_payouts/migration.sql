-- Mağazaya ödənilən komissiya hesablaşmaları
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'CASH',
    "note" TEXT,
    "recordedBy" TEXT,
    "recordedByEmail" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- Sifariş hansı ödənişlə bağlanıb (null = hələ ödənilməyib)
ALTER TABLE "Order" ADD COLUMN "payoutId" TEXT;

CREATE INDEX "Payout_storeId_idx" ON "Payout"("storeId");
CREATE INDEX "Order_payoutId_idx" ON "Order"("payoutId");

ALTER TABLE "Payout" ADD CONSTRAINT "Payout_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_payoutId_fkey"
  FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
