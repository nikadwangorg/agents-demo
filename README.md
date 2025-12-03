# OKR Management App

一个基于 TypeScript、Fastify 和 Prisma 构建的 OKR（Objectives and Key Results）管理系统后端 API。

## 功能特性

- ✅ 创建、查询、删除目标（Objectives）
- ✅ 为目标添加关键结果（Key Results）
- ✅ 更新关键结果的完成进度
- ✅ 自动计算目标完成度（基于 KR 平均值）
- ✅ 完整的输入校验（Zod）
- ✅ 结构化日志（Pino）
- ✅ SQLite 本地持久化（Prisma ORM）
- ✅ RESTful API 设计
- ✅ 完整的单元与集成测试
- ✅ Docker 容器化
- ✅ Kubernetes 部署配置

## 技术栈

- **运行时**: Node.js 22
- **Web 框架**: Fastify
- **数据库**: SQLite (通过 Prisma)
- **校验**: Zod
- **测试**: Vitest + Supertest
- **代码质量**: ESLint + Prettier
- **部署**: Docker + Kubernetes

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件（已提供默认配置）：

```bash
DATABASE_URL="file:./dev.db"
PORT=3000
NODE_ENV=development
```

### 3. 初始化数据库

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务将运行在 `http://localhost:3000`

### 5. 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch
```

## API 文档

### 健康检查

```bash
GET /health
```

### 目标（Objectives）

#### 创建目标

```bash
POST /objectives
Content-Type: application/json

{
  "title": "Launch MVP",
  "description": "Launch our minimum viable product" # 可选
}
```

**响应**: `201 Created`

#### 获取所有目标

```bash
GET /objectives
```

**响应**: `200 OK`

```json
[
  {
    "id": "uuid",
    "title": "Launch MVP",
    "description": "Launch our minimum viable product",
    "createdAt": "2025-12-03T08:00:00.000Z",
    "keyResults": [...],
    "progress": 50.0
  }
]
```

#### 获取单个目标

```bash
GET /objectives/:id
```

**响应**: `200 OK` 或 `404 Not Found`

#### 删除目标

```bash
DELETE /objectives/:id
```

**响应**: `204 No Content` 或 `404 Not Found`

### 关键结果（Key Results）

#### 为目标添加关键结果

```bash
POST /objectives/:id/key-results
Content-Type: application/json

{
  "title": "Get 100 users",
  "targetValue": 100,
  "unit": "users"
}
```

**响应**: `201 Created`

#### 更新关键结果进度

```bash
PATCH /key-results/:id
Content-Type: application/json

{
  "currentValue": 50
}
```

**响应**: `200 OK`

#### 删除关键结果

```bash
DELETE /key-results/:id
```

**响应**: `204 No Content` 或 `404 Not Found`

## 错误响应格式

所有错误均返回统一格式：

```json
{
  "code": "INVALID_INPUT",
  "message": "title: Title is required"
}
```

**错误代码**:
- `INVALID_INPUT` (400): 输入校验失败
- `RESOURCE_NOT_FOUND` (404): 资源不存在
- `INTERNAL_ERROR` (500): 服务器内部错误

## 进度计算规则

- 单个 KR 完成度 = `min((currentValue / targetValue) * 100, 100)`
- 目标完成度 = 所有 KR 完成度的平均值
- 无 KR 的目标进度为 0

## 验证示例

### 创建并追踪一个 OKR

```bash
# 1. 创建目标
curl -X POST http://localhost:3000/objectives \
  -H "Content-Type: application/json" \
  -d '{"title": "Launch MVP", "description": "Q1 2025 Goal"}'

# 响应: {"id": "abc-123", "title": "Launch MVP", ...}

# 2. 添加关键结果
curl -X POST http://localhost:3000/objectives/abc-123/key-results \
  -H "Content-Type: application/json" \
  -d '{"title": "Get 100 users", "targetValue": 100, "unit": "users"}'

# 响应: {"id": "kr-456", "currentValue": 0, ...}

# 3. 更新进度
curl -X PATCH http://localhost:3000/key-results/kr-456 \
  -H "Content-Type: application/json" \
  -d '{"currentValue": 50}'

# 4. 查看进度
curl http://localhost:3000/objectives/abc-123

# 响应: {..., "progress": 50, "keyResults": [{...currentValue: 50}]}
```

## Docker 部署

### 构建镜像

```bash
docker build -t okr-management-app .
```

### 运行容器

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="file:/data/prod.db" \
  -v okr-data:/data \
  okr-management-app
```

## Kubernetes 部署

```bash
# 创建 Secret
kubectl apply -f k8s/secret.yaml

# 部署应用
kubectl apply -f k8s/deployment.yaml

# 创建 Service
kubectl apply -f k8s/service.yaml

# 检查状态
kubectl get pods -l app=okr-management
```

## 项目结构

```
src/
├── models/          # 领域模型与 Zod schema
├── utils/           # 工具函数（错误处理、校验）
├── repositories/    # 数据访问层（Prisma）
├── services/        # 业务逻辑层
├── controllers/     # 请求处理层
├── routes/          # 路由定义
├── app.ts           # Fastify 应用配置
└── server.ts        # 服务启动入口

prisma/
└── schema.prisma    # 数据库模型

tests/
└── api/             # 集成测试

k8s/                 # Kubernetes 配置
```

## 开发命令

```bash
# 开发模式（热重载）
npm run dev

# 构建
npm run build

# 生产启动
npm start

# 代码检查
npm run lint

# 格式化
npm run format

# 数据库操作
npm run prisma:studio    # 打开数据库可视化界面
npm run prisma:migrate   # 创建新迁移
npm run prisma:generate  # 生成 Prisma Client
```

## CI/CD

项目包含 GitHub Actions 工作流，在每次 push 和 PR 时自动运行：

- ✅ 依赖安装
- ✅ 代码检查（ESLint）
- ✅ 测试运行
- ✅ Prisma 迁移校验
- ✅ 构建验证
- ✅ Docker 镜像构建（仅 main 分支）

## 许可证

MIT
