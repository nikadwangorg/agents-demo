# Pre-Release Checklist

发布前必须完成以下所有检查项。

## 代码质量 ✅

- [ ] ✅ CI 测试全部通过（绿灯）
- [ ] ✅ Code Review 完成（至少 1 人审批）
- [ ] ✅ 无 TypeScript 编译错误
- [ ] ✅ ESLint/Prettier 检查通过

## 安全检查 ⚠️

- [ ] npm audit 无高危漏洞（运行 `npm audit --production`）
- [ ] CodeQL 扫描通过（GitHub Security 标签页）
- [ ] Trivy 镜像扫描无 CRITICAL 漏洞
- [ ] Gitleaks 未检测到硬编码密钥

**操作**: 运行 `.github/workflows/security.yml` 并检查报告

## 部署准备 ⚠️

- [ ] Kubernetes manifests 验证完成
  ```bash
  kubectl apply --dry-run=client -f k8s/
  ```
- [ ] GitHub Secret `KUBE_CONFIG` 已配置
  - 位置: Organization Settings → Secrets and variables → Actions
  - 验证: Base64 编码的 kubeconfig 文件
- [ ] 数据库迁移脚本已就绪
  ```bash
  npx prisma migrate diff
  ```
- [ ] 环境变量已确认
  - `DATABASE_URL`
  - `PORT`
  - `LOG_LEVEL`
- [ ] 资源配额已设置（deployment.yaml）
  - requests: memory=128Mi, cpu=100m
  - limits: memory=512Mi, cpu=500m

## 文档与监控 📚

- [ ] ✅ API 文档已更新（thinking/analyst.md）
- [ ] ✅ README 已同步
- [ ] 监控告警已配置（首次部署后设置）
  - Prometheus scraping target
  - Grafana dashboard
  - Alertmanager rules
- [ ] 日志收集已配置（首次部署后设置）
  - ELK Stack / Loki
  - Log retention policy

## 回滚预案 📋

- [ ] ✅ 回滚操作手册已准备（docs/ROLLBACK_GUIDE.md）
- [ ] 数据库回滚脚本已准备（如有 schema 变更）
- [ ] 备份验证完成（数据库快照可恢复）
  ```bash
  # 验证备份可用性
  kubectl exec -it <pod> -- npx prisma db pull
  ```

## 测试验证 ✅

- [ ] ✅ 本地环境测试通过
  ```bash
  npm run dev
  curl http://localhost:3000/health
  ```
- [ ] ✅ 单元测试与集成测试通过（26/26）
  ```bash
  npm test
  ```
- [ ] 测试环境冒烟测试通过
  ```bash
  ./scripts/post-release-verify.sh
  ```

## 沟通与协调 📢

- [ ] 发布窗口已确认（避开高峰时段）
- [ ] 相关团队已通知（前端、产品、QA）
- [ ] On-Call 工程师已指定
- [ ] 发布公告已准备（Slack / Email）

---

## 检查命令快速参考

```bash
# 代码质量
npm run lint
npm test
npm run build

# 安全检查
npm audit --production --audit-level=high
docker build -t okr-test . && docker scan okr-test

# 部署验证
kubectl apply --dry-run=client -f k8s/
kubectl get secret -n default | grep okr-secrets

# 环境检查
echo $DATABASE_URL
npx prisma migrate status
```

---

**审批签字**:
- [ ] Tech Lead: _______________  Date: _______
- [ ] DevOps: _______________  Date: _______
- [ ] Security: _______________  Date: _______

**发布时间**: _______________  
**发布人**: _______________
