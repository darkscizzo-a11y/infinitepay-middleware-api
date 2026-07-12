-- CreateTable
CREATE TABLE "gateway_configs" (
    "id" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret" TEXT NOT NULL,
    "webhook_secret" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gateway_configs_pkey" PRIMARY KEY ("id")
);
