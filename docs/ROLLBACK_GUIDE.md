# 回滚操作手册

## 快速回滚命令

### 方法 1: Kubernetes Rollout Undo（推荐）

```bash
# 回滚到上一个版本
kubectl rollout undo deployment/okr-management-app -n default

# 等待回滚完成
kubectl rollout status deployment/okr-management-app -n default

# 验证回滚成功
kubectl get pods -l app=okr-management -n default
```

### 方法 2: 重新部署指定版本

```bash
# 查看可用版本
kubectl rollout history deployment/okr-management-app -n default

# 回滚到特定版本（例如 revision 3）
kubectl rollout undo deployment/okr-management-app -n default --to-revision=3
```

### 方法 3: 更新镜像到旧版本

```bash
# 设置镜像为上一个稳定版本
kubectl set image deployment/okr-management-app \
  okr-api=ghcr.io/<org>/okr-system:v1.0.0 \
  -n default

# 监控回滚进度
kubectl rollout status deployment/okr-management-app -n default
```

## 验证回滚成功

```bash
# 1. 检查 Pod 状态
kubectl get pods -l app=okr-management

# 2. 检查镜像版本
kubectl describe pod <pod-name> | grep Image

# 3. 健康检查
./scripts/post-release-verify.sh

# 4. 检查日志
kubectl logs -l app=okr-management --tail=100
```

## 数据库回滚（如需要）

```bash
# 如果包含 Prisma 迁移变更

# 1. 连接到数据库 Pod
kubectl exec -it <pod-name> -- sh

# 2. 查看迁移历史
npx prisma migrate status

# 3. 回滚到特定迁移（慎用）
npx prisma migrate resolve --rolled-back <migration-name>
```

## 紧急联系信息

- **DevOps 团队**: devops@company.com
- **On-Call Engineer**: +1-xxx-xxx-xxxx
- **Incident Slack**: #incidents

## 回滚决策树

```
问题严重程度评估
│
├─ 严重（服务不可用 / 数据丢失风险）
│  └─> 立即执行方法 1: Rollout Undo
│
├─ 中等（功能异常 / 性能下降）
│  └─> 评估修复时间
│     ├─ < 30分钟 → 尝试 Hotfix
│     └─ > 30分钟 → 执行回滚
│
└─ 轻微（日志错误 / UI 问题）
   └─> 计划下次发布修复
```

## 回滚后操作

1. **通知相关团队**
   - 发送 Slack 通知到 #deployments
   - 更新 Status Page（如有）

2. **问题排查**
   - 收集日志: `kubectl logs -l app=okr-management --since=1h > rollback-logs.txt`
   - 分析错误原因
   - 创建 Post-Mortem Issue

3. **修复与重新发布**
   - 在 feature 分支修复问题
   - 运行完整测试套件
   - 重新创建 PR 并审查
   - 小规模测试后再次部署
