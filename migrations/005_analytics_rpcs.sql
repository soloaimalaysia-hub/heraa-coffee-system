-- =====================================================
-- Solo AI Empire · Analytics RPCs (Template)
-- =====================================================
-- 依赖：004_analytics_events.sql
-- 前提表：{prefix}_members, {prefix}_wallets (optional), {prefix}_transactions
-- 使用方法：全文替换 heraa_ → {your_prefix}_
-- =====================================================

-- 1. Overview KPIs
create or replace function heraa_analytics_overview(p_days int default 30)
returns json
language plpgsql security definer as $$
declare
  v_total_members int; v_new_members int; v_dau int;
  v_dau_7d_avg numeric; v_total_redemptions int; v_total_revenue numeric;
  v_app_open int; v_redeem_success int; v_conversion numeric := 0;
begin
  select count(*) into v_total_members from heraa_members where phone not like 'demo-%';
  select count(*) into v_new_members from heraa_members
    where created_at >= current_date - (p_days || ' days')::interval and phone not like 'demo-%';
  select count(distinct member_id) into v_dau from heraa_events
    where created_at >= current_date and member_id is not null;
  select coalesce(round(avg(cnt), 1), 0) into v_dau_7d_avg from (
    select count(distinct member_id) as cnt from heraa_events
    where created_at >= current_date - interval '7 days' and member_id is not null
    group by date_trunc('day', created_at)
  ) t;
  select count(*), coalesce(sum(amount), 0)
    into v_total_redemptions, v_total_revenue
    from heraa_transactions
    where type = 'debit' and created_at >= current_date - (p_days || ' days')::interval;
  select count(distinct member_id) into v_app_open from heraa_events
    where event_type = 'app_open' and created_at >= current_date - (p_days || ' days')::interval;
  select count(distinct member_id) into v_redeem_success from heraa_events
    where event_type = 'redeem_success' and created_at >= current_date - (p_days || ' days')::interval;
  if v_app_open > 0 then v_conversion := round((v_redeem_success::numeric / v_app_open) * 100, 1); end if;

  return json_build_object(
    'total_members', v_total_members, 'new_members', v_new_members,
    'dau', v_dau, 'dau_7d_avg', v_dau_7d_avg,
    'total_redemptions', v_total_redemptions, 'total_revenue', v_total_revenue,
    'conversion_rate', v_conversion
  );
end;
$$;

-- 2. Daily trend
create or replace function heraa_analytics_daily(p_days int default 30)
returns json
language plpgsql security definer as $$
begin
  return coalesce((
    select json_agg(row_to_json(t) order by t.d)
    from (
      select
        d::date as d,
        (select count(*) from heraa_members where created_at::date = d::date and phone not like 'demo-%') as new_users,
        (select count(distinct member_id) from heraa_events where created_at::date = d::date and member_id is not null) as active_users,
        (select count(*) from heraa_transactions where created_at::date = d::date and type = 'debit') as redemptions,
        (select coalesce(sum(amount), 0) from heraa_transactions where created_at::date = d::date and type = 'debit') as revenue
      from generate_series(current_date - (p_days || ' days')::interval, current_date, '1 day'::interval) d
    ) t
  ), '[]'::json);
end;
$$;

-- 3. Funnel
create or replace function heraa_analytics_funnel(p_days int default 7)
returns json
language plpgsql security definer as $$
declare
  v_start timestamptz := current_date - (p_days || ' days')::interval;
  v_ao int; v_wv int; v_rc int; v_rs int;
begin
  select count(distinct member_id) into v_ao from heraa_events where event_type = 'app_open' and created_at >= v_start;
  select count(distinct member_id) into v_wv from heraa_events where event_type = 'wallet_viewed' and created_at >= v_start;
  select count(distinct member_id) into v_rc from heraa_events where event_type = 'redeem_clicked' and created_at >= v_start;
  select count(distinct member_id) into v_rs from heraa_events where event_type = 'redeem_success' and created_at >= v_start;
  return json_build_object('app_open', v_ao, 'wallet_viewed', v_wv, 'redeem_clicked', v_rc, 'redeem_success', v_rs);
end;
$$;

-- 4. Retention (cohort by first-seen date)
create or replace function heraa_analytics_retention(p_days int default 30)
returns json
language plpgsql security definer as $$
begin
  return coalesce((
    select json_agg(row_to_json(t) order by t.cohort_date desc)
    from (
      with cohorts as (
        select id as member_id, created_at::date as cohort_date from heraa_members
        where phone not like 'demo-%' and created_at >= current_date - (p_days || ' days')::interval
      ),
      cohort_sizes as (select cohort_date, count(*) as size from cohorts group by cohort_date)
      select cs.cohort_date, cs.size as cohort_size,
        round(count(distinct case when e.created_at::date = cs.cohort_date + 1 then e.member_id end)::numeric / nullif(cs.size, 0) * 100, 1) as day_1,
        round(count(distinct case when e.created_at::date = cs.cohort_date + 7 then e.member_id end)::numeric / nullif(cs.size, 0) * 100, 1) as day_7,
        round(count(distinct case when e.created_at::date = cs.cohort_date + 14 then e.member_id end)::numeric / nullif(cs.size, 0) * 100, 1) as day_14,
        round(count(distinct case when e.created_at::date = cs.cohort_date + 30 then e.member_id end)::numeric / nullif(cs.size, 0) * 100, 1) as day_30
      from cohort_sizes cs
      left join cohorts c on c.cohort_date = cs.cohort_date
      left join heraa_events e on e.member_id = c.member_id
      group by cs.cohort_date, cs.size
    ) t
  ), '[]'::json);
end;
$$;

-- 5a. Export users
create or replace function heraa_analytics_export_users(p_start date, p_end date)
returns json language plpgsql security definer as $$
begin
  return coalesce((
    select json_agg(row_to_json(t))
    from (
      select m.id, m.name, m.phone, m.company, m.staff_id, m.created_at,
        (select count(*) from heraa_transactions where member_id = m.id and type = 'debit') as total_redemptions,
        (select coalesce(sum(amount),0) from heraa_transactions where member_id = m.id and type = 'debit') as total_spent
      from heraa_members m
      where m.phone not like 'demo-%' and m.created_at::date between p_start and p_end
      order by m.created_at desc
    ) t
  ), '[]'::json);
end;
$$;

-- 5b. Export transactions
create or replace function heraa_analytics_export_transactions(p_start date, p_end date)
returns json language plpgsql security definer as $$
begin
  return coalesce((
    select json_agg(row_to_json(t))
    from (
      select tx.id, tx.created_at, tx.type, tx.amount, tx.description,
        m.name as member_name, m.phone, m.staff_id
      from heraa_transactions tx
      join heraa_members m on m.id = tx.member_id
      where tx.created_at::date between p_start and p_end and m.phone not like 'demo-%'
      order by tx.created_at desc
    ) t
  ), '[]'::json);
end;
$$;
