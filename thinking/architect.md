# Architect Handoff: OKR Management App

本文件基于需求分析文档，完成系统架构设计与技术选型，明确数据与接口规范，并拆解为可执行的开发任务清单，供 Coder 实施。

---

## 1) 架构设计与技术选型

### 技术栈决策
- 前端（Phase 2 可选）：
  - 框架：React 18 + Vite + TypeScript
  - 状态管理：TanStack Query（数据获取与缓存）、轻量本地状态使用 React Context
  - UI 组件库：Chakra UI 或 Ant Design（任选其一）
  - 构建工具：Vite（开发与打包）
- 后端（Phase 1 必做）：
  - 运行时：Node.js 22
  - Web 框架：Fastify（高性能、内置 JSON Schema 支持，适合 REST）
  - 数据库：SQLite（本地文件持久化，适合 MVP），通过 Prisma ORM 管理模型与迁移
  - API 风格：REST + JSON
  - 校验：Zod（请求体与查询参数严格校验）
  - 日志：pino（结构化日志）
- 工具链：
  - Linting：ESLint（typescript-eslint）、Prettier（格式化）
  - 测试：Vitest（单元）、Supertest（API 集成）
  - CI/CD：GitHub Actions（Node 22 下运行 lint、test）；Release 前自动运行数据库迁移

### 架构图示/描述
- 分层（Clean Architecture / 分层职责）：
  - Routes（路由入口）：定义 REST 端点与中间件挂载
  - Controllers（控制器）：解析请求、调用服务、组织响应与错误
  - Services（领域服务）：业务规则与计算（如进度计算、验证逻辑编排）
  - Repositories（数据访问）：封装 Prisma 访问（CRUD、查询组合、事务）
  - Models（领域模型）：类型与 schema 定义（Zod + Prisma）
- 数据流向：
  - Client -> Routes -> Controller -> Service -> Repository -> DB
  - Service 可组合多个 Repository 操作；进度计算在读取时动态完成，不持久化。

### 关键技术问题与解决方案
- 并发与一致性：
  - 关键写操作（新增 KR、更新进度、删除目标）使用 Prisma 事务（`prisma.$transaction`）确保一致性。
  - 进度不落库，避免写入-读取不同步；读取时动态计算。
- 校验与错误：
  - 使用 Zod 的 schema 校验输入，统一转换为标准错误结构 `{ code, message }`。
  - 针对 `targetValue <= 0`、缺失 `title`、不存在的 `objectiveId` 等场景给出 400/404。
- 级联删除：
  - DB 外键 `KeyResult.objectiveId` 设置 `ON DELETE CASCADE`；Repository 层也提供防御性清理。
- 性能与可扩展：
  - Fastify + pino 提供高性能基础；未来可替换 SQLite 为 Postgres/MySQL，保持 Prisma 兼容。
- 安全（MVP 范围）：
  - 内网/单用户默认不开鉴权；若多用户，建议后续加入 JWT（AuthN）与 RBAC（AuthZ），同时增加速率限制与输入过滤。

---

## 2) 接口与数据模型设计

### 数据模型（Schema）
- Objective
  - id: string (UUID)
  - title: string (非空)
  - description?: string
  - createdAt: DateTime (默认 now)
  - keyResults: KeyResult[]
- KeyResult
  - id: string (UUID)
  - objectiveId: string (外键 -> Objective.id，ON DELETE CASCADE)
  - title: string (非空)
  - targetValue: number (必须 > 0)
  - currentValue: number (默认 0，必须 >= 0)
  - unit: string（"percent" | "currency" | "count" 等）

- 进度计算（只读）：
  - 单个 KR 完成度：$krProgress = \min(\frac{currentValue}{targetValue},\ 1) \times 100$（上限 100%）
  - 目标整体进度：$objectiveProgress = \text{avg}(krProgress\ for\ all\ KRs)$
  - 当无 KR 时，进度为 0。

- Prisma 表定义建议（摘要）：
  - Objective(id PK, title, description, createdAt)
  - KeyResult(id PK, objectiveId FK CASCADE, title, targetValue, currentValue, unit, createdAt)

### API 契约（REST）
- 通信协议：HTTP/JSON；错误统一结构 `{ code, message }`
- 端点定义：
  - POST /objectives
    - Request: `{ title: string, description?: string }`
    - Response: `Objective`
    - Status: `201 Created`
    - 错误：`400 INVALID_INPUT`
  - GET /objectives
    - Request: `-`
    - Response: `Objective[]`（包含嵌套 KRs 与计算后的 `progress` 字段）
    - Status: `200 OK`
  - GET /objectives/:id
    - Request: `-`
    - Response: `Objective`（包含 KRs 与计算后的 `progress`）
    - Status: `200 OK` 或 `404 RESOURCE_NOT_FOUND`
  - DELETE /objectives/:id
    - Request: `-`
    - Response: `-`
    - Status: `204 No Content` 或 `404 RESOURCE_NOT_FOUND`
  - POST /objectives/:id/key-results
    - Request: `{ title: string, targetValue: number, unit: string }`
    - Response: `KeyResult`
    - Status: `201 Created` 或 `404 RESOURCE_NOT_FOUND`（Objective 不存在）或 `400 INVALID_INPUT`
  - PATCH /key-results/:id
    - Request: `{ currentValue: number }`
    - Response: `KeyResult`
    - Status: `200 OK` 或 `404 RESOURCE_NOT_FOUND` 或 `400 INVALID_INPUT`
  - DELETE /key-results/:id
    - Request: `-`
    - Response: `-`
    - Status: `204 No Content` 或 `404 RESOURCE_NOT_FOUND`

- 错误与状态码约定：
  - 200 OK / 201 Created / 204 No Content
  - 400 INVALID_INPUT（Zod 校验失败或业务规则不满足）
  - 404 RESOURCE_NOT_FOUND（ID 不存在）
  - 500 INTERNAL_ERROR（未捕获异常）

---

## 3) 项目结构与脚手架

### 目录结构树（后端为先）
```
okr-app/
  src/
    server.ts                # Fastify 启动入口
    app.ts                   # Fastify 实例与通用插件（日志、CORS）
    routes/
      objectives.routes.ts   # 目标相关路由
      keyresults.routes.ts   # KR 相关路由
    controllers/
      objectives.controller.ts
      keyresults.controller.ts
    services/
      objectives.service.ts
      keyresults.service.ts
      progress.service.ts    # 进度计算与聚合
    repositories/
      objectives.repo.ts
      keyresults.repo.ts
    models/
      objectives.model.ts    # TS 类型与 Zod schema
      keyresults.model.ts
    utils/
      errors.ts              # 错误封装与映射
      validation.ts          # Zod 校验助手
  prisma/
    schema.prisma            # Prisma 模型定义（SQLite）
    migrations/              # 自动生成的迁移
  tests/
    api/
      objectives.spec.ts
      keyresults.spec.ts
  .env                       # 数据库文件路径等（如：DATABASE_URL="file:./dev.db"）
  package.json
  README.md
```

### 关键目录职责说明
- `routes`: 将 HTTP 方法与路径映射到对应 controller。
- `controllers`: 入参校验、调用服务、返回数据与错误。
- `services`: 业务逻辑、聚合计算、事务编排。
- `repositories`: 统一封装数据访问（Prisma），便于未来替换数据源。
- `models`: 领域类型与 Zod schema。
- `utils`: 错误与通用工具。
- `prisma`: ORM 模型与迁移；SQLite 文件与迁移记录。
- `tests`: 单元与集成测试（Supertest 驱动 Fastify 实例）。

### 核心依赖（package.json 摘要）
- dependencies：
  - fastify, @fastify/cors, @fastify/swagger（可选用于文档）
  - zod
  - pino
  - prisma, @prisma/client
- devDependencies：
  - typescript, ts-node, vite-node（可选）
  - eslint, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, prettier
  - vitest, supertest
  - dotenv

---

## 4) 开发任务清单（Implementation Tasks）
- [ ] Task 1: 初始化后端项目 —— 设置 `package.json`、`tsconfig.json`、ESLint、Prettier。
- [ ] Task 2: 安装与配置 Fastify —— 创建 `src/app.ts` 与 `src/server.ts`，挂载 pino 日志与 CORS。
- [ ] Task 3: 引入 Prisma + SQLite —— 初始化 `prisma/schema.prisma`，配置 `DATABASE_URL`，生成客户端。
- [ ] Task 4: 定义领域模型与 Zod —— 在 `src/models/` 编写 Objective/KR 的类型与校验。
- [ ] Task 5: 编写 Repository 层 —— `objectives.repo.ts` 与 `keyresults.repo.ts`，包含 CRUD 与事务。
- [ ] Task 6: 编写 Service 层 —— `objectives.service.ts` 与 `keyresults.service.ts`，实现业务规则；`progress.service.ts` 实现进度计算。
- [ ] Task 7: 编写 Controller 层 —— 实现所有 REST 端点（创建、查询、更新、删除）与错误映射。
- [ ] Task 8: 编写 Routes —— 将端点与 controller 绑定。
- [ ] Task 9: 集成测试 —— 使用 Supertest/Vitest 为关键端点编写 Happy Path 与边界用例。
- [ ] Task 10: 添加 API 文档（可选）—— 集成 `@fastify/swagger` 自动生成 OpenAPI。
- [ ] Task 11: CI 配置 —— GitHub Actions 流水线：安装依赖、lint、test、Prisma 迁移校验。
- [ ] Task 12: 前端（可选 Phase 2）—— 使用 React + Vite 搭建仪表盘，接入 REST API 与 TanStack Query。

---

## 5) 交接说明
- 本架构文档位于 `thinking/architect.md`，Coder 请按第 4 节任务清单依序实施。
- 若需扩展到多用户与团队协作，建议在 Service 层引入用户/团队实体与鉴权策略（JWT + RBAC），并在 API 层新增相应端点与权限校验。
