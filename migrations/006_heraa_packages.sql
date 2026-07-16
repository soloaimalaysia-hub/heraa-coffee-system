-- Heraa Packages table
create table heraa_packages (
  id uuid primary key default gen_random_uuid(),
  name_zh text not null,
  name_en text not null,
  price_rm numeric not null,
  credits int not null,
  bonus_credits int default 0,
  validity_days int default 30,
  description_zh text,
  description_en text,
  is_popular boolean default false,
  is_available boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table heraa_packages enable row level security;
create policy "anyone can read packages"
  on heraa_packages for select using (true);

insert into heraa_packages
  (name_zh, name_en, price_rm, credits, bonus_credits, validity_days, is_popular, sort_order)
values
  ('入门配套', 'Starter Pass', 29, 5, 0, 30, false, 1),
  ('咖啡爱好者', 'Coffee Lover Pass', 49, 10, 2, 30, true, 2),
  ('每日配套', 'Daily Coffee Pass', 99, 30, 0, 30, false, 3),
  ('抹茶配套', 'Matcha Pass', 59, 8, 0, 30, false, 4);
