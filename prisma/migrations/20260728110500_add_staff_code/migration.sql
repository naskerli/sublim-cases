-- Stendin arxa (satıcı) kodu. Nullable: mövcud sətirlər sonra doldurulur.
-- Postgres-də NULL dəyərlər unique məhdudiyyətini pozmur.
ALTER TABLE "QrCode" ADD COLUMN "staffCode" TEXT;

CREATE UNIQUE INDEX "QrCode_staffCode_key" ON "QrCode"("staffCode");
