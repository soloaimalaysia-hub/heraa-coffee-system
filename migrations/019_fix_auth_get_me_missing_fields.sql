-- 019: heraa_auth_get_me was hand-built and silently dropped referral_code,
-- member_type, company_id from the member object, and never returned
-- company_info at all. Data was always correct (referral_code has a DB
-- default) — this was purely an API-layer field-list bug.

CREATE OR REPLACE FUNCTION public.heraa_auth_get_me(p_session_token text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_session heraa_sessions;
  v_member heraa_members;
  v_wallet heraa_wallets;
  v_company heraa_companies;
begin
  select * into v_session from heraa_sessions where session_token = p_session_token;

  if v_session is null then
    return json_build_object('success', false, 'error', 'Invalid session');
  end if;
  if v_session.expires_at < now() then
    return json_build_object('success', false, 'error', 'Session expired');
  end if;

  select * into v_member from heraa_members where id = v_session.member_id;
  select * into v_wallet from heraa_wallets where member_id = v_session.member_id;

  if v_member.company_id is not null then
    select * into v_company from heraa_companies where id = v_member.company_id;
  end if;

  return json_build_object(
    'success', true,
    'member', json_build_object(
      'id', v_member.id,
      'name', v_member.name,
      'phone', v_member.phone,
      'company', v_member.company,
      'staff_id', v_member.staff_id,
      'referral_code', v_member.referral_code,
      'member_type', v_member.member_type,
      'company_id', v_member.company_id
    ),
    'wallet', json_build_object(
      'balance', v_wallet.balance,
      'monthly_allowance', v_wallet.monthly_allowance
    ),
    'company_info', case when v_company.id is not null then json_build_object(
      'name', v_company.name,
      'allowance_cycle', v_company.allowance_cycle,
      'allowance_reset_day', v_company.allowance_reset_day
    ) else null end
  );
end;
$function$;
