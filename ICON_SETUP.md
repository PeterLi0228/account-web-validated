# 📱 安卓手机Logo标题修复指南

## 🔧 已完成的配置

### 1. PWA Manifest 文件
- ✅ 创建了 `public/manifest.json`
- ✅ 定义了应用名称："可记账"
- ✅ 设置了主题色和图标路径

### 2. HTML Meta 标签
- ✅ 添加了 `manifest.json` 链接
- ✅ 设置了主题色 `#3b82f6`
- ✅ 配置了移动端Web应用支持
- ✅ 添加了苹果设备特定标签

### 3. 图标文件
- ✅ 创建了基础SVG图标 `public/icon.svg`
- ✅ 生成了占位符PNG文件：
  - `icon-192.png` (192x192)
  - `icon-512.png` (512x512) 
  - `apple-touch-icon.png` (180x180)
  - `favicon.ico`

## 🎨 优化图标（可选）

### 方法1：使用HTML生成器
1. 在浏览器中打开 `generate-icons.html`
2. 点击"生成图标"按钮
3. 右键下载各种尺寸的PNG图标
4. 将下载的图标文件放到 `public/` 目录

### 方法2：在线工具
1. 访问 https://favicon.io/favicon-generator/
2. 上传 `public/icon.svg` 文件
3. 下载生成的图标包
4. 将文件复制到 `public/` 目录

### 方法3：使用设计工具
- 使用 Figma、Sketch 或 Photoshop
- 基于 `icon.svg` 创建不同尺寸
- 导出为PNG格式

## 🚀 部署更新

修复完成后需要重新构建部署：

```bash
# 1. 构建新镜像
docker build --platform=linux/amd64 -f Dockerfile.simple -t crpi-mw1n0vpv2l5erixi.cn-hangzhou.personal.cr.aliyuncs.com/ke_test/accounting-web:latest .

# 2. 推送镜像
docker push crpi-mw1n0vpv2l5erixi.cn-hangzhou.personal.cr.aliyuncs.com/ke_test/accounting-web:latest

# 3. 在Sealos重新部署应用
```

## 📱 预期效果

部署后，在安卓手机上：
- ✅ 浏览器标签页显示"可记账"名称
- ✅ 添加到主屏幕时显示"可记账"标题
- ✅ 应用图标正确显示
- ✅ 支持PWA模式安装

## 🔍 验证方法

1. **浏览器标签页**：打开应用，查看标签页标题
2. **添加到主屏幕**：Android Chrome > 菜单 > 添加到主屏幕
3. **PWA检测**：Chrome开发者工具 > Application > Manifest

## 🐛 故障排除

如果仍然不显示：
1. 清除浏览器缓存
2. 检查manifest.json是否可访问
3. 验证图标文件是否存在
4. 确认Content-Type为application/json 