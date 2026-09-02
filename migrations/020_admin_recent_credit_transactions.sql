-- 020: RPC for Admin to read recent Credits orders (heraa_package_transactions
-- is intentionally RLS-locked with no public policy, so the frontend cannot
-- query it directly via anon key — needs a SECURITY DEFINER RPC like every
-- other admin-facing read of a locked table).

create or replace function heraa_admin_recent_credit_transactions(p_limit int default 20)
returns json
language plpgsql
security definer
as $$
declare
  v_result json;
begin
  select json_agg(row_to_json(t)) into v_result
  from (
    select
      pt.id,
      pt.credits_used,
      pt.status,
      pt.created_at,
      m.name as member_name,
      coalesce(p.name_zh, p.name_en) as drink_name
    from heraa_package_transactions pt
    join heraa_members m on m.id = pt.member_id
    join heraa_products p on p.id = pt.product_id
    order by pt.created_at desc
    limit p_limit
  ) t;

  return coalesce(v_result, '[]'::json);
end;
$$;
