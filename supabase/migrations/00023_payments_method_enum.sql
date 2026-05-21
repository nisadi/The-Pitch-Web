-- Strict payment_method enum (card | cash) + column for legacy/unknown values

alter table public.payments
  add column if not exists payment_method_other text;

comment on column public.payments.payment_method_other is
  'Original or non-standard method label when payment_method is card/cash but more detail is needed, or legacy value preserved on migration.';

-- Preserve non-enum values in payment_method_other before tightening payment_method
update public.payments
set
  payment_method_other = case
    when lower(trim(coalesce(payment_method, ''))) in ('card', 'cash')
      then payment_method_other
    else coalesce(
      payment_method_other,
      nullif(trim(payment_method), '')
    )
  end,
  payment_method = case
    when lower(trim(coalesce(payment_method, ''))) = 'cash' then 'cash'
    when lower(trim(coalesce(payment_method, ''))) = 'card' then 'card'
    when lower(trim(payment_method)) like '%cash%' then 'cash'
    when payment_method is null or trim(payment_method) = '' then 'card'
    else 'card'
  end;

alter table public.payments
  alter column payment_method set default 'card';

alter table public.payments
  drop constraint if exists payments_payment_method_check;

alter table public.payments
  add constraint payments_payment_method_check
  check (payment_method in ('card', 'cash'));
