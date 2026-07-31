-- ============================================
-- 011: Password Auth Migration
-- ============================================

-- 1. Add password fields to heraa_members
alter table heraa_members
  add column if not exists password_hash text,
  add column if not exists is_activated boolean default false;

-- 2. Set password RPC (used during activation)
create or replace function heraa_set_password(
  p_member_id uuid,
  p_password text
)
returns json
language plpgsql security definer as $$
begin
  if length(p_password) < 6 then
    return json_build_object('success', false, 'error', '密码最少6位');
  end if;

  update heraa_members
  set password_hash = crypt(p_password, gen_salt('bf')),
      is_activated = true
  where id = p_member_id;

  if not found then
    return json_build_object('success', false, 'error', '会员不存在');
  end if;

  return json_build_object('success', true);
end;
$$;

-- 3. Password login RPC
create or replace function heraa_login_password(
  p_phone text,
  p_password text
)
returns json
language plpgsql security definer as $$
declare
  v_member heraa_members%rowtype;
  v_clean_phone text;
  v_session_token text;
begin
  -- Phone normalization
  v_clean_phone := regexp_replace(p_phone, '[\s\-]', '', 'g');
  if left(v_clean_phone, 1) = '0' then
    v_clean_phone := '+6' || v_clean_phone;
  elsif left(v_clean_phone, 1) = '6' then
    v_clean_phone := '+' || v_clean_phone;
  elsif left(v_clean_phone, 2) = '+6' then
    -- already correct
  end if;

  -- Find member
  select * into v_member
  from heraa_members
  where phone = v_clean_phone
  limit 1;

  if not found then
    return json_build_object('success', false, 'error', '手机号未注册 Phone not registered');
  end if;

  -- Check activation
  if not coalesce(v_member.is_activated, false)
     or v_member.password_hash is null then
    return json_build_object('success', false,
      'error', 'not_activated',
      'member_id', v_member.id,
      'message', '账户未激活 Account not activated');
  end if;

  -- Verify password
  if v_member.password_hash != crypt(p_password, v_member.password_hash) then
    return json_build_object('success', false, 'error', '密码错误 Wrong password');
  end if;

  -- Create session
  insert into heraa_sessions (member_id)
  values (v_member.id)
  returning session_token into v_session_token;

  return json_build_object(
    'success', true,
    'session_token', v_session_token,
    'member_id', v_member.id,
    'name', v_member.name
  );
end;
$$;
