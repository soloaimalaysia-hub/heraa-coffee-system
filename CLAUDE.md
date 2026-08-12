@AGENTS.md

## ⚠️ 铁律：Push 前必须 Review

每次 push 代码之前，必须执行 `/review`：
1. 启动 subagent 做独立审查（read-only，不改文件）
2. 审查项目：RLS 漏洞、逻辑错误、硬编码敏感资料、命名一致性、残留 console.log
3. 输出审查报告给 Captain K 过目
4. Captain K 确认后才能 push

❌ 禁止自己建完自己 push，没有审查不准上线。

## 项目概述

- **Heraa Coffee** — Genting Highlands 员工 + 公众会员的智能咖啡机钱包 PWA，Admin 后台内附一套独立的 Lead-to-Appointment CRM 模块（服务 Benny 的配对/介绍业务）
- 线上：会员端 `heraa-coffee-system.vercel.app`，Admin 后台 `/admin`（独立手机号+密码登入，非 URL key）
- Stack：Next.js 16（App Router + Turbopack）+ React 19 + TypeScript + Tailwind v4；Supabase（Postgres + RLS + RPC）；Twilio WhatsApp（Sandbox，非正式 Business API）；部署在 Vercel

## 架构决策

- 业务逻辑全部写成 Supabase `SECURITY DEFINER` RPC，前端只调 RPC，几乎不直接对敏感表 select/insert/update——RLS 默认锁死，anon key 读不到原始行（管理端也一样，靠 RPC 不靠前端权限判断）
- Admin 登入系统（`heraa_admin_users`/`heraa_admin_sessions`）跟会员登入系统（`heraa_members`/`heraa_sessions`）完全独立、互不相关，两套密码
- i18n 是手写的 React Context（`lib/LanguageContext.tsx` + `lib/i18n.ts`），没用第三方库
- Lead CRM 模块（`heraa_lead_*`）代码物理隔离在 `app/admin/components/lead/`，独立 migration 文件，方便未来整包搬去独立项目卖给其他客户
- Admin 导航桌面版是左侧 Sidebar、手机版是底部/顶部横条，同一份 tab 清单（`tabConfig.ts`）驱动两种视图，避免两处维护漂移

## 数据库结构

| 表组 | 前缀 | 说明 |
|---|---|---|
| 会员核心 | `heraa_members/wallets/transactions/redemptions/sessions/auth_tokens` | 钱包主体，密码认证 |
| 会员分流 | `heraa_companies/allowance_logs` | 企业员工 vs 公众会员，月度津贴 |
| 花园游戏 | `heraa_gardens/daily_tasks` | 浇水小游戏（**入口已拿掉，功能未开放**） |
| 优惠/推广 | `heraa_vouchers/promotions/packages/referrals` | 优惠券、套餐、推荐奖励 |
| 活动系统 | `heraa_events_list/event_registrations` | Event 扫码领咖啡 + 大屏幕 |
| 追踪日志 | `heraa_events/whatsapp_logs` | 埋点 + WhatsApp 发送记录 |
| Lead CRM | `heraa_lead_leads/staff/availability/interactions/matches/appointments/nurture_log/settings` | 独立获客系统 |
| Admin 认证 | `heraa_admin_users/sessions` | 后台登入，跟会员系统零交集 |

RLS：几乎每张表都是「无公共 policy，只认 SECURITY DEFINER RPC」；仅 `heraa_wallets/transactions/redemptions/gardens` 有 `member_id = auth.uid()` 的自助读写 policy（但本项目走自定义 session token，不用 Supabase Auth，所以这条实际也很少命中）。

## API / 路由结构

**会员端页面**：`/login /register /register/[companyCode] /activate /forgot-password /home /wallet /garden /redeem /success /history /voucher /profile /referral /packages /package/[id] /event/[eventId](+/success +/screen) /screen`

**API routes**（`src/app/api/`）：
- `auth/{me,register,send-link,verify}` — 密码认证+WhatsApp激活链接
- `analytics/track` — 埋点上报
- `broadcast` / `send-whatsapp` / `daily-reminder` / `test-reminder` — WhatsApp 推送
- `cron/grant-allowances` — 企业月度津贴自动发放（Vercel Cron）
- `event/post-register` — Event 注册后 WhatsApp 欢迎

**Admin**：单页 `/admin`，靠 `tab` state 切换 9 个模块（数据/咖啡/WhatsApp/交易/会员/活动/Lead/预约，企业 Tab 已拿掉入口但代码还在）

## 部署流程

```bash
npm run build        # 本地先过一遍
npx vercel --prod --yes   # 直接部署到生产（这个项目没接 GitHub 自动部署，纯 CLI 手动）
```
部署后会拿到一个独有快照 URL（如 `heraa-coffee-system-xxxx.vercel.app`，**永远定格在那次部署，不会更新**）+ 正式别名 `heraa-coffee-system.vercel.app`（**永远指向最新**，日常访问用这个）。

环境变量（都在 Vercel Dashboard 配置，只有 Production scope，本地 `.env.local` 只放了 Supabase 两个公开 key）：
`NEXT_PUBLIC_SUPABASE_URL` `NEXT_PUBLIC_SUPABASE_ANON_KEY` `TWILIO_ACCOUNT_SID` `TWILIO_AUTH_TOKEN` `TWILIO_WHATSAPP_FROM` `TWILIO_WHATSAPP_TO` `CRON_SECRET`

## 已知注意事项

- **Twilio 是 Sandbox 测试号码**，非正式 WhatsApp Business API——手机号 ~3 天不跟 Sandbox 互动会话就断线，之后消息「API 层面显示 sent」但实际收不到，需要重发 `join doctor-through` 到 `+1 415 523 8886` 重新连上
- `/wallet` `/profile` 曾经有 bug（公众/企业账号显示逻辑没跟着 `member_type` 分流），`/profile` 已修复重新开放，`/wallet` 目前仍是「无独立导航入口，只能透过兑换流程按钮进入」的状态
- Garden 浇水小游戏、Companies（企业管理）Tab：**代码/数据都还在，只是导航入口被拿掉**，暂不开放，随时可以加回来
- Lead CRM 的 AI 配对打分、预约提醒的 WhatsApp 实际发送尚未接通，等 Benny 的 Meta WhatsApp Business API 官方认证批下来才会启用（现在 Heraa 跟 Lead 系统共用同一套基础设施，未来会一起从 Twilio Sandbox 迁到 Meta 官方 API）

## 命名规则

- 会员系统表：`heraa_*`；Lead CRM 表：`heraa_lead_*`；Admin 专属表：`heraa_admin_*`
- RPC 命名：`heraa_<领域>_<动作>`，Admin 后台用的 RPC 一律 `heraa_admin_*` 或 `heraa_lead_admin_*` 前缀，一眼能分清是不是给前端裸调用的敏感操作
- 组件文件 PascalCase（`AnalyticsTab.tsx`），页面文件遵循 Next.js App Router 约定（`page.tsx`/`route.ts`），共用逻辑放 `src/lib/`
