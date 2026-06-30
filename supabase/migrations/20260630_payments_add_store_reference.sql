-- Migration: add store_reference column to payments
-- 
-- Previously, transaction_id stored the merchant-provided order number.
-- Now:
--   transaction_id  = WebXPay's own transaction reference (webxOrderReference) — used for refunds
--   store_reference = the merchant-provided order number (merchantProvidedOrderNumber / orderNumber)
--
-- Run this once against your Supabase project.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS store_reference TEXT;

COMMENT ON COLUMN payments.transaction_id IS
  'WebXPay transaction reference (webxOrderReference) — required for refund API calls';

COMMENT ON COLUMN payments.store_reference IS
  'Merchant-provided order number (merchantProvidedOrderNumber) returned by WebXPay';
