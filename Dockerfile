# 使用 Node 18 的 Alpine 版本
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json ./
COPY package-lock.json ./

# 安装依赖
RUN npm ci

# 复制项目文件
COPY . .

# 构建项目
RUN npm run build

# 暴露端口（Next.js 默认端口）
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]