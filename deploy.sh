#!/bin/bash

# Woodie Campus 배포 스크립트

echo "🚀 Woodie Campus 배포를 시작합니다..."

# 컨테이너 중지 및 제거
echo "📦 기존 컨테이너를 중지하고 제거합니다..."
docker compose down || true

# 최신 코드 업데이트
echo "📥 최신 코드를 가져옵니다..."
git pull origin main

# 환경변수 파일 확인
if [ ! -f ".env.prod" ]; then
    echo "❌ .env.prod 파일이 없습니다. 환경변수를 설정해주세요."
    exit 1
fi

# 프로덕션 환경으로 빌드 및 시작
echo "🏗️  프로덕션 환경으로 빌드합니다..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 상태 확인
echo "⏳ 컨테이너 시작을 기다립니다..."
sleep 10

echo "📊 컨테이너 상태를 확인합니다..."
docker ps

echo "🏥 서비스 health check를 수행합니다..."
sleep 5

# API health check
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"test","password":"test"}' || echo "FAIL")

if [ "$API_STATUS" = "401" ] || [ "$API_STATUS" = "400" ]; then
    echo "✅ API 서버가 정상적으로 응답하고 있습니다 (HTTP $API_STATUS)"
else
    echo "❌ API 서버 응답에 문제가 있습니다 (HTTP $API_STATUS)"
fi

# 로그 확인
echo "📋 최근 로그를 확인합니다..."
echo "--- Backend 로그 ---"
docker logs woodie-backend --tail=10
echo ""
echo "--- Nginx 로그 ---" 
docker logs woodie-nginx --tail=10

echo "🎉 배포가 완료되었습니다!"
echo "🌐 웹사이트: http://$(curl -s ifconfig.me)/"