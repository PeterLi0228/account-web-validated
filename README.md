# 简记账 - 智能记账应用

一个基于 Next.js 的现代化记账应用，支持多账本管理、AI智能记账、数据分析和导出功能。

## ✨ 功能特性

### 🔐 用户认证
- 用户注册/登录系统
- 用户名修改功能
- 基于 Supabase Auth 的安全认证

### 📚 账本管理
- 创建和管理多个账本
- 账本权限管理（拥有者、编辑、查看等）
- 账本成员邀请和管理
- 自动创建默认分类

### 💰 交易记录
- 收入/支出记录添加
- 分类管理和自定义
- 交易记录查看和筛选
- 时间范围筛选功能

### 🤖 AI智能记账
- 自然语言描述转换为记账记录
- 智能识别金额、类型和分类
- 聊天历史保存和加载
- 记录确认和自动添加

### 📊 数据分析
- 月度收支趋势图表
- 支出分类饼图分析
- 收入支出统计卡片
- 储蓄率和增长率计算

### 📤 数据导出
- CSV/Excel 格式导出
- 自定义时间范围导出
- 按类型筛选导出
- 快速导出预设（本月、本年、全部）

## 🛠 技术栈

### 前端框架
- **Next.js 15.2.4** - React 全栈框架
- **React 19** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript

### UI 组件
- **Tailwind CSS** - 原子化 CSS 框架
- **Radix UI** - 无样式组件库
- **shadcn/ui** - 现代化 UI 组件
- **Lucide React** - 图标库

### 后端服务
- **Supabase** - 后端即服务平台
  - PostgreSQL 数据库
  - 实时数据同步
  - 用户认证管理
  - Row Level Security (RLS)

### AI 服务
- **OpenRouter API** - AI 模型接口
- **DeepSeek Chat** - 智能对话模型

## 📋 数据库设计

### 核心表结构

#### bills (账本表)
- `id` - 主键
- `owner_id` - 拥有者ID
- `name` - 账本名称
- `created_at` - 创建时间

#### bill_members (成员权限表)
- `id` - 主键
- `bill_id` - 账本ID
- `user_id` - 用户ID
- `permission` - 权限级别

#### categories (分类表)
- `id` - 主键
- `bill_id` - 账本ID
- `user_id` - 创建者ID
- `name` - 分类名称
- `type` - 类型（income/expense）

#### transactions (交易记录表)
- `id` - 主键
- `bill_id` - 账本ID
- `user_id` - 用户ID
- `type` - 类型（income/expense）
- `date` - 交易日期
- `item` - 项目名称
- `amount` - 金额
- `person` - 经办人
- `note` - 备注
- `category_id` - 分类ID

#### ai_logs (AI聊天日志表)
- `id` - 主键
- `bill_id` - 账本ID
- `user_id` - 用户ID
- `role` - 角色（user/assistant）
- `content` - 消息内容
- `created_at` - 创建时间

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- npm 或 yarn
- Supabase 账户
- OpenRouter API 密钥

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd account-web-validated
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
创建 `.env.local` 文件：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_Router_API_KEY=your_openrouter_api_key
```

4. **数据库设置**
在 Supabase 中创建以下表结构（参考上面的数据库设计）

5. **启动开发服务器**
```bash
npm run dev
```

6. **访问应用**
打开 [http://localhost:3000](http://localhost:3000)

## 📱 使用指南

### 首次使用
1. 注册新账户或登录现有账户
2. 创建第一个账本
3. 开始添加交易记录

### AI记账功能
1. 进入 AI记账页面
2. 用自然语言描述收支情况
3. 确认AI生成的记录
4. 自动添加到账本中

### 数据分析
1. 选择要分析的账本
2. 查看月度趋势和分类分析
3. 了解收支情况和储蓄率

### 数据导出
1. 选择导出的账本
2. 设置时间范围和类型筛选
3. 选择导出格式（CSV/Excel）
4. 下载导出文件

## 🔧 开发指南

### 项目结构
```
app/
├── components/          # 共享组件
├── contexts/           # React Context
├── lib/               # 工具库和配置
├── types/             # TypeScript 类型定义
├── (pages)/           # 页面组件
│   ├── login/         # 登录页面
│   ├── bills/         # 账本管理
│   ├── chat/[id]/     # AI聊天
│   ├── analytics/     # 数据分析
│   └── export/        # 数据导出
└── globals.css        # 全局样式
```

### 核心组件
- `AuthContext` - 用户认证状态管理
- `BillContext` - 账本数据状态管理
- `AppLayout` - 应用布局组件
- `AddRecordModal` - 添加记录模态框
- `TransactionTable` - 交易记录表格

### API 集成
- Supabase 客户端配置在 `lib/supabase.ts`
- AI 服务集成在 `lib/ai.ts`
- 类型定义在 `types/index.ts`

## 🚀 部署

### Vercel 部署（推荐）
1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署

### 其他平台
项目支持部署到任何支持 Next.js 的平台：
- Netlify
- Railway
- Heroku
- 自托管服务器

## 🔒 安全特性

- 基于 Supabase RLS 的数据安全
- 用户数据隔离
- API 密钥环境变量保护
- 客户端状态验证

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 🆘 支持

如有问题或建议，请创建 Issue 或联系开发团队。

---

**简记账** - 让记账变得简单智能 ✨ 