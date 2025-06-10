# 1. 登录阿里云
docker login --username=aliyun7044956577 crpi-mw1n0vpv2l5erixi.cn-hangzhou.personal.cr.aliyuncs.com

# 2. 构建镜像
docker build --platform=linux/amd64 -f Dockerfile.simple -t crpi-mw1n0vpv2l5erixi.cn-hangzhou.personal.cr.aliyuncs.com/ke_test/accounting-web:latest .

# 3. 推送镜像
docker push crpi-mw1n0vpv2l5erixi.cn-hangzhou.personal.cr.aliyuncs.com/ke_test/accounting-web:latest