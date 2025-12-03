#!/bin/bash
set -e

echo "🚀 Post-Release Verification Script"
echo "===================================="

# 1. 检查 Pod 状态
echo "📦 Checking Pod status..."
kubectl get pods -l app=okr-management -n default
POD_COUNT=$(kubectl get pods -l app=okr-management -n default --no-headers | grep Running | wc -l)
if [ "$POD_COUNT" -lt 2 ]; then
  echo "❌ Expected 2 running pods, found $POD_COUNT"
  exit 1
fi
echo "✅ All pods running"

# 2. 获取 Service IP
echo "🌐 Getting Service IP..."
EXTERNAL_IP=$(kubectl get svc okr-management-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if [ -z "$EXTERNAL_IP" ]; then
  echo "⚠️  LoadBalancer IP not assigned yet, using port-forward"
  kubectl port-forward svc/okr-management-service 8080:80 &
  PF_PID=$!
  sleep 5
  BASE_URL="http://localhost:8080"
else
  echo "✅ Service IP: $EXTERNAL_IP"
  BASE_URL="http://${EXTERNAL_IP}"
fi

# 3. 健康检查
echo "❤️  Health check..."
HEALTH_RESPONSE=$(curl -s ${BASE_URL}/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed: $HEALTH_RESPONSE"
  [ -n "$PF_PID" ] && kill $PF_PID
  exit 1
fi

# 4. 冒烟测试
echo "🧪 Running smoke tests..."

# Test 1: Create Objective
echo "  - Creating objective..."
OBJ_RESPONSE=$(curl -s -X POST ${BASE_URL}/objectives \
  -H "Content-Type: application/json" \
  -d '{"title":"Post-Release Test"}')
OBJ_ID=$(echo "$OBJ_RESPONSE" | jq -r '.id')
if [ -z "$OBJ_ID" ] || [ "$OBJ_ID" == "null" ]; then
  echo "❌ Failed to create objective"
  [ -n "$PF_PID" ] && kill $PF_PID
  exit 1
fi
echo "✅ Objective created: $OBJ_ID"

# Test 2: Create KeyResult
echo "  - Creating key result..."
KR_RESPONSE=$(curl -s -X POST ${BASE_URL}/objectives/${OBJ_ID}/key-results \
  -H "Content-Type: application/json" \
  -d '{"title":"Test KR","targetValue":100,"unit":"tests"}')
KR_ID=$(echo "$KR_RESPONSE" | jq -r '.id')
if [ -z "$KR_ID" ] || [ "$KR_ID" == "null" ]; then
  echo "❌ Failed to create key result"
  [ -n "$PF_PID" ] && kill $PF_PID
  exit 1
fi
echo "✅ KeyResult created: $KR_ID"

# Test 3: Update Progress
echo "  - Updating progress..."
curl -s -X PATCH ${BASE_URL}/key-results/${KR_ID} \
  -H "Content-Type: application/json" \
  -d '{"currentValue":75}' > /dev/null
echo "✅ Progress updated"

# Test 4: Verify Progress Calculation
echo "  - Verifying progress calculation..."
PROGRESS=$(curl -s ${BASE_URL}/objectives/${OBJ_ID} | jq -r '.progress')
if [ "$PROGRESS" != "75" ]; then
  echo "❌ Progress calculation incorrect: expected 75, got $PROGRESS"
  [ -n "$PF_PID" ] && kill $PF_PID
  exit 1
fi
echo "✅ Progress calculation correct: $PROGRESS%"

# Test 5: Cleanup
echo "  - Cleaning up test data..."
curl -s -X DELETE ${BASE_URL}/objectives/${OBJ_ID} > /dev/null
echo "✅ Test data cleaned"

# 5. 日志检查
echo "📋 Checking logs for errors..."
ERROR_COUNT=$(kubectl logs -l app=okr-management --tail=200 | grep -i error | wc -l)
if [ "$ERROR_COUNT" -gt 0 ]; then
  echo "⚠️  Found $ERROR_COUNT error messages in logs"
  kubectl logs -l app=okr-management --tail=50 | grep -i error
else
  echo "✅ No errors in recent logs"
fi

# Cleanup port-forward
[ -n "$PF_PID" ] && kill $PF_PID

echo ""
echo "===================================="
echo "✅ Post-Release Verification Complete"
echo "===================================="
