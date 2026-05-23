-- =========================================
-- REMOVE OLD SINGLE ADDRESS COLUMNS
-- =========================================

ALTER TABLE "public"."storefront_customers"
DROP COLUMN IF EXISTS "shipping_address";

ALTER TABLE "public"."storefront_customers"
DROP COLUMN IF EXISTS "shipping_lat";

ALTER TABLE "public"."storefront_customers"
DROP COLUMN IF EXISTS "shipping_lng";


-- =========================================
-- DROP OLD INDEX
-- =========================================

DROP INDEX IF EXISTS "idx_storefront_customers_shipping_coords";


-- =========================================
-- CREATE CUSTOMER ADDRESSES TABLE
-- =========================================

CREATE TABLE "public"."customer_addresses" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),

  "customer_id" UUID NOT NULL,

  -- Label alamat
  -- Contoh: Rumah, Kantor, Gudang
  "label" VARCHAR(50) NULL,

  -- Data penerima
  "recipient_name" VARCHAR(255) NOT NULL,
  "recipient_phone" VARCHAR(20) NOT NULL,

  -- Alamat lengkap
  "address" TEXT NOT NULL,

  -- Regional
  "province" VARCHAR(100) NULL,
  "city" VARCHAR(100) NULL,
  "district" VARCHAR(100) NULL,
  "postal_code" VARCHAR(20) NULL,

  -- Koordinat maps
  "lat" DOUBLE PRECISION NULL,
  "lng" DOUBLE PRECISION NULL,

  -- Default address
  "is_default" BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  CONSTRAINT "customer_addresses_pkey"
    PRIMARY KEY ("id"),

  CONSTRAINT "customer_addresses_customer_id_fkey"
    FOREIGN KEY ("customer_id")
    REFERENCES "public"."storefront_customers"("id")
    ON DELETE CASCADE
);


-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX "idx_customer_addresses_customer_id"
ON "public"."customer_addresses" ("customer_id");


CREATE INDEX "idx_customer_addresses_coords"
ON "public"."customer_addresses" (
  "lat",
  "lng"
);


CREATE INDEX "idx_customer_addresses_is_default"
ON "public"."customer_addresses" (
  "customer_id",
  "is_default"
);


-- =========================================
-- OPTIONAL:
-- ENSURE ONLY ONE DEFAULT ADDRESS PER CUSTOMER
-- =========================================

CREATE UNIQUE INDEX "uniq_customer_default_address"
ON "public"."customer_addresses" ("customer_id")
WHERE "is_default" = true;