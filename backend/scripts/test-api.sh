#!/bin/bash

# API 테스트 스크립트
# 사용법: ./scripts/test-api.sh

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🧪 API 테스트 시작..."
echo ""

# 1. 로그인 테스트 (협력사)
echo "1️⃣ 협력사 로그인 테스트..."
SUPPLIER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"supplier@test.com","password":"password123"}')

SUPPLIER_TOKEN=$(echo $SUPPLIER_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$SUPPLIER_TOKEN" ]; then
  echo -e "${RED}❌ 협력사 로그인 실패${NC}"
  echo "Response: $SUPPLIER_RESPONSE"
  exit 1
else
  echo -e "${GREEN}✅ 협력사 로그인 성공${NC}"
  echo "Token: ${SUPPLIER_TOKEN:0:20}..."
fi

echo ""

# 2. 업로드 요청 목록 조회
echo "2️⃣ 업로드 요청 목록 조회 테스트..."
REQUESTS_RESPONSE=$(curl -s -X GET "$BASE_URL/upload-requests" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if echo "$REQUESTS_RESPONSE" | grep -q "error\|Error"; then
  echo -e "${RED}❌ 업로드 요청 목록 조회 실패${NC}"
  echo "Response: $REQUESTS_RESPONSE"
else
  REQUEST_COUNT=$(echo "$REQUESTS_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
  echo -e "${GREEN}✅ 업로드 요청 목록 조회 성공${NC}"
  echo "요청 개수: $REQUEST_COUNT"
fi

echo ""

# 3. LCA 데이터 목록 조회
echo "3️⃣ LCA 데이터 목록 조회 테스트..."
LCA_RESPONSE=$(curl -s -X GET "$BASE_URL/lca-data" \
  -H "Authorization: Bearer $SUPPLIER_TOKEN")

if echo "$LCA_RESPONSE" | grep -q "error\|Error"; then
  echo -e "${RED}❌ LCA 데이터 목록 조회 실패${NC}"
  echo "Response: $LCA_RESPONSE"
else
  LCA_COUNT=$(echo "$LCA_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
  echo -e "${GREEN}✅ LCA 데이터 목록 조회 성공${NC}"
  echo "데이터 개수: $LCA_COUNT"
fi

echo ""

# 4. OEM 로그인 테스트
echo "4️⃣ OEM 로그인 테스트..."
OEM_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"oem@test.com","password":"password123"}')

OEM_TOKEN=$(echo $OEM_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$OEM_TOKEN" ]; then
  echo -e "${RED}❌ OEM 로그인 실패${NC}"
  echo "Response: $OEM_RESPONSE"
else
  echo -e "${GREEN}✅ OEM 로그인 성공${NC}"
fi

echo ""
echo "🎉 테스트 완료!"

