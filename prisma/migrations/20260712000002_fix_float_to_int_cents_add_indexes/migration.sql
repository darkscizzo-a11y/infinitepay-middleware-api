-- Convert amount fields from Float to Int (cents)
-- Multiply existing values by 100 to convert from decimal to cents
-- Cents may already be stored (from dashboard), so we round and cast

-- Checkout.amount
ALTER TABLE "checkouts" ALTER COLUMN "amount" TYPE INTEGER USING ROUND(amount)::int;

-- CheckoutItem.price
ALTER TABLE "checkout_items" ALTER COLUMN "price" TYPE INTEGER USING ROUND(price)::int;

-- Payment.amount
ALTER TABLE "payments" ALTER COLUMN "amount" TYPE INTEGER USING ROUND(amount)::int;

-- RecurrencePlan.amount
ALTER TABLE "recurrence_plans" ALTER COLUMN "amount" TYPE INTEGER USING ROUND(amount)::int;

-- SubscriptionInvoice.amount
ALTER TABLE "subscription_invoices" ALTER COLUMN "amount" TYPE INTEGER USING ROUND(amount)::int;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS "checkouts_customer_id_idx" ON "checkouts"("customer_id");
CREATE INDEX IF NOT EXISTS "payments_checkout_id_idx" ON "payments"("checkout_id");
CREATE INDEX IF NOT EXISTS "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");
CREATE INDEX IF NOT EXISTS "subscriptions_customer_id_idx" ON "subscriptions"("customer_id");
CREATE INDEX IF NOT EXISTS "subscription_invoices_subscription_id_idx" ON "subscription_invoices"("subscription_id");
