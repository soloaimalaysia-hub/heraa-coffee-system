-- 012_corporate_membership.sql
-- 企业福利分层：heraa_companies + members改造 + allowance_logs

-- ① 企业表
create table heraa_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  logo_url text,
  allowance_amount numeric default 0,
  allowance_cycle text default 'monthly',
  allowance_reset_day int default 1,
  allowance_accumulate boolean default true,
  requires_staff_id boolean default true,
  is_active boolean default true,
  contract_end_date date,
  created_at timestamptz default now()
);

alter table heraa_companies enable row level security;
create policy "anyone can read active companies"
  on heraa_companies for select
  using (is_active = true);

insert into heraa_companies
  (name, code, allowance_amount, allowance_cycle,
   allowance_reset_day, allowance_accumulate, requires_staff_id)
values
  ('Genting Highlands', 'genting', 20.00, 'monthly', 1, true, true);

-- ② heraa_members 改造
alter table heraa_members
  add column if not exists company_id uuid references heraa_companies(id);
alter table heraa_members
  add column if not exists member_type text default 'public';

-- ③ heraa_wallets 改造
alter table heraa_wallets
  add column if not exists allowance_last_reset timestamptz;

-- ④ 津贴发放记录
create table heraa_allowance_logs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references heraa_members(id),
  company_id uuid references heraa_companies(id),
  amount numeric not null,
  cycle_date date not null,
  created_at timestamptz default now(),
  unique(member_id, cycle_date)
);

alter table heraa_allowance_logs enable row level security;
