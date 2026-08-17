-- 016: Package/Credits vending system
-- Reuses existing heraa_packages (catalog), adds machines/products/member
-- packages/transactions. Does NOT touch heraa_wallets/heraa_transactions —
-- this is a parallel Credits ledger, not RM balance.

-- 1. Extend heraa_packages with optional limited-time availability window
alter table heraa_packages add column if not exists valid_from timestamptz;
alter table heraa_packages add column if not exists valid_until timestamptz;

-- 2. Vending machines (needed for scan/verify + locator; not explicitly
--    listed in the contract but required for /machine/[id]/scan and
--    /machine-locator to have real data to check against)
create table heraa_machines (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  address text,
  lat numeric,
  lng numeric,
  is_online boolean default true,
  created_at timestamptz default now()
);
alter table heraa_machines enable row level security;
create policy "anyone can read machines" on heraa_machines for select using (true);

insert into heraa_machines (code, name, address, is_online) values
  ('MCH001', 'MCH001 - KPJ Kuching', 'Lot 123, KPJ Kuching Specialist Hospital, Kuching, Sarawak', true);

-- 3. Products (drinks), admin-managed
create table heraa_products (
  id uuid primary key default gen_random_uuid(),
  name_zh text not null,
  name_en text not null,
  image_url text,
  credits_cost int not null default 1,
  category text default 'coffee',
  is_available boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table heraa_products enable row level security;
create policy "anyone can read products" on heraa_products for select using (true);

insert into heraa_products (name_zh, name_en, credits_cost, category, sort_order) values
  ('美式咖啡', 'Americano', 1, 'coffee', 1),
  ('拿铁', 'Latte', 1, 'coffee', 2),
  ('卡布奇诺', 'Cappuccino', 1, 'coffee', 3),
  ('抹茶拿铁', 'Matcha Latte', 1, 'matcha', 4),
  ('抹茶咖啡', 'Matcha Coffee', 1, 'matcha', 5),
  ('摩卡', 'Mocha', 1, 'coffee', 6);

-- 4. Member's purchased packages (Credits balance + expiry per purchase)
create table heraa_member_packages (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references heraa_members(id) not null,
  package_id uuid references heraa_packages(id) not null,
  credits_total int not null,
  credits_remaining int not null,
  purchased_at timestamptz default now(),
  expires_at timestamptz not null,
  status text default 'active' -- active | expired | depleted
);
alter table heraa_member_packages enable row level security;
create index heraa_member_packages_member_idx on heraa_member_packages(member_id);

-- 5. Credit-redemption transaction log (one row per drink dispensed)
create table heraa_package_transactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references heraa_members(id) not null,
  member_package_id uuid references heraa_member_packages(id) not null,
  product_id uuid references heraa_products(id) not null,
  machine_id uuid references heraa_machines(id) not null,
  credits_used int not null,
  status text default 'success', -- success | failed
  created_at timestamptz default now()
);
alter table heraa_package_transactions enable row level security;
create index heraa_package_transactions_member_idx on heraa_package_transactions(member_id);

-- ===== RPCs =====

-- Buy a package: no RM payment processing (no gateway in this system yet,
-- consistent with the rest of the demo-stage flows) — just creates the
-- Credits ledger entry. Package price display is informational only.
create or replace function heraa_purchase_package(p_member_id uuid, p_package_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_pkg heraa_packages%rowtype;
  v_total_credits int;
  v_mp_id uuid;
begin
  select * into v_pkg from heraa_packages where id = p_package_id and is_available;
  if not found then
    return json_build_object('success', false, 'error', '配套不存在或已下架');
  end if;

  if v_pkg.valid_from is not null and now() < v_pkg.valid_from then
    return json_build_object('success', false, 'error', '配套尚未开放购买');
  end if;
  if v_pkg.valid_until is not null and now() > v_pkg.valid_until then
    return json_build_object('success', false, 'error', '配套已过期');
  end if;

  v_total_credits := v_pkg.credits + coalesce(v_pkg.bonus_credits, 0);

  insert into heraa_member_packages
    (member_id, package_id, credits_total, credits_remaining, expires_at)
  values
    (p_member_id, p_package_id, v_total_credits, v_total_credits, now() + (v_pkg.validity_days || ' days')::interval)
  returning id into v_mp_id;

  return json_build_object('success', true, 'member_package_id', v_mp_id, 'credits_total', v_total_credits);
end;
$$;

-- Verify a machine by scanned/typed code
create or replace function heraa_verify_machine(p_code text)
returns json
language plpgsql
security definer
as $$
declare
  v_m heraa_machines%rowtype;
begin
  select * into v_m from heraa_machines where upper(code) = upper(p_code);
  if not found then
    return json_build_object('success', false, 'error', '找不到这台机器，请检查编号');
  end if;
  if not v_m.is_online then
    return json_build_object('success', false, 'error', '这台机器目前离线，请换一台');
  end if;
  return json_build_object('success', true, 'machine_id', v_m.id, 'name', v_m.name, 'address', v_m.address);
end;
$$;

-- Member's current total Credits across all active, non-expired packages
create or replace function heraa_get_member_credits(p_member_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_total int;
begin
  select coalesce(sum(credits_remaining), 0) into v_total
  from heraa_member_packages
  where member_id = p_member_id
    and status = 'active'
    and expires_at > now()
    and credits_remaining > 0;

  return json_build_object('success', true, 'credits_remaining', v_total);
end;
$$;

-- Order a drink: deduct credits from the soonest-expiring valid package (FIFO by expiry)
create or replace function heraa_redeem_credit(p_member_id uuid, p_machine_id uuid, p_product_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_product heraa_products%rowtype;
  v_mp heraa_member_packages%rowtype;
  v_tx_id uuid;
begin
  select * into v_product from heraa_products where id = p_product_id and is_available;
  if not found then
    return json_build_object('success', false, 'error', '产品不存在或已下架');
  end if;

  select * into v_mp
  from heraa_member_packages
  where member_id = p_member_id
    and status = 'active'
    and expires_at > now()
    and credits_remaining >= v_product.credits_cost
  order by expires_at asc
  limit 1
  for update;

  if not found then
    return json_build_object('success', false, 'error', 'Credits 不足或已过期，请先购买配套');
  end if;

  update heraa_member_packages
  set credits_remaining = credits_remaining - v_product.credits_cost,
      status = case when credits_remaining - v_product.credits_cost <= 0 then 'depleted' else status end
  where id = v_mp.id;

  insert into heraa_package_transactions
    (member_id, member_package_id, product_id, machine_id, credits_used, status)
  values
    (p_member_id, v_mp.id, p_product_id, p_machine_id, v_product.credits_cost, 'success')
  returning id into v_tx_id;

  return json_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'credits_used', v_product.credits_cost,
    'credits_remaining_total', (select coalesce(sum(credits_remaining),0) from heraa_member_packages
      where member_id = p_member_id and status = 'active' and expires_at > now())
  );
end;
$$;
