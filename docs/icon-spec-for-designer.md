# Heraa Coffee 系统 · 全页面 Icon/UI 规格表
# For 老板娘设计自定义 Icon 用

品牌色：`#C8111A`（Heraa Red）
项目：heraa-coffee-system
总页面数：24

---

## 共享组件 Shared Components

### BottomNav（底部导航栏 · 全部会员页面都有）
文件：`src/components/BottomNav.tsx`
高度：64px

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px | 设计建议 |
|------|-----------|------|----------|----------|---------|
| Tab 1 | 🏠 | 首页 Home | `text-xl` | 20px | 底部导航图标 |
| Tab 2 | 📋 | 记录 History | `text-xl` | 20px | 底部导航图标 |
| Tab 3 | 🎫 | 优惠券 Voucher | `text-xl` | 20px | 底部导航图标 |
| Tab 4 | 👤 | 我的 Profile | `text-xl` | 20px | 底部导航图标 |

激活色：`#C8111A` / 未激活色：`#888888`
标签文字：`10px` font-medium

### CoffeeBean（咖啡豆 SVG 组件）
文件：`src/components/CoffeeBean.tsx`
默认尺寸：80×80px（可配置 `size` prop）
颜色：填充 `#C8A882`，描边 `#7A5230`
用途：Garden 页种子阶段的植物图标
设计建议：替换为自定义咖啡豆图标，保持可配置尺寸

---

## 客户端页面 Customer Pages（14 页）

### 1. /login 登录页
文件：`src/app/login/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 发送成功状态 | 📱 | 表示 WhatsApp 已发送 | `text-6xl` | 60px |

其他 UI 元素：
- 语言切换按钮（EN / 中文）：纯文字，无图标
- Header 品牌名 "HERAA COFFEE"：纯文字

### 2. /auth 验证页
文件：`src/app/auth/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 验证中动画 | ☕ | 加载中/验证中 | `text-5xl` | 48px |
| 链接无效 | ⚠️ | 错误提示 | `text-5xl` | 48px |

### 3. /home 首页
文件：`src/app/home/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 问候语后 | ☕ | 装饰 · 跟在用户名后面 | inline text | ~16px |
| 套餐入口 | 📦 | Active Package 按钮左侧 | `text-xl` | 20px |
| 快捷操作1 | 📷 | 扫码领取 Scan & Collect | `text-2xl` | 24px |
| 快捷操作2 | 📦 | 购买套餐 Buy Package | `text-2xl` | 24px |
| 快捷操作3 | 🎫 | 我的优惠券 My Vouchers | `text-2xl` | 24px |
| 交易记录-充值 | 💰 | 充值类交易图标 | `text-lg` | 18px |
| 交易记录-消费 | ☕ | 消费类交易图标 | `text-lg` | 18px |

### 4. /wallet 钱包页
文件：`src/app/wallet/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 花园入口 | 🌱 | 去咖啡花园按钮图标 | `text-3xl` | 30px |

其他 UI 元素：
- 头像：圆形 56×56px，白色半透明背景，显示用户名首字母
- 饮品菜单列表：纯文字，无图标

### 5. /redeem 兑换码页
文件：`src/app/redeem/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|

无 Emoji 图标。主要 UI 元素：
- QR Code：220×220px（`qrcode.react` 生成）
- 倒计时数字：36px 字号，等宽字体
- 进度条：红色渐变
- 退款成功提示：绿色卡片，纯文字

### 6. /success 兑换成功页
文件：`src/app/success/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 成功动画 | ✅ | 兑换成功主图标 | `fontSize: 80` | 80px |

### 7. /history 交易记录页
文件：`src/app/history/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 空状态 | 📋 | 无记录时占位 | `text-4xl` | 36px |
| 充值记录 | 💰 | 充值类交易图标 | `text-lg` | 18px |
| 消费记录 | ☕ | 消费类交易图标 | `text-lg` | 18px |

交易图标容器：40×40px 圆形（充值绿底 `#f0fdf4`，消费红底 `#FFF5F5`）

### 8. /garden 咖啡花园页
文件：`src/app/garden/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 种子阶段 | (CoffeeBean SVG) | 植物 · 种子期 | `size={90}` | 90px |
| 发芽阶段 | 🌱 | 植物 · 发芽期 | `text-7xl` | 70px |
| 开花阶段 | 🌿 | 植物 · 开花期 | `text-7xl` | 70px |
| 成熟阶段 | ☕ | 植物 · 成熟期（咖啡） | `text-7xl` | 70px |
| 浇水动画 | 💧 | 正在浇水反馈 | `text-4xl` | 36px |
| 奖励弹窗 | 🎉 | 30天奖励庆祝 | `text-5xl` | 48px |
| 进度条标签-种子 | 🌰 | 进度条下方阶段标签 | `text-xs` inline | ~12px |
| 进度条标签-发芽 | 🌱 | 进度条下方阶段标签 | `text-xs` inline | ~12px |
| 进度条标签-开花 | 🌿 | 进度条下方阶段标签 | `text-xs` inline | ~12px |
| 进度条标签-成熟 | ☕ | 进度条下方阶段标签 | `text-xs` inline | ~12px |
| 任务完成打勾 | ✓ | 今日任务完成 | 6×6px 圆形内 | ~12px |

植物容器：200×200px 圆形，渐变背景+边框

### 9. /voucher 优惠券页
文件：`src/app/voucher/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 空状态 | 🎫 | 无优惠券时占位 | `text-5xl` | 48px |

其他 UI 元素：
- Tab badge 计数：18×18px 圆形
- 优惠券卡片左侧：价值区域（FREE / RM X），无图标
- 状态标签：已使用/已过期/展会后可用，纯文字 badge

### 10. /profile 个人中心页
文件：`src/app/profile/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 菜单-推荐好友 | 👫 | 推荐好友入口 | `text-xl` | 20px |
| 菜单-咖啡花园 | 🌱 | 咖啡花园入口 | `text-xl` | 20px |
| 菜单-交易记录 | 📋 | 交易记录入口 | `text-xl` | 20px |
| 设置-语言 | 🌐 | 语言切换 | `text-xl` | 20px |

头像：64×64px 圆形，白色半透明背景，显示用户名首字母

### 11. /referral 推荐好友页
文件：`src/app/referral/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 奖励说明标题 | 🎉 | 推荐奖励说明 | inline text | ~14px |
| 你获得 | 👤 | 推荐人奖励说明 | `text-lg` | 18px |
| 好友获得 | 👫 | 被推荐人奖励说明 | `text-lg` | 18px |

### 12. /packages 套餐列表页
文件：`src/app/packages/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 空状态 | 📦 | 无套餐时占位 | `text-4xl` | 36px |
| 套餐卡-杯数 | ☕ | 杯数标签前缀 | inline `text-xs` | ~12px |
| 套餐卡-赠送 | 🎁 | 赠送杯数标签前缀 | inline `text-xs` | ~12px |
| 套餐卡-天数 | 📅 | 有效天数标签前缀 | inline `text-xs` | ~12px |

### 13. /package/[id] 套餐详情页
文件：`src/app/package/[id]/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 未找到 | 📦 | 套餐不存在占位 | `text-4xl` | 36px |
| 返回按钮 | ← | 返回上一页 | inline text | ~14px |
| 包含赠送 | 🎁 | 赠送杯数说明 | inline `text-sm` | ~14px |
| 注意事项 | ⚠ | 灰色注意图标 | inline text | ~14px |
| 包含确认 | ✓ | 绿色勾选 | inline text | ~14px |

---

## 活动页面 Event Pages（3 页）

### 14. /event/[eventId] 活动注册页
文件：`src/app/event/[eventId]/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 标题装饰 | 🎉 | 领取免费咖啡标题 | inline text | ~20px |
| 地点标识 | 📍 | 活动地点 | inline `text-xs` | ~12px |
| 活动不存在 | 😔 | 活动已结束/不存在 | `text-5xl` | 48px |
| 提交按钮 | ☕ | 领取免费咖啡按钮前缀 | inline text | ~18px |

口味选择 Emoji（每个口味前的图标）：
| Emoji | 口味 Flavor | 尺寸 CSS |
|-------|------------|----------|
| ☕ | Americano | `text-lg` (18px) |
| 🥛 | Latte | `text-lg` (18px) |
| 🍵 | Matcha Latte | `text-lg` (18px) |
| 🍫 | Mocha | `text-lg` (18px) |
| ☕ | Cappuccino | `text-lg` (18px) |
| 🧋 | Caramel Latte | `text-lg` (18px) |
| 🌸 | Rose Latte | `text-lg` (18px) |
| 🍦 | Vanilla Latte | `text-lg` (18px) |
| 🥤 | Iced Milo | `text-lg` (18px) |
| 🍊 | Orange Latte | `text-lg` (18px) |
| ☕ | White Coffee | `text-lg` (18px) |

### 15. /event/[eventId]/success 活动成功页
文件：`src/app/event/[eventId]/success/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 成功动画 | ✅ | 注册成功主图标 | `text-7xl` | 70px |
| 标题装饰 | 🎉 | 恭喜标题前缀 | inline text | ~20px |
| 过期提示 | ⏰ | QR 已过期 | inline `text-sm` | ~14px |
| 会员卡标题 | 🎉 | 已成为会员提示 | inline `text-base` | ~16px |
| 打开 App 按钮 | 📱 | 打开 App 按钮前缀 | inline `text-base` | ~16px |

QR Code：250×250px

### 16. /event/[eventId]/screen 活动大屏幕
文件：`src/app/event/[eventId]/screen/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|

无 Emoji 图标。UI 元素：
- LIVE 指示灯：2×2px 绿色圆点 `#22c55e`（animate-pulse）
- QR Code：100×100px
- 人数计数器：120px 字号 `#C8111A`
- 背景：全黑 `#0a0a0a`
- Feed 卡片：红色半透明底 `rgba(200,17,26,0.12)`

---

## 管理后台 Admin（1 页壳 + 6 Tab）

### Admin 外壳
文件：`src/app/admin/page.tsx`（引用 TopBar + TabNav）

#### TopBar 顶栏
文件：`src/app/admin/components/TopBar.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 品牌前缀 | ☕ | "☕ Heraa Coffee · Admin" | inline `text-sm` | ~14px |
| 状态圆点 | ● | 白色半透明圆点 | `w-2 h-2` | 8px |

#### TabNav 标签导航
文件：`src/app/admin/components/TabNav.tsx`

| Tab | 当前 Emoji | 用途 | 尺寸 CSS | 移动端约 px | 桌面端约 px |
|-----|-----------|------|----------|-----------|-----------|
| 数据 Analytics | 📊 | 数据分析 | `text-base md:text-lg` | 16px | 18px |
| 咖啡 Coffee | ☕ | 模拟兑换 | `text-base md:text-lg` | 16px | 18px |
| WhatsApp | 📱 | WhatsApp 推送 | `text-base md:text-lg` | 16px | 18px |
| 交易 Transactions | 🧾 | 交易记录 | `text-base md:text-lg` | 16px | 18px |
| 会员 Members | 👥 | 会员管理 | `text-base md:text-lg` | 16px | 18px |
| 活动 Events | 📅 | 活动管理 | `text-base md:text-lg` | 16px | 18px |

激活色：`#C8111A` / 未激活色：`#9ca3af`
底部指示条：2px `#C8111A`

### 17. AnalyticsTab 数据分析
文件：`src/app/admin/components/AnalyticsTab.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 标题 | 📊 | 数据概览标题 | inline `text-xs md:text-sm` | 12-14px |
| 刷新按钮 | 🔄 | 刷新数据 | inline `text-[10px] md:text-xs` | 10-12px |
| 游戏标题 | 🌱 | 游戏化数据标题 | inline `text-xs md:text-sm` | 12-14px |
| 导出标题 | 📥 | 数据导出标题 | inline `text-xs md:text-sm` | 12-14px |
| 导出按钮-用户 | 📥 | 导出用户 CSV | inline `text-[11px]` | 11px |
| 导出按钮-交易 | 📥 | 导出交易 CSV | inline `text-[11px]` | 11px |

### 18. SimulateTab 模拟兑换
文件：`src/app/admin/components/SimulateTab.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 表单标题 | ☕ | 模拟兑换标题 | inline `text-xs` | 12px |
| 提示 | 🎬 | 模拟说明提示 | inline `text-[10px]` | 10px |

### 19. WhatsAppTab WhatsApp推送
文件：`src/app/admin/components/WhatsAppTab.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 快速发送标题 | 📱 | 快速发送标题 | inline `text-xs` | 12px |
| 广播标题 | 📢 | 广播推送标题 | inline `text-xs` | 12px |

### 20. TransactionsTab 交易记录
文件：`src/app/admin/components/TransactionsTab.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 标题 | 🧾 | 实时交易标题 | inline `text-xs` | 12px |

其他 UI 元素：
- Realtime 绿色指示灯：1.5×1.5px 圆点 `#0F6E56`（animate-pulse）
- 新交易高亮背景：`#FFF3F3`

### 21. MembersTab 会员管理
文件：`src/app/admin/components/MembersTab.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 标题 | 👥 | 会员列表标题 | inline `text-xs` | 12px |

其他 UI 元素：
- 搜索框：无图标，纯输入框
- 余额 badge：绿色底 `#dcfce7`

### 22. EventsTab 活动管理
文件：`src/app/admin/components/EventsTab.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 管理标题 | 📅 | 活动管理标题 | inline font-bold | ~14px |
| QR 标题 | 🔗 | 活动 QR Code 标题 | inline font-bold | ~14px |
| 复制链接按钮 | 📋 | 复制链接 | inline `text-xs` | 12px |
| 下载 QR 按钮 | 📥 | 下载 QR PNG | inline `text-xs` | 12px |
| 口味排行标题 | ☕ | 口味排行榜 | inline font-bold | ~14px |
| 地区分布标题 | 📍 | 地区分布 | inline font-bold | ~14px |
| 导出按钮 | 📥 | 导出活动 CSV | inline `text-sm` | 14px |

QR Code：140×140px

---

## 大屏幕 Screen Page（1 页）

### 23. /screen 贩卖机大屏幕
文件：`src/app/screen/page.tsx`

| 位置 | 当前 Emoji | 用途 | 尺寸 CSS | 实际约 px |
|------|-----------|------|----------|----------|
| 中央主图 | ☕ | 兑换动画主图标 | `text-5xl` | 48px |

背景：全黑 `#1a0305`
装饰圆环：360px / 240px 红色半透明圆环
品牌文字："HERAA COFFEE · SMART VENDING"
底部统计：今日杯数 / 会员人数 / 今日营收

---

## 汇总：需要设计的 Icon 清单

### 高频 Icon（出现 3 次以上 · 优先设计）

| # | 当前 Emoji | 出现次数 | 用途 | 建议设计尺寸 |
|---|-----------|---------|------|------------|
| 1 | ☕ | 12+ | 咖啡/品牌/消费 | 12px, 18px, 20px, 48px, 70px |
| 2 | 📋 | 4 | 记录/历史 | 12px, 20px, 36px |
| 3 | 🎫 | 3 | 优惠券 | 20px, 48px |
| 4 | 👤 | 2 | 个人/用户 | 18px, 20px |
| 5 | 📦 | 4 | 套餐/包裹 | 12px, 20px, 36px |
| 6 | 📥 | 6 | 下载/导出 | 10px, 12px, 14px |
| 7 | 📅 | 3 | 日历/活动 | 12px, 16-18px |
| 8 | 🌱 | 4 | 发芽/花园 | 12px, 20px, 30px, 70px |
| 9 | 📊 | 2 | 数据分析 | 12-14px, 16-18px |
| 10 | 👥 | 3 | 会员/团体 | 12px, 16-18px |
| 11 | 📱 | 3 | 手机/WhatsApp | 12px, 16-18px, 60px |
| 12 | 🧾 | 2 | 交易/收据 | 12px, 16-18px |
| 13 | 💰 | 2 | 充值/收入 | 18px |
| 14 | 🎉 | 4 | 庆祝/奖励 | 14px, 16px, 20px, 48px |
| 15 | 🎁 | 2 | 赠送/奖励 | 12px, 14px |

### 中频 Icon（出现 1-2 次）

| # | 当前 Emoji | 用途 | 建议设计尺寸 |
|---|-----------|------|------------|
| 16 | 📷 | 扫码领取 | 24px |
| 17 | 🌿 | 开花阶段 | 12px, 70px |
| 18 | 💧 | 浇水 | 36px |
| 19 | 🌰 | 种子阶段 | 12px |
| 20 | ✅ | 成功/完成 | 70px, 80px |
| 21 | ⚠️ | 错误/警告 | 14px, 48px |
| 22 | 👫 | 推荐好友 | 18px, 20px |
| 23 | 🌐 | 语言切换 | 20px |
| 24 | 📍 | 地点 | 12px, 14px |
| 25 | 📢 | 广播 | 12px |
| 26 | 🔄 | 刷新 | 10-12px |
| 27 | 🔗 | 链接/QR | 14px |
| 28 | 🎬 | 模拟提示 | 10px |
| 29 | 😔 | 活动不存在 | 48px |
| 30 | ⏰ | QR 已过期 | 14px |

### 口味图标（活动注册页专用 · 各 18px）

| # | 当前 Emoji | 口味 |
|---|-----------|------|
| 31 | ☕ | Americano / Cappuccino / White Coffee |
| 32 | 🥛 | Latte |
| 33 | 🍵 | Matcha Latte |
| 34 | 🍫 | Mocha |
| 35 | 🧋 | Caramel Latte |
| 36 | 🌸 | Rose Latte |
| 37 | 🍦 | Vanilla Latte |
| 38 | 🥤 | Iced Milo |
| 39 | 🍊 | Orange Latte |

### 特殊组件

| # | 名称 | 当前实现 | 尺寸 | 用途 |
|---|------|---------|------|------|
| 40 | CoffeeBean | 自定义 SVG | 80-90px | 花园种子期 |

---

## 设计交付格式建议

1. **每个 Icon 提供 SVG 格式**（代码直接替换 Emoji）
2. **尺寸覆盖**：每个 Icon 至少提供 3 个尺寸：small (12-14px), medium (18-24px), large (36-80px)
3. **颜色模式**：
   - 激活态：`#C8111A`（Heraa Red）
   - 未激活态：`#888888` 或 `#9ca3af`
   - 深色背景上：白色 `#FFFFFF`
4. **文件命名**：`icon-{名称}-{尺寸}.svg`
   - 例如：`icon-coffee-24.svg`, `icon-voucher-20.svg`
5. **统一风格**：建议线性（outline）或填充（filled）二选一，全系统统一

---

## CSS 尺寸速查

| Tailwind Class | 实际像素 |
|---------------|---------|
| `text-xs` | 12px |
| `text-sm` | 14px |
| `text-base` | 16px |
| `text-lg` | 18px |
| `text-xl` | 20px |
| `text-2xl` | 24px |
| `text-3xl` | 30px |
| `text-4xl` | 36px |
| `text-5xl` | 48px |
| `text-6xl` | 60px |
| `text-7xl` | 70px |
| `text-[10px]` | 10px |
| `text-[11px]` | 11px |
| `text-[9px]` | 9px |
