-- Fable 5 压力测试修复（2026-07-16）

-- Fix: 防并发双花（原版 check-then-update 有 race window 可导致负余额）
create or replace function heraa_generate_redemption(
  p_member_id uuid,
  p_drink_name text,
  p_amount numeric
)
returns heraa_redemptions
language plpgsql security definer as $$
declare
  v_redemption heraa_redemptions;
begin
  -- 原子扣款：balance >= amount 才扣，并发时只有一个成功
  update heraa_wallets
  set balance = balance - p_amount,
      updated_at = now()
  where member_id = p_member_id
    and balance >= p_amount;

  if not found then
    if not exists (select 1 from heraa_wallets where member_id = p_member_id) then
      raise exception 'Wallet not found';
    end if;
    raise exception '余额不足';
  end if;

  insert into heraa_redemptions (member_id, drink_name, amount)
  values (p_member_id, p_drink_name, p_amount)
  returning * into v_redemption;

  insert into heraa_transactions (member_id, redemption_id, amount, type, description)
  values (p_member_id, v_redemption.id, p_amount, 'debit', p_drink_name);

  return v_redemption;
end;
$$;

-- Fix: qr_code 唯一约束（防碰撞）
create unique index if not exists heraa_redemptions_qr_code_key
  on heraa_redemptions (qr_code);
