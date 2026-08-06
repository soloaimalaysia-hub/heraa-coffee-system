-- 013: Heraa Lead-to-Appointment CRM module
-- Modular add-on inside the existing heraa-coffee-system project (same Supabase/GitHub/Vercel).
-- All tables prefixed heraa_lead_* so this folder + migration can be lifted out and
-- reprefixed for a future standalone client if ever sold separately.
-- RLS follows the existing Heraa pattern: locked down, admin access only via
-- SECURITY DEFINER RPCs (heraa_lead_admin_*), never raw table reads from the client.

-- ===== Tables =====

create table heraa_lead_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  company text,
  "position" text,
  email text,
  source text not null,
  area text,
  interest_tags text[] default '{}',
  intent_score text default 'unknown',
  stage text default 'new',
  assigned_staff_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(phone)
);

create table heraa_lead_staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  specialty_tags text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table heraa_lead_leads
  add constraint heraa_lead_leads_staff_fk foreign key (assigned_staff_id) references heraa_lead_staff(id);

create table heraa_lead_availability (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references heraa_lead_staff(id),
  weekday int not null,
  start_time time not null,
  end_time time not null
);

create table heraa_lead_interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references heraa_lead_leads(id),
  direction text not null,
  message text,
  intent_tag text,
  created_at timestamptz default now()
);

create table heraa_lead_matches (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references heraa_lead_leads(id),
  staff_id uuid references heraa_lead_staff(id),
  score numeric,
  reason text,
  status text default 'suggested',
  created_at timestamptz default now()
);

create table heraa_lead_appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references heraa_lead_leads(id),
  staff_id uuid references heraa_lead_staff(id),
  match_id uuid references heraa_lead_matches(id),
  slot_start timestamptz not null,
  slot_end timestamptz not null,
  status text default 'pending',
  outcome text,
  outcome_notes text,
  outcome_recorded_at timestamptz,
  reminder_sent_at timestamptz,
  rescheduled_from uuid references heraa_lead_appointments(id),
  created_at timestamptz default now()
);

create table heraa_lead_nurture_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references heraa_lead_leads(id),
  sequence_type text,
  step int,
  sent_at timestamptz,
  next_due_at timestamptz
);

alter table heraa_lead_leads add column if not exists pdpa_consent boolean default false;
alter table heraa_lead_leads add column if not exists pdpa_consent_at timestamptz;

create table heraa_lead_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);
insert into heraa_lead_settings (key, value) values ('nurture_wait_days', '7');

-- ===== RLS =====

alter table heraa_lead_leads enable row level security;
alter table heraa_lead_staff enable row level security;
alter table heraa_lead_availability enable row level security;
alter table heraa_lead_interactions enable row level security;
alter table heraa_lead_matches enable row level security;
alter table heraa_lead_appointments enable row level security;
alter table heraa_lead_nurture_log enable row level security;
alter table heraa_lead_settings enable row level security;

create index heraa_lead_leads_stage_idx on heraa_lead_leads(stage);
create index heraa_lead_leads_source_idx on heraa_lead_leads(source);
create index heraa_lead_leads_staff_idx on heraa_lead_leads(assigned_staff_id);
create index heraa_lead_interactions_lead_idx on heraa_lead_interactions(lead_id);
create index heraa_lead_appointments_lead_idx on heraa_lead_appointments(lead_id);
create index heraa_lead_appointments_staff_idx on heraa_lead_appointments(staff_id);

-- ===== Admin RPCs (SECURITY DEFINER) =====

create or replace function heraa_lead_admin_funnel()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_total int;
  v_contacted int;
  v_scheduled int;
  v_closed_won int;
begin
  select count(*) into v_total from heraa_lead_leads;
  select count(*) into v_contacted from heraa_lead_leads where stage in ('contacted','nurturing','scheduled','closed_won','closed_lost');
  select count(*) into v_scheduled from heraa_lead_leads where stage in ('scheduled','closed_won','closed_lost');
  select count(*) into v_closed_won from heraa_lead_leads where stage = 'closed_won';

  return jsonb_build_object(
    'total', v_total,
    'contacted', v_contacted,
    'scheduled', v_scheduled,
    'closed_won', v_closed_won,
    'contacted_rate', case when v_total > 0 then round(v_contacted::numeric / v_total * 100, 1) else 0 end,
    'scheduled_rate', case when v_contacted > 0 then round(v_scheduled::numeric / v_contacted * 100, 1) else 0 end,
    'closed_rate', case when v_scheduled > 0 then round(v_closed_won::numeric / v_scheduled * 100, 1) else 0 end
  );
end;
$$;

create or replace function heraa_lead_admin_list_leads(
  p_search text default null,
  p_source text default null,
  p_stage text default null,
  p_staff_id uuid default null
)
returns table (
  id uuid, name text, phone text, company text, "position" text, email text,
  source text, area text, interest_tags text[], intent_score text, stage text,
  assigned_staff_id uuid, assigned_staff_name text,
  created_at timestamptz, updated_at timestamptz
)
language sql
security definer
as $$
  select l.id, l.name, l.phone, l.company, l."position", l.email,
         l.source, l.area, l.interest_tags, l.intent_score, l.stage,
         l.assigned_staff_id, s.name as assigned_staff_name,
         l.created_at, l.updated_at
  from heraa_lead_leads l
  left join heraa_lead_staff s on s.id = l.assigned_staff_id
  where (p_search is null or l.name ilike '%'||p_search||'%' or l.phone ilike '%'||p_search||'%' or l.company ilike '%'||p_search||'%')
    and (p_source is null or l.source = p_source)
    and (p_stage is null or l.stage = p_stage)
    and (p_staff_id is null or l.assigned_staff_id = p_staff_id)
  order by l.created_at desc;
$$;

create or replace function heraa_lead_admin_create_lead(
  p_name text,
  p_phone text,
  p_company text default null,
  p_position text default null,
  p_email text default null,
  p_source text default 'manual',
  p_area text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into heraa_lead_leads (name, phone, company, "position", email, source, area)
  values (p_name, p_phone, p_company, p_position, p_email, p_source, p_area)
  on conflict (phone) do update set
    company = coalesce(excluded.company, heraa_lead_leads.company),
    "position" = coalesce(excluded."position", heraa_lead_leads."position"),
    email = coalesce(excluded.email, heraa_lead_leads.email),
    source = excluded.source,
    area = coalesce(excluded.area, heraa_lead_leads.area),
    updated_at = now()
  returning id into v_id;

  return jsonb_build_object('success', true, 'id', v_id);
end;
$$;

create or replace function heraa_lead_admin_bulk_import(p_rows jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row jsonb;
  v_inserted int := 0;
  v_updated int := 0;
begin
  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    if exists (select 1 from heraa_lead_leads where phone = (v_row->>'phone')) then
      update heraa_lead_leads set
        source = coalesce(v_row->>'source', source),
        company = coalesce(v_row->>'company', company),
        "position" = coalesce(v_row->>'position', "position"),
        email = coalesce(v_row->>'email', email),
        area = coalesce(v_row->>'area', area),
        updated_at = now()
      where phone = (v_row->>'phone');
      v_updated := v_updated + 1;
    else
      insert into heraa_lead_leads (name, phone, company, "position", email, source, area)
      values (
        v_row->>'name', v_row->>'phone', v_row->>'company', v_row->>'position',
        v_row->>'email', coalesce(v_row->>'source', 'csv_import'), v_row->>'area'
      );
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  return jsonb_build_object('success', true, 'inserted', v_inserted, 'updated', v_updated);
end;
$$;

create or replace function heraa_lead_admin_update_stage(p_lead_id uuid, p_stage text)
returns jsonb
language plpgsql
security definer
as $$
begin
  update heraa_lead_leads set stage = p_stage, updated_at = now() where id = p_lead_id;
  return jsonb_build_object('success', true);
end;
$$;

create or replace function heraa_lead_admin_list_staff()
returns table (id uuid, name text, phone text, specialty_tags text[], is_active boolean)
language sql
security definer
as $$
  select id, name, phone, specialty_tags, is_active from heraa_lead_staff order by name;
$$;

create or replace function heraa_lead_admin_create_staff(
  p_name text,
  p_phone text,
  p_specialty_tags text[] default '{}'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into heraa_lead_staff (name, phone, specialty_tags)
  values (p_name, p_phone, p_specialty_tags)
  returning id into v_id;
  return jsonb_build_object('success', true, 'id', v_id);
end;
$$;

create or replace function heraa_lead_admin_assign_staff(p_lead_id uuid, p_staff_id uuid)
returns jsonb
language plpgsql
security definer
as $$
begin
  update heraa_lead_leads set assigned_staff_id = p_staff_id, updated_at = now() where id = p_lead_id;
  return jsonb_build_object('success', true);
end;
$$;

create or replace function heraa_lead_admin_list_appointments()
returns table (
  id uuid, lead_id uuid, lead_name text, staff_id uuid, staff_name text,
  slot_start timestamptz, slot_end timestamptz, status text,
  outcome text, outcome_notes text, created_at timestamptz
)
language sql
security definer
as $$
  select a.id, a.lead_id, l.name as lead_name, a.staff_id, s.name as staff_name,
         a.slot_start, a.slot_end, a.status, a.outcome, a.outcome_notes, a.created_at
  from heraa_lead_appointments a
  left join heraa_lead_leads l on l.id = a.lead_id
  left join heraa_lead_staff s on s.id = a.staff_id
  order by a.slot_start desc;
$$;

create or replace function heraa_lead_admin_staff_ranking()
returns table (
  staff_id uuid, staff_name text, total_appointments bigint,
  closed_won bigint, close_rate numeric
)
language sql
security definer
as $$
  select s.id as staff_id, s.name as staff_name,
         count(a.id) as total_appointments,
         count(a.id) filter (where a.outcome = 'closed_won') as closed_won,
         case when count(a.id) > 0
           then round(count(a.id) filter (where a.outcome = 'closed_won')::numeric / count(a.id) * 100, 1)
           else 0
         end as close_rate
  from heraa_lead_staff s
  left join heraa_lead_appointments a on a.staff_id = s.id
  group by s.id, s.name
  order by close_rate desc, total_appointments desc;
$$;

create or replace function heraa_lead_admin_source_breakdown()
returns table (
  source text, total bigint, closed_won bigint, conversion_rate numeric
)
language sql
security definer
as $$
  select l.source,
         count(*) as total,
         count(*) filter (where l.stage = 'closed_won') as closed_won,
         round(count(*) filter (where l.stage = 'closed_won')::numeric / count(*) * 100, 1) as conversion_rate
  from heraa_lead_leads l
  group by l.source
  order by total desc;
$$;
