-- CreateTable
CREATE TABLE "provider_token_wallet" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 40,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_token_wallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provider_token_wallet_provider_id_key" ON "provider_token_wallet"("provider_id");

-- AddForeignKey
ALTER TABLE "provider_token_wallet" ADD CONSTRAINT "provider_token_wallet_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing providers with the monthly starter balance.
INSERT INTO "provider_token_wallet" ("id", "provider_id", "balance", "created_at", "updated_at")
SELECT gen_random_uuid(), p."id", 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "providers" p
WHERE NOT EXISTS (
  SELECT 1 FROM "provider_token_wallet" w WHERE w."provider_id" = p."id"
);
