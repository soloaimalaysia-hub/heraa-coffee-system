-- Fix 1: 过期兑换码自动退款 RPC
-- Fix 2: Voucher 优惠券系统（表 + RPC）
-- Fix 3: Event 注册 RPC 内部 normalize phone
-- Fix 4: Garden day 30 → 自动发 voucher
-- Applied: 2026-07-17

-- ============================================
-- Fix 1: 过期兑换码自动退款
-- ============================================

create or replace function heraa_expire_redemption(
  p_redemption_id uuid
)
returns json
language plpgsql security definer as $$
declare
  v_redemption heraa_redemptions%rowtype;
begin
  select * into v_redemption
  from heraa_redemptions
  where id = p_redemption_id
    and status = 'pending'
    and expires_at < now();

  if not found then
    return json_build_object('refunded', false);
  end if;

  update heraa_redemptions
  set status = 'expired'
  where id = p_redemption_id
    and status = 'pending';

  if not found then
    return json_build_object('refunded', false);
  end if;

  if v_redemption.amount > 0 then
    update heraa_wallets
    set balance = balance + v_redemption.amount,
        updated_at = now()
    where member_id = v_redemption.member_id;

    insert into heraa_transactions
      (member_id, redemption_id, amount, type, description)
    values (
      v_redemption.member_id,
      p_redemption_id,
      v_redemption.amount,
      'credit',
      '兑换码过期退款 · Refund (code expired)'
    );
  end if;

  return json_build_object('refunded', true, 'amount', v_redemption.amount);
end;
$$;

create or replace function heraa_check_expired_redemptions(
  p_member_id uuid
)
returns json
language plpgsql security definer as $$
declare
  v_row heraa_redemptions%rowtype;
  v_count int := 0;
  v_total numeric := 0;
begin
  for v_row in
    select * from heraa_redemptions
    where member_id = p_member_id
      and status = 'pending'
      and expires_at < now()
  loop
    update heraa_redemptions
    set status = 'expired'
    where id = v_row.id and status = 'pending';

    if found and v_row.amount > 0 then
      update heraa_wallets
      set balance = balance + v_row.amount,
          updated_at = now()
      where member_id = v_row.member_id;

      insert into heraa_transactions
        (member_id, redemption_id, amount, type, description)
      values (
        v_row.member_id,
        v_row.id,
        v_row.amount,
        'credit',
        '兑换码过期退款 · Refund (code expired)'
      );

      v_count := v_count + 1;
      v_total := v_total + v_row.amount;
    end if;
  end loop;

  return json_build_object('expired_count', v_count, 'refunded_total', v_total);
end;
$$;

-- ============================================
-- Fix 2: Voucher 优惠券系统
-- ============================================

create table if not exists heraa_vouchers (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references heraa_members(id),
  code text unique not null default upper(substring(gen_random_uuid()::text, 1, 8)),
  type text not null,
  title_zh text,
  title_en text,
  description_zh text,
  description_en text,
  value numeric default 0,
  status text default 'active',
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz default now()
);

alter table heraa_vouchers enable row level security;

create or replace function heraa_get_my_vouchers(p_member_id uuid)
returns setof heraa_vouchers
language sql security definer as $$
  select * from heraa_vouchers
  where member_id = p_member_id
  order by created_at desc;
$$;

create or replace function heraa_grant_welcome_voucher(p_member_id uuid)
returns void
language plpgsql security definer as $$
begin
  if exists (
    select 1 from heraa_vouchers
    where member_id = p_member_id and type = 'welcome'
  ) then return; end if;

  insert into heraa_vouchers (
    member_id, type,
    title_zh, title_en,
    description_zh, description_en,
    value, expires_at
  ) values (
    p_member_id, 'welcome',
    '新会员欢迎券', 'Welcome Voucher',
    '首次消费减 RM2', 'RM2 off your first purchase',
    2.00,
    now() + interval '30 days'
  );
end;
$$;

-- ============================================
-- Fix 4: Garden day 30 → 自动发 voucher
-- (heraa_water_plant 已升级)
-- ============================================

-- ============================================
-- Fix 3: Event 注册 RPC 内部 normalize phone
-- (heraa_event_register 已升级)
-- ============================================
