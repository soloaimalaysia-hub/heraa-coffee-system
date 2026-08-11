-- 014: Heraa Lead system — matching engine, appointment system, nurture automation
-- Extends 013_heraa_lead_system.sql. Still isolated to heraa_lead_* tables/RPCs only.

-- ===== Two-stage reminder tracking (24h + 2h before slot) =====
alter table heraa_lead_appointments add column if not exists reminder_24h_sent_at timestamptz;
alter table heraa_lead_appointments add column if not exists reminder_2h_sent_at timestamptz;

-- ===== AI matching engine =====
-- Score = specialty match 40% + historical close rate 40% + current availability(inverse workload) 20%
-- New staff with zero appointment history get a neutral 50% close-rate score (not 0),
-- so they aren't permanently unmatchable just for being new.
create or replace function heraa_lead_admin_suggest_matches(p_lead_id uuid)
returns table (
  staff_id uuid,
  staff_name text,
  score numeric,
  specialty_score numeric,
  close_rate_score numeric,
  availability_score numeric,
  reason text
)
language plpgsql
security definer
as $$
declare
  v_lead_tags text[];
  v_max_load int;
begin
  select coalesce(interest_tags, '{}') into v_lead_tags from heraa_lead_leads where id = p_lead_id;

  select greatest(max(load), 1) into v_max_load
  from (
    select s.id,
           (select count(*) from heraa_lead_leads l2 where l2.assigned_staff_id = s.id and l2.stage not in ('closed_won','closed_lost'))
           + (select count(*) from heraa_lead_appointments a2 where a2.staff_id = s.id and a2.status in ('pending','confirmed'))
           as load
    from heraa_lead_staff s
    where s.is_active
  ) loads;

  return query
  with staff_stats as (
    select
      s.id,
      s.name,
      s.specialty_tags,
      (select count(*) from heraa_lead_appointments a where a.staff_id = s.id) as total_appts,
      (select count(*) from heraa_lead_appointments a where a.staff_id = s.id and a.outcome = 'closed_won') as won_appts,
      (select count(*) from heraa_lead_leads l2 where l2.assigned_staff_id = s.id and l2.stage not in ('closed_won','closed_lost'))
      + (select count(*) from heraa_lead_appointments a2 where a2.staff_id = s.id and a2.status in ('pending','confirmed'))
      as current_load
    from heraa_lead_staff s
    where s.is_active
  )
  select
    ss.id,
    ss.name,
    round(
      (specialty.pct * 0.4) + (close_rate.pct * 0.4) + (availability.pct * 0.2)
    , 1) as score,
    round(specialty.pct, 1),
    round(close_rate.pct, 1),
    round(availability.pct, 1),
    (
      case when array_length(v_lead_tags,1) > 0 and specialty.overlap > 0
        then format('擅长匹配 %s 项', specialty.overlap)
        else '专长标签暂无重叠'
      end
      || ' · 历史成交率 ' || round(close_rate.pct,0)::text || '%'
      || case when ss.current_load = 0 then ' · 当前无负荷' else format(' · 当前负荷 %s 件', ss.current_load) end
    ) as reason
  from staff_stats ss
  cross join lateral (
    select
      case
        when array_length(v_lead_tags,1) is null or array_length(v_lead_tags,1) = 0 then 50.0
        else (
          select count(*)::numeric from unnest(v_lead_tags) t where t = any(ss.specialty_tags)
        ) / greatest(array_length(v_lead_tags,1),1) * 100
      end as pct,
      (
        select count(*)::int from unnest(v_lead_tags) t where t = any(ss.specialty_tags)
      ) as overlap
  ) specialty
  cross join lateral (
    select
      case
        when ss.total_appts = 0 then 50.0
        else (ss.won_appts::numeric / ss.total_appts) * 100
      end as pct
  ) close_rate
  cross join lateral (
    select (1 - (ss.current_load::numeric / v_max_load)) * 100 as pct
  ) availability
  order by score desc, ss.name
  limit 5;
end;
$$;

-- Confirm a suggested (or manually chosen) match: records the decision for future score
-- calibration and assigns the staff to the lead in one step.
create or replace function heraa_lead_admin_confirm_match(
  p_lead_id uuid,
  p_staff_id uuid,
  p_score numeric default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_match_id uuid;
begin
  insert into heraa_lead_matches (lead_id, staff_id, score, reason, status)
  values (p_lead_id, p_staff_id, p_score, p_reason, 'confirmed')
  returning id into v_match_id;

  update heraa_lead_leads set assigned_staff_id = p_staff_id, updated_at = now() where id = p_lead_id;

  return jsonb_build_object('success', true, 'match_id', v_match_id);
end;
$$;

-- ===== Appointment system =====

create or replace function heraa_lead_admin_create_appointment(
  p_lead_id uuid,
  p_staff_id uuid,
  p_slot_start timestamptz,
  p_slot_end timestamptz,
  p_match_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into heraa_lead_appointments (lead_id, staff_id, match_id, slot_start, slot_end, status)
  values (p_lead_id, p_staff_id, p_match_id, p_slot_start, p_slot_end, 'confirmed')
  returning id into v_id;

  update heraa_lead_leads set stage = 'scheduled', updated_at = now()
  where id = p_lead_id and stage not in ('closed_won','closed_lost');

  return jsonb_build_object('success', true, 'id', v_id);
end;
$$;

-- Reschedule: never mutates the old row's slot — marks it 'rescheduled' and creates a new
-- row pointing back via rescheduled_from, so the full history of moves stays intact.
create or replace function heraa_lead_admin_reschedule_appointment(
  p_appointment_id uuid,
  p_new_slot_start timestamptz,
  p_new_slot_end timestamptz
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_old heraa_lead_appointments%rowtype;
  v_new_id uuid;
begin
  select * into v_old from heraa_lead_appointments where id = p_appointment_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'appointment_not_found');
  end if;

  update heraa_lead_appointments set status = 'rescheduled' where id = p_appointment_id;

  insert into heraa_lead_appointments (lead_id, staff_id, match_id, slot_start, slot_end, status, rescheduled_from)
  values (v_old.lead_id, v_old.staff_id, v_old.match_id, p_new_slot_start, p_new_slot_end, 'confirmed', p_appointment_id)
  returning id into v_new_id;

  return jsonb_build_object('success', true, 'new_id', v_new_id);
end;
$$;

-- Record the outcome after the visit. Feeds straight back into the matching engine's
-- close-rate score (heraa_lead_admin_suggest_matches reads outcome='closed_won' directly).
create or replace function heraa_lead_admin_record_outcome(
  p_appointment_id uuid,
  p_outcome text,
  p_outcome_notes text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_lead_id uuid;
begin
  update heraa_lead_appointments
  set status = 'completed',
      outcome = p_outcome,
      outcome_notes = p_outcome_notes,
      outcome_recorded_at = now()
  where id = p_appointment_id
  returning lead_id into v_lead_id;

  if p_outcome = 'closed_won' then
    update heraa_lead_leads set stage = 'closed_won', updated_at = now() where id = v_lead_id;
  elsif p_outcome = 'follow_up_needed' then
    update heraa_lead_leads set stage = 'nurturing', updated_at = now() where id = v_lead_id;
  end if;

  return jsonb_build_object('success', true);
end;
$$;

-- Mark no-show / cancelled without a full outcome record
create or replace function heraa_lead_admin_update_appointment_status(
  p_appointment_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
as $$
begin
  update heraa_lead_appointments set status = p_status where id = p_appointment_id;
  return jsonb_build_object('success', true);
end;
$$;

-- Reminder logic only — actual WhatsApp send wires in once Meta verification is through.
-- Returns appointments due for their 24h or 2h reminder window that haven't been sent yet.
create or replace function heraa_lead_admin_due_reminders()
returns table (
  appointment_id uuid,
  lead_id uuid,
  lead_name text,
  lead_phone text,
  staff_name text,
  slot_start timestamptz,
  reminder_stage text
)
language sql
security definer
as $$
  select a.id, a.lead_id, l.name, l.phone, s.name, a.slot_start,
    case
      when a.slot_start <= now() + interval '2 hours' and a.reminder_2h_sent_at is null then '2h'
      when a.slot_start <= now() + interval '24 hours' and a.reminder_24h_sent_at is null then '24h'
    end as reminder_stage
  from heraa_lead_appointments a
  join heraa_lead_leads l on l.id = a.lead_id
  left join heraa_lead_staff s on s.id = a.staff_id
  where a.status = 'confirmed'
    and a.slot_start > now()
    and (
      (a.slot_start <= now() + interval '2 hours' and a.reminder_2h_sent_at is null)
      or (a.slot_start <= now() + interval '24 hours' and a.reminder_24h_sent_at is null)
    )
  order by a.slot_start;
$$;

create or replace function heraa_lead_admin_mark_reminder_sent(p_appointment_id uuid, p_stage text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if p_stage = '2h' then
    update heraa_lead_appointments set reminder_2h_sent_at = now() where id = p_appointment_id;
  else
    update heraa_lead_appointments set reminder_24h_sent_at = now() where id = p_appointment_id;
  end if;
  return jsonb_build_object('success', true);
end;
$$;

-- ===== Long-term nurture automation =====
-- Sweep: leads sitting in 'new'/'contacted' past the configurable wait window (default 7 days,
-- see heraa_lead_settings.nurture_wait_days) with no scheduled appointment get moved into
-- 'nurturing' and get their first nurture_log entry. Idempotent — a lead already logged
-- won't be re-logged by a later sweep run.
create or replace function heraa_lead_admin_run_nurture_sweep()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_wait_days int;
  v_moved int := 0;
  v_lead record;
begin
  select coalesce(value::int, 7) into v_wait_days
  from heraa_lead_settings where key = 'nurture_wait_days';

  for v_lead in
    select l.id
    from heraa_lead_leads l
    where l.stage in ('new','contacted')
      and l.updated_at < now() - (v_wait_days || ' days')::interval
      and not exists (select 1 from heraa_lead_appointments a where a.lead_id = l.id and a.status in ('pending','confirmed'))
      and not exists (select 1 from heraa_lead_nurture_log n where n.lead_id = l.id)
  loop
    update heraa_lead_leads set stage = 'nurturing', updated_at = now() where id = v_lead.id;

    insert into heraa_lead_nurture_log (lead_id, sequence_type, step, sent_at, next_due_at)
    values (v_lead.id, 'reengagement', 1, null, now());

    v_moved := v_moved + 1;
  end loop;

  return jsonb_build_object('success', true, 'moved_to_nurture', v_moved);
end;
$$;

-- Called by the future WhatsApp AI module when an inbound reply is classified as positive
-- intent (high/warm) for a lead currently sitting in the nurture pool — pulls it back into
-- the active follow-up flow instead of continuing the drip sequence.
create or replace function heraa_lead_admin_exit_nurture(p_lead_id uuid, p_intent_tag text default null)
returns jsonb
language plpgsql
security definer
as $$
begin
  update heraa_lead_leads
  set stage = 'contacted', intent_score = coalesce(p_intent_tag, intent_score), updated_at = now()
  where id = p_lead_id and stage = 'nurturing';

  return jsonb_build_object('success', true);
end;
$$;

-- Record a nurture message send (content itself comes from Benny's marketing team later;
-- this just tracks cadence so the sweep doesn't re-trigger and Admin can see send history)
create or replace function heraa_lead_admin_log_nurture_sent(p_lead_id uuid, p_step int)
returns jsonb
language plpgsql
security definer
as $$
begin
  insert into heraa_lead_nurture_log (lead_id, sequence_type, step, sent_at, next_due_at)
  values (p_lead_id, 'reengagement', p_step, now(), now() + interval '30 days');
  return jsonb_build_object('success', true);
end;
$$;

-- List current nurture pool for the admin UI
create or replace function heraa_lead_admin_list_nurture_pool()
returns table (
  lead_id uuid, lead_name text, lead_phone text, entered_at timestamptz,
  last_step int, last_sent_at timestamptz
)
language sql
security definer
as $$
  select l.id, l.name, l.phone,
    (select min(n.next_due_at) from heraa_lead_nurture_log n where n.lead_id = l.id and n.step = 1),
    (select n.step from heraa_lead_nurture_log n where n.lead_id = l.id order by n.step desc limit 1),
    (select max(n.sent_at) from heraa_lead_nurture_log n where n.lead_id = l.id)
  from heraa_lead_leads l
  where l.stage = 'nurturing'
  order by l.updated_at desc;
$$;
