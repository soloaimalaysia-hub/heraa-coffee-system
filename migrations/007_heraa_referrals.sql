-- Referrals table
create table heraa_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references heraa_members(id),
  referee_id uuid references heraa_members(id),
  referral_code text not null,
  status text default 'pending',
  reward_given boolean default false,
  created_at timestamptz default now()
);

alter table heraa_referrals enable row level security;
create policy "members read own referrals" on heraa_referrals
  for select using (true);

-- Add referral_code to heraa_members
alter table heraa_members
  add column if not exists referral_code text unique
  default upper(substring(encode(gen_random_bytes(4),'hex'), 1, 6));

-- Backfill existing members
update heraa_members
set referral_code = upper(substring(encode(gen_random_bytes(4),'hex'), 1, 6))
where referral_code is null;

-- Referral claim RPC
create or replace function heraa_claim_referral(
  p_referee_id uuid,
  p_referral_code text
)
returns json
language plpgsql security definer as $$
declare
  v_referrer heraa_members%rowtype;
  v_already_referred boolean;
begin
  select * into v_referrer
  from heraa_members
  where referral_code = upper(p_referral_code)
  limit 1;

  if not found then
    return json_build_object('success', false, 'error', 'Invalid referral code');
  end if;

  if v_referrer.id = p_referee_id then
    return json_build_object('success', false, 'error', 'Cannot use your own code');
  end if;

  select exists(
    select 1 from heraa_referrals where referee_id = p_referee_id
  ) into v_already_referred;

  if v_already_referred then
    return json_build_object('success', false, 'error', 'Already used a referral code');
  end if;

  insert into heraa_referrals
    (referrer_id, referee_id, referral_code, status)
  values
    (v_referrer.id, p_referee_id, upper(p_referral_code), 'completed');

  update heraa_wallets
  set balance = balance + 1, updated_at = now()
  where member_id = v_referrer.id;

  update heraa_wallets
  set balance = balance + 1, updated_at = now()
  where member_id = p_referee_id;

  insert into heraa_transactions
    (member_id, amount, type, description)
  values
    (v_referrer.id, 1, 'credit', '推荐好友奖励'),
    (p_referee_id, 1, 'credit', '新会员注册奖励');

  return json_build_object('success', true, 'referrer_name', v_referrer.name);
end;
$$;

-- Referral stats RPC
create or replace function heraa_get_referral_stats(p_member_id uuid)
returns json
language plpgsql security definer as $$
declare
  v_count int;
begin
  select count(*)
  into v_count
  from heraa_referrals
  where referrer_id = p_member_id and status = 'completed';

  return json_build_object(
    'referral_count', v_count,
    'total_reward', v_count
  );
end;
$$;
