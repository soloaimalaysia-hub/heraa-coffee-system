-- 015: Admin password self-service + forced first-login change + owner-tier iron rule
-- documented on the table itself.

comment on table heraa_admin_users is
  'Owner-tier access only (Captain K + Benny). Do NOT add future
   programmers/staff here with "restricted" permissions — that lets
   the admin tier quietly grow. Build a separate role/table
   (e.g. heraa_staff_users or heraa_collaborator_users) for anyone
   who only needs feature access, never account access to this table.';

alter table heraa_admin_users add column if not exists must_change_password boolean default false;

-- Force Captain K to rotate the password that was necessarily shown in chat during bootstrap
update heraa_admin_users set must_change_password = true where phone = '+60169212796';

create or replace function heraa_admin_login(p_phone text, p_password text)
returns json
language plpgsql
security definer
as $$
declare
  v_admin heraa_admin_users%rowtype;
  v_clean_phone text;
  v_session_token text;
begin
  v_clean_phone := regexp_replace(p_phone, '[\s\-]', '', 'g');
  if left(v_clean_phone, 1) = '0' then
    v_clean_phone := '+6' || v_clean_phone;
  elsif left(v_clean_phone, 1) = '6' then
    v_clean_phone := '+' || v_clean_phone;
  end if;

  select * into v_admin from heraa_admin_users where phone = v_clean_phone and is_active limit 1;

  if not found or v_admin.password_hash is null then
    return json_build_object('success', false, 'error', '账号不存在或未设置密码');
  end if;

  if v_admin.password_hash != crypt(p_password, v_admin.password_hash) then
    return json_build_object('success', false, 'error', '密码错误');
  end if;

  insert into heraa_admin_sessions (admin_id) values (v_admin.id)
  returning session_token into v_session_token;

  return json_build_object(
    'success', true,
    'session_token', v_session_token,
    'name', v_admin.name,
    'must_change_password', coalesce(v_admin.must_change_password, false)
  );
end;
$$;

create or replace function heraa_admin_verify_session(p_token text)
returns json
language plpgsql
security definer
as $$
declare
  v_row record;
begin
  select s.expires_at, a.name, a.id as admin_id, coalesce(a.must_change_password, false) as must_change_password
  into v_row
  from heraa_admin_sessions s
  join heraa_admin_users a on a.id = s.admin_id
  where s.session_token = p_token and a.is_active
  limit 1;

  if not found or v_row.expires_at < now() then
    return json_build_object('valid', false);
  end if;

  return json_build_object(
    'valid', true,
    'name', v_row.name,
    'admin_id', v_row.admin_id,
    'must_change_password', v_row.must_change_password
  );
end;
$$;

create or replace function heraa_admin_change_password(
  p_token text,
  p_old_password text,
  p_new_password text
)
returns json
language plpgsql
security definer
as $$
declare
  v_admin_id uuid;
  v_hash text;
begin
  if length(p_new_password) < 6 then
    return json_build_object('success', false, 'error', '新密码最少6位');
  end if;

  select a.id, a.password_hash into v_admin_id, v_hash
  from heraa_admin_sessions s
  join heraa_admin_users a on a.id = s.admin_id
  where s.session_token = p_token and s.expires_at > now() and a.is_active
  limit 1;

  if v_admin_id is null then
    return json_build_object('success', false, 'error', '登入已过期，请重新登入');
  end if;

  if v_hash != crypt(p_old_password, v_hash) then
    return json_build_object('success', false, 'error', '当前密码不正确');
  end if;

  update heraa_admin_users
  set password_hash = crypt(p_new_password, gen_salt('bf')),
      must_change_password = false
  where id = v_admin_id;

  return json_build_object('success', true);
end;
$$;

create or replace function heraa_admin_invite(
  p_phone text,
  p_name text,
  p_temp_password text
)
returns json
language plpgsql
security definer
as $$
declare
  v_clean_phone text;
  v_id uuid;
begin
  if length(p_temp_password) < 6 then
    return json_build_object('success', false, 'error', '密码最少6位');
  end if;

  v_clean_phone := regexp_replace(p_phone, '[\s\-]', '', 'g');
  if left(v_clean_phone, 1) = '0' then
    v_clean_phone := '+6' || v_clean_phone;
  elsif left(v_clean_phone, 1) = '6' then
    v_clean_phone := '+' || v_clean_phone;
  end if;

  insert into heraa_admin_users (phone, name, password_hash, must_change_password)
  values (v_clean_phone, p_name, crypt(p_temp_password, gen_salt('bf')), true)
  on conflict (phone) do update set
    name = excluded.name,
    password_hash = excluded.password_hash,
    must_change_password = true
  returning id into v_id;

  return json_build_object('success', true, 'id', v_id);
end;
$$;
