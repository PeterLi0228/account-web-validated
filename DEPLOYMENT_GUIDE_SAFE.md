# 可记账 - Vercel部署指南

## 🚀 部署到Vercel并绑定FlareCloud域名

### 📋 准备工作

#### 1. 环境变量准备
确保您有以下环境变量（从您的 `.env.local` 文件中获取）：

```bash
NEXT_PUBLIC_SUPABASE_URL=您的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=您的Supabase匿名密钥
NEXT_PUBLIC_OPENROUTER_API_KEY=您的OpenRouter API密钥
```

⚠️ **重要提醒**: 请从您本地的 `.env.local` 文件中复制这些值，不要在任何公开文档中暴露这些密钥！

### 🔧 第一步：部署到Vercel

#### 1.1 访问Vercel
1. 打开 [https://vercel.com](https://vercel.com)
2. 使用GitHub账号登录

#### 1.2 导入项目
1. 点击 "New Project"
2. 选择 "Import Git Repository"
3. 找到您的 `account-web-validated` 仓库
4. 点击 "Import"

#### 1.3 配置项目
1. **Project Name**: `ke-ji-zhang` 或您喜欢的名称
2. **Framework Preset**: Next.js（应该自动检测）
3. **Root Directory**: `./`（默认）
4. **Build Command**: `npm run build`（默认）
5. **Output Directory**: `.next`（默认）
6. **Install Command**: `npm install`（默认）

#### 1.4 添加环境变量
在 "Environment Variables" 部分添加：

```
NEXT_PUBLIC_SUPABASE_URL = [从.env.local复制]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [从.env.local复制]
NEXT_PUBLIC_OPENROUTER_API_KEY = [从.env.local复制]
```

#### 1.5 部署
1. 点击 "Deploy"
2. 等待部署完成（通常需要2-5分钟）
3. 部署成功后，您会得到一个类似 `https://ke-ji-zhang.vercel.app` 的URL

### 🌐 第二步：配置FlareCloud域名

#### 2.1 在Vercel中添加自定义域名
1. 进入您的项目Dashboard
2. 点击 "Settings" 标签
3. 在左侧菜单中选择 "Domains"
4. 点击 "Add Domain"
5. 输入您的FlareCloud域名（例如：`kejizhang.com` 或 `app.yourdomain.com`）
6. 点击 "Add"

#### 2.2 获取DNS配置信息
Vercel会显示需要配置的DNS记录，通常是：

**选项A：CNAME记录（推荐用于子域名）**
```
Type: CNAME
Name: app (或您选择的子域名)
Value: cname.vercel-dns.com
```

**选项B：A记录（用于根域名）**
```
Type: A
Name: @
Value: 76.76.19.19
```

#### 2.3 在FlareCloud配置DNS
1. 登录FlareCloud控制面板
2. 找到您的域名管理
3. 进入DNS设置
4. 添加上述DNS记录：

**如果使用子域名（推荐）：**
- 记录类型：CNAME
- 主机记录：app（或您喜欢的子域名）
- 记录值：cname.vercel-dns.com
- TTL：自动或600

**如果使用根域名：**
- 记录类型：A
- 主机记录：@
- 记录值：76.76.19.19
- TTL：自动或600

#### 2.4 等待DNS生效
1. DNS配置后，返回Vercel
2. 等待域名验证（通常需要几分钟到几小时）
3. 验证成功后，Vercel会自动配置SSL证书

### 🔒 第三步：配置Supabase域名白名单

#### 3.1 更新Supabase配置
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 进入 "Settings" → "API"
4. 在 "Site URL" 中添加您的新域名
5. 在 "Additional URLs" 中添加：
   - `https://yourdomain.com`
   - `https://ke-ji-zhang.vercel.app`（Vercel默认域名）

### 🧪 第四步：测试部署

#### 4.1 功能测试清单
- [ ] 访问网站正常加载
- [ ] 用户注册/登录功能
- [ ] 创建账本功能
- [ ] 添加交易记录
- [ ] AI记账功能
- [ ] 数据导出功能
- [ ] 响应式设计（手机端）

#### 4.2 性能检查
1. 使用 [PageSpeed Insights](https://pagespeed.web.dev/) 检查性能
2. 使用 [GTmetrix](https://gtmetrix.com/) 检查加载速度

### 🔧 第五步：优化配置（可选）

#### 5.1 Vercel配置优化
项目已包含 `vercel.json` 配置文件，包含：
- 亚洲地区优化（香港、新加坡）
- 安全头配置
- 函数超时设置

#### 5.2 环境变量管理
- 生产环境：使用Vercel环境变量
- 开发环境：使用 `.env.local`
- 预览环境：可以设置单独的环境变量

### 🚨 故障排除

#### 常见问题及解决方案

**1. 部署失败**
- 检查 `package.json` 中的依赖版本
- 确保所有环境变量都已正确设置
- 查看Vercel部署日志

**2. 域名无法访问**
- 检查DNS配置是否正确
- 等待DNS传播（最多48小时）
- 使用 `nslookup` 或 `dig` 命令检查DNS解析

**3. 数据库连接失败**
- 确认Supabase URL和密钥正确
- 检查Supabase项目状态
- 验证网络连接

**4. AI功能不工作**
- 检查OpenRouter API密钥
- 确认API配额和限制
- 查看浏览器控制台错误

### 📞 支持资源

- [Vercel文档](https://vercel.com/docs)
- [Next.js部署指南](https://nextjs.org/docs/deployment)
- [Supabase文档](https://supabase.com/docs)
- [FlareCloud支持](https://flarecloud.com/support)

---

## 🎉 部署完成！

恭喜！您的"可记账"应用现在已经成功部署到Vercel并绑定了自定义域名。

**访问地址：**
- 主域名：`https://yourdomain.com`
- Vercel域名：`https://ke-ji-zhang.vercel.app`

记得定期备份数据库，并监控应用性能！

## 🔐 安全提醒

- 永远不要在公开的文档或代码中暴露API密钥
- 定期轮换API密钥
- 监控API使用情况
- 使用环境变量管理敏感信息 