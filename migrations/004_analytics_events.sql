-- =====================================================
-- Solo AI Empire · Analytics Events Module (Template)
-- =====================================================
-- 使用方法：
--   1. 全文替换 `heraa_` → `{your_prefix}_`（如 ktv_, vm_）
--   2. 全文替换 `heraa_members` → `{your_prefix}_members`
--   3. Apply 到目标 Supabase project
-- =====================================================

create table heraa_events (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references heraa_members(id),
  event_type text not null,
  page text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
create index heraa_events_type_idx on heraa_events(event_type);
create index heraa_events_member_idx on heraa_events(member_id);
create index heraa_events_created_idx on heraa_events(created_at);
alter table heraa_events enable row level security;

-- Track RPC (SECURITY DEFINER, callable from anon key)
create or replace function heraa_track_event(
  p_member_id uuid,
  p_event_type text,
  p_page text default null,
  p_metadata jsonb default '{}'
)
returns void
language plpgsql security definer as $$
begin
  insert into heraa_events (member_id, event_type, page, metadata)
  values (p_member_id, p_event_type, p_page, p_metadata);
end;
$$;

-- =====================================================
-- Event Types (Convention)
-- =====================================================
--   app_open           App/PWA 打开
--   login_initiated    发起登入
--   login_success      登入成功
--   wallet_viewed      查看主页
--   redeem_clicked     点兑换/购买
--   redeem_success     兑换成功
--   redeem_failed      兑换失败
--   garden_viewed      看游戏页
--   watering_done      每日任务完成
--   whatsapp_clicked   点了推送链接
--
-- 客户可自定义任何 event_type，不需要预先声明。
-- =====================================================
