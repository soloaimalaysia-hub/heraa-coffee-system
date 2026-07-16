-- 活动表
create table heraa_events_list (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  location text,
  free_drink text default 'any',
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table heraa_events_list enable row level security;
create policy "anyone can read events" on heraa_events_list for select using (true);

-- 插入第一个活动（Benny的展览会）
insert into heraa_events_list (name, date, location, free_drink)
values ('Heraa Coffee Roadshow', '2026-07-20', 'Vending Machine Exhibition KL', 'any');

-- 活动注册表
create table heraa_event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references heraa_events_list(id),
  member_id uuid references heraa_members(id),
  name text not null,
  phone text not null,
  area text not null,
  flavor_preferences text[] not null default '{}',
  redemption_id uuid references heraa_redemptions(id),
  created_at timestamptz default now(),
  unique(event_id, phone)
);

alter table heraa_event_registrations enable row level security;
create policy "event registration insert" on heraa_event_registrations for insert with check (true);
create policy "event registration read" on heraa_event_registrations for select using (true);

-- 开启 Realtime（大屏幕用）
alter publication supabase_realtime add table heraa_event_registrations;

-- 在 heraa_members 加 flavor_preferences 和 area 列
alter table heraa_members add column if not exists flavor_preferences text[] default '{}';
alter table heraa_members add column if not exists area text;

-- Event 注册 RPC
create or replace function heraa_event_register(
  p_event_id uuid,
  p_name text,
  p_phone text,
  p_area text,
  p_flavors text[]
)
returns json
language plpgsql security definer as $$
declare
  v_member_id uuid;
  v_redemption heraa_redemptions%rowtype;
  v_event heraa_events_list%rowtype;
  v_already boolean;
begin
  select * into v_event
  from heraa_events_list
  where id = p_event_id and is_active = true;

  if not found then
    return json_build_object('success', false, 'error', '活动不存在或已结束');
  end if;

  select exists(
    select 1 from heraa_event_registrations
    where event_id = p_event_id and phone = p_phone
  ) into v_already;

  if v_already then
    return json_build_object('success', false, 'error', '你已经注册过这个活动了');
  end if;

  select id into v_member_id
  from heraa_members where phone = p_phone limit 1;

  if v_member_id is null then
    insert into heraa_members (name, phone, company, staff_id, flavor_preferences, area)
    values (p_name, p_phone, 'Event', 'EVENT', p_flavors, p_area)
    returning id into v_member_id;

    insert into heraa_wallets (member_id, balance, monthly_allowance)
    values (v_member_id, 0, 0);
  else
    update heraa_members
    set flavor_preferences = p_flavors, area = p_area
    where id = v_member_id;
  end if;

  insert into heraa_redemptions (member_id, drink_name, amount, status, expires_at)
  values (
    v_member_id,
    case when v_event.free_drink = 'any' then '活动免费饮品' else v_event.free_drink end,
    0,
    'pending',
    now() + interval '4 hours'
  )
  returning * into v_redemption;

  insert into heraa_event_registrations (event_id, member_id, name, phone, area, flavor_preferences, redemption_id)
  values (p_event_id, v_member_id, p_name, p_phone, p_area, p_flavors, v_redemption.id);

  return json_build_object(
    'success', true,
    'member_id', v_member_id,
    'qr_code', v_redemption.qr_code,
    'redemption_id', v_redemption.id,
    'expires_at', v_redemption.expires_at,
    'drink_name', v_redemption.drink_name
  );
end;
$$;

-- Event Analytics RPC
create or replace function heraa_event_analytics(p_event_id uuid)
returns json
language plpgsql security definer as $$
declare
  v_total int;
  v_redeemed int;
  v_flavors json;
  v_areas json;
  v_hourly json;
begin
  select count(*) into v_total
  from heraa_event_registrations where event_id = p_event_id;

  select count(*) into v_redeemed
  from heraa_event_registrations er
  join heraa_redemptions r on r.id = er.redemption_id
  where er.event_id = p_event_id and r.status = 'used';

  select json_agg(row_to_json(t)) into v_flavors from (
    select flavor, count(*) as cnt
    from heraa_event_registrations, unnest(flavor_preferences) as flavor
    where event_id = p_event_id
    group by flavor order by cnt desc
  ) t;

  select json_agg(row_to_json(t)) into v_areas from (
    select area, count(*) as cnt
    from heraa_event_registrations
    where event_id = p_event_id
    group by area order by cnt desc
  ) t;

  select json_agg(row_to_json(t)) into v_hourly from (
    select extract(hour from created_at) as hour, count(*) as cnt
    from heraa_event_registrations
    where event_id = p_event_id
      and created_at::date = current_date
    group by hour order by hour
  ) t;

  return json_build_object(
    'total_registrations', v_total,
    'total_redeemed', v_redeemed,
    'redemption_rate', case when v_total > 0 then round(v_redeemed::numeric / v_total * 100, 1) else 0 end,
    'flavor_breakdown', coalesce(v_flavors, '[]'::json),
    'area_breakdown', coalesce(v_areas, '[]'::json),
    'registrations_by_hour', coalesce(v_hourly, '[]'::json)
  );
end;
$$;
