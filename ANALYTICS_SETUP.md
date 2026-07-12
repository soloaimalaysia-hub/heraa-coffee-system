# 📊 Solo AI Empire · Analytics Standard Module

**帝国 SaaS 通用 Analytics 模块 · 30 分钟接入指南**

---

## 是什么

一套可复制粘贴的 Analytics 系统：Event 追踪 + 5 个报表 RPC + Dashboard UI + CSV 导出。

已在 **Heraa Coffee** 生产环境验证。适配任何有 `{prefix}_members` + `{prefix}_transactions` 表结构的客户系统（KTV、贩卖机、Saloon、SBM...）。

---

## 依赖

目标客户系统必须已有：
- `{prefix}_members(id, name, phone, created_at, ...)`
- `{prefix}_transactions(member_id, amount, type, description, created_at)`
- Vercel Next.js 项目 + Supabase project + anon key

---

## 30 分钟接入步骤

### 1️⃣ 数据库（5 分钟）

复制两个 SQL 文件，全文替换 `heraa_` → `{your_prefix}_`（如 `ktv_`, `vm_`）：

```bash
migrations/004_analytics_events.sql  # events 表 + track RPC
migrations/005_analytics_rpcs.sql    # 5 个报表 RPC
```

用 Supabase MCP 或 Dashboard SQL Editor 执行。

### 2️⃣ 前端追踪（10 分钟）

复制两个文件：

```
src/lib/track.ts                       # 通用追踪 helper
src/app/api/analytics/track/route.ts   # /api/analytics/track（改 RPC 名字）
```

在每个关键页面加追踪（约 10 处）：

| 页面 | 事件 |
|------|------|
| /login | `app_open`（挂载时）· `login_initiated`（发送后）|
| /auth | `login_success`（验证成功后）|
| /wallet | `wallet_viewed`（挂载时）· `redeem_clicked` · `redeem_success` · `redeem_failed` |
| /garden（可选）| `garden_viewed` · `watering_done` |

### 3️⃣ Dashboard（10 分钟）

复制到你的 admin 页：

```
src/app/admin/Analytics.tsx  # 独立组件（改 supabase.rpc 名字）
```

在 `admin/page.tsx` 顶部渲染：

```tsx
import Analytics from "./Analytics";
// ...
<Analytics />
```

### 4️⃣ 部署 + 验证（5 分钟）

```bash
npx next build && npx vercel --prod
```

打开 `/wallet` → 检查 `{prefix}_events` 表有 `wallet_viewed` 记录 = 通过 ✅

---

## 事件命名约定（帝国标准）

新客户请遵守这个 event_type 词典，跨项目一致：

| Event | 说明 |
|-------|------|
| `app_open` | App/PWA 首次打开 |
| `login_initiated` | 发起登入（发送验证）|
| `login_success` | 登入成功 |
| `wallet_viewed` | 看主页/钱包/仪表板 |
| `redeem_clicked` | 点主 CTA（兑换/购买/下单）|
| `redeem_success` | CTA 完成 |
| `redeem_failed` | CTA 失败 |
| `garden_viewed` | 看次要页（游戏、积分）|
| `watering_done` | 完成每日任务 |
| `whatsapp_clicked` | 点了推送链接 |

自定义事件命名：`{domain}_{action}`（如 `booking_confirmed`, `refund_requested`）。

---

## RPC 一览

| RPC | 用途 |
|-----|------|
| `{prefix}_analytics_overview(days)` | 4 个 KPI |
| `{prefix}_analytics_daily(days)` | 每日趋势（画图）|
| `{prefix}_analytics_funnel(days)` | 4 步漏斗 |
| `{prefix}_analytics_retention(days)` | Cohort 留存（day 1/7/14/30）|
| `{prefix}_analytics_export_users(start, end)` | 导出用户 CSV |
| `{prefix}_analytics_export_transactions(start, end)` | 导出交易 CSV |

---

## 关键设计原则

1. **Fire-and-forget** — track() 不 await，失败静默，永不影响主功能
2. **SECURITY DEFINER** — 所有 RPC 定义时绕 RLS，anon key 可直接调
3. **排除 demo 用户** — 所有报表 WHERE `phone NOT LIKE 'demo-%'`
4. **UTF-8 BOM CSV** — 前端加 `﻿` 前缀，Excel 打开中文不乱码
5. **投资人友好** — Cohort retention（Day1/7/14/30）是投资人必看的图

---

## 每客户 30 分钟 SaaS 复制标准

这是 [[feedback-permission-architecture]] 里说的「30 分钟 go-live」的一部分。

新客户接入完整栈：
- 独立 Supabase project（5 分钟）
- 独立 GitHub repo（3 分钟）
- 独立 Vercel（3 分钟）
- 独立 Twilio 号码（10 分钟）
- **本模块 Analytics（30 分钟）** ← 就是这个
- 权限架构表（10 分钟，展会后按新架构建）

= 客户签约后 1 小时内看到自己的 Dashboard。

---

**Empire template maintained by 🦏 大牛 · v1.0 · July 12, 2026**
