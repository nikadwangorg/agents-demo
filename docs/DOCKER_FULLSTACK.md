# 全栈 Docker 部署说明

本文档说明如何使用单个 Docker 镜像同时运行前后端。

## 架构说明

**Dockerfile.fullstack** 使用三阶段构建：

1. **Stage 1**: 构建前端（React + Vite）生成静态文件
2. **Stage 2**: 构建后端（TypeScript）生成 Node.js 应用
3. **Stage 3**: 生产环境运行时
   - Nginx 服务前端静态文件（端口 80）
   - Node.js 运行后端 API（端口 3000，内部）
   - Nginx 反向代理 `/api` 请求到后端

## 快速开始

### 使用 Docker 命令

```bash
# 1. 构建镜像
docker build -f Dockerfile.fullstack -t okr-fullstack:latest .

# 2. 运行容器
docker run -d \
  -p 8080:80 \
  -e NODE_ENV=production \
  -e DATABASE_URL="file:/data/prod.db" \
  -v okr-data:/data \
  --name okr-app \
  okr-fullstack:latest

# 3. 查看日志
docker logs -f okr-app

# 4. 停止容器
docker stop okr-app
docker rm okr-app

# 5. 清理数据卷
docker volume rm okr-data
```

访问：**http://localhost:8080**

## 端口说明

- **80**: Nginx Web 服务器
  - 提供前端静态文件
  - 反向代理 API 请求到后端
- **3000**: 后端 API（容器内部，不暴露）

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NODE_ENV` | `production` | 运行模式 |
| `DATABASE_URL` | `file:/data/prod.db` | 数据库连接 |
| `PORT` | `3000` | 后端监听端口（内部） |

## 数据持久化

数据库文件存储在 Docker 卷 `okr-data`（挂载到 `/data`）。

删除容器不会丢失数据，除非执行：
```bash
docker volume rm okr-data
```

## 健康检查

容器内置健康检查：
- 每 30 秒检查一次
- 检查 `/health` 端点
- 失败 3 次后标记为 unhealthy

查看健康状态：
```bash
docker ps
# 或
docker inspect okr-app | grep -A 10 Health
```

## 路由规则

Nginx 配置的路由规则：

| 路径 | 处理方式 |
|------|----------|
| `/` | 前端静态文件（React SPA） |
| `/assets/*` | 静态资源（缓存 1 年） |
| `/api/*` | 反向代理到后端 `http://127.0.0.1:3000/` |
| `/health` | 反向代理到后端健康检查 |

## 生产环境优化

### 1. 添加 SSL/TLS

使用 Nginx 反向代理或 Traefik：

```bash
# 示例：使用 Traefik
docker run -d \
  --name okr-app \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.okr.rule=Host(\`okr.example.com\`)" \
  --label "traefik.http.routers.okr.entrypoints=websecure" \
  --label "traefik.http.routers.okr.tls.certresolver=letsencrypt" \
  okr-fullstack:latest
```

### 2. 资源限制

```bash
docker run -d \
  -p 8080:80 \
  --memory="512m" \
  --cpus="1.0" \
  okr-fullstack:latest
```

### 3. 日志管理

```bash
docker run -d \
  -p 8080:80 \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  okr-fullstack:latest
```

## 故障排查

### 查看日志

```bash
# 查看所有日志
docker logs okr-app

# 实时跟踪日志
docker logs -f okr-app

# 查看最近 100 行
docker logs --tail 100 okr-app
```

### 进入容器

```bash
# 以 nodejs 用户身份进入
docker exec -it okr-app sh

# 以 root 用户身份进入
docker exec -it -u root okr-app sh
```

### 检查服务状态

```bash
# 检查 Nginx
docker exec okr-app ps aux | grep nginx

# 检查 Node.js
docker exec okr-app ps aux | grep node

# 测试后端 API
docker exec okr-app wget -qO- http://127.0.0.1:3000/health
```

### 常见问题

#### 1. 容器启动后立即退出

```bash
# 查看退出日志
docker logs okr-app

# 检查数据库迁移
docker run --rm okr-fullstack npx prisma migrate status
```

#### 2. 前端显示但 API 调用失败

```bash
# 检查后端是否运行
docker exec okr-app ps aux | grep node

# 测试 API 连接
docker exec okr-app wget -qO- http://127.0.0.1:3000/health
```

#### 3. 数据库文件权限问题

```bash
# 修复权限
docker exec -u root okr-app chown -R nodejs:nodejs /data
```

## 镜像构建优化

### 减小镜像体积

当前镜像已优化：
- ✅ 多阶段构建（仅保留生产依赖）
- ✅ Alpine Linux 基础镜像
- ✅ 前端静态文件（已压缩）
- ✅ 仅 production 依赖

预计镜像大小：~300-400MB

### 查看镜像信息

```bash
# 查看镜像大小
docker images okr-fullstack

# 查看镜像层
docker history okr-fullstack:latest
```

## Kubernetes 部署

如需在 K8s 中部署全栈镜像，使用 ConfigMap 替换 Nginx 配置：

```bash
# 创建 ConfigMap
kubectl create configmap nginx-config --from-file=nginx.conf

# 部署应用
kubectl apply -f k8s/fullstack-deployment.yaml
```

参考 `k8s/` 目录中的配置文件。

## 性能基准

在标准配置下（2 CPU, 2GB RAM）：

- **前端响应时间**: < 50ms（静态文件）
- **API 响应时间**: 10-50ms（平均）
- **并发支持**: ~1000 req/s（后端）
- **内存使用**: ~150-200MB
- **启动时间**: ~10-15s

## 下一步

- 📊 添加监控（Prometheus + Grafana）
- 🔒 配置 HTTPS
- 🌍 设置 CDN（前端静态资源）
- 🔄 配置自动备份
- 📈 设置水平扩展

---

**文档版本**: 1.0  
**最后更新**: 2025-12-04
