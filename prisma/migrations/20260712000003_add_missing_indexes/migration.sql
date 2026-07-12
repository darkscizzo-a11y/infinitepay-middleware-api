-- Add missing indexes for performance

-- Customers: index on email and document for findOrCreate lookups
CREATE INDEX IF NOT EXISTS customers_email_idx ON "customers" ("email");
CREATE INDEX IF NOT EXISTS customers_document_idx ON "customers" ("document");

-- Subscriptions: index on plan_id and customer_id for join and filter queries
CREATE INDEX IF NOT EXISTS subscriptions_plan_id_idx ON "subscriptions" ("plan_id");
CREATE INDEX IF NOT EXISTS subscriptions_customer_id_idx ON "subscriptions" ("customer_id");
