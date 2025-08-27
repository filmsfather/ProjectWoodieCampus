#!/bin/bash

# Woodie Campus 통합 배포 스크립트
# 사용법: 
#   ./deploy.sh          # 인터랙티브 모드 (환경 선택)
#   ./deploy.sh dev      # 개발환경 직접 실행
#   ./deploy.sh prod     # 운영환경 직접 실행

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 도움말 출력 함수
show_help() {
    echo ""
    echo "🚀 Woodie Campus 배포 스크립트"
    echo ""
    echo "사용법:"
    echo "  ./deploy.sh          인터랙티브 모드 (추천)"
    echo "  ./deploy.sh dev      개발환경 배포"
    echo "  ./deploy.sh prod     운영환경 배포"
    echo "  ./deploy.sh --help   이 도움말 표시"
    echo ""
    echo "환경별 특징:"
    echo "  🔧 개발환경 (dev):"
    echo "    - Vite HMR 지원으로 실시간 코드 변경 반영"
    echo "    - 개발용 로그 레벨 (debug 포함)"
    echo "    - 빠른 빌드 (캐시 활용)"
    echo "    - 포트: http://localhost:80"
    echo ""
    echo "  🏭 운영환경 (prod):"
    echo "    - 최적화된 정적 빌드"
    echo "    - 프로덕션 로그 레벨"
    echo "    - 보안 헤더 및 캐싱 적용"
    echo "    - CSS/JS 압축 및 최적화"
    echo "    - Health check 포함"
    echo ""
}

# 환경 감지 함수
detect_environment() {
    # CI/CD 환경에서는 프로덕션으로 기본 설정
    if [ ! -z "$CI" ] || [ ! -z "$GITHUB_ACTIONS" ]; then
        echo "prod"
        return
    fi
    
    # 로컬에서는 개발환경으로 기본 설정
    echo "dev"
}

# 인터랙티브 환경 선택
interactive_select() {
    echo ""
    echo -e "${CYAN}🚀 Woodie Campus 배포 스크립트${NC}"
    echo ""
    echo "배포할 환경을 선택하세요:"
    echo ""
    echo -e "  ${GREEN}1) 개발환경 (Development)${NC}"
    echo "     - 빠른 개발을 위한 HMR 지원"
    echo "     - 실시간 코드 변경 반영"
    echo "     - 개발용 로깅"
    echo ""
    echo -e "  ${BLUE}2) 운영환경 (Production)${NC}"
    echo "     - 최적화된 성능"
    echo "     - 보안 설정 적용"
    echo "     - 압축 및 캐싱"
    echo ""
    
    while true; do
        read -p "선택 (1-2): " choice
        case $choice in
            1) echo "dev"; break;;
            2) echo "prod"; break;;
            *) echo -e "${RED}잘못된 선택입니다. 1 또는 2를 입력하세요.${NC}";;
        esac
    done
}

# 메인 로직
main() {
    # 도움말 체크
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_help
        exit 0
    fi
    
    # 환경 결정
    if [ $# -eq 0 ]; then
        # 인수가 없으면 인터랙티브 모드
        ENVIRONMENT=$(interactive_select)
    elif [ "$1" = "dev" ] || [ "$1" = "development" ]; then
        ENVIRONMENT="dev"
    elif [ "$1" = "prod" ] || [ "$1" = "production" ]; then
        ENVIRONMENT="prod"
    else
        echo -e "${RED}❌ 잘못된 환경입니다: $1${NC}"
        show_help
        exit 1
    fi
    
    echo ""
    echo -e "${CYAN}🚀 Woodie Campus 배포 시작 (환경: ${ENVIRONMENT})${NC}"
    
    # 환경별 설정
    case $ENVIRONMENT in
        "dev")
            COMPOSE_FILE="docker-compose.yml"
            ENV_FILE=".env"
            TARGET_ENV="development"
            echo -e "${GREEN}🔧 개발환경으로 배포합니다${NC}"
            ;;
        "prod")
            COMPOSE_FILE="docker-compose.prod.yml"
            ENV_FILE=".env.prod"
            TARGET_ENV="production"
            echo -e "${BLUE}🏭 운영환경으로 배포합니다${NC}"
            ;;
    esac
    
    # 환경변수 파일 확인
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${RED}❌ $ENV_FILE 파일이 없습니다.${NC}"
        if [ "$ENVIRONMENT" = "prod" ]; then
            echo ""
            echo "운영환경 설정 방법:"
            echo "1. 템플릿 복사: cp .env.production .env.prod"
            echo "2. 환경변수 수정: nano .env.prod"
            echo "3. 필수 값들을 실제 값으로 변경"
        else
            echo ""
            echo "개발환경 설정 방법:"
            echo "1. 환경변수 파일 생성: cp .env.example .env"
            echo "2. 필요한 값들 설정"
        fi
        exit 1
    fi
    
    echo -e "${GREEN}✅ 환경변수 파일 확인: $ENV_FILE${NC}"
    
    # 최신 코드 업데이트 (인터랙티브)
    echo ""
    read -p "📥 최신 코드를 가져오시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}📥 Git에서 최신 코드를 가져옵니다...${NC}"
        git pull origin main || {
            echo -e "${YELLOW}⚠️  Git pull 실패. 수동으로 코드를 업데이트하거나 계속 진행하세요.${NC}"
        }
    fi
    
    # 기존 컨테이너 중지
    echo ""
    echo -e "${YELLOW}🛑 기존 컨테이너를 중지하고 정리합니다...${NC}"
    docker compose -f $COMPOSE_FILE down || true
    
    # 운영환경에서는 시스템 정리
    if [ "$ENVIRONMENT" = "prod" ]; then
        echo -e "${YELLOW}🧹 Docker 캐시를 정리합니다 (운영환경)...${NC}"
        docker system prune -f
    fi
    
    # 환경변수 검증 (운영환경)
    if [ "$ENVIRONMENT" = "prod" ]; then
        echo -e "${YELLOW}🔍 운영환경 필수 환경변수를 검증합니다...${NC}"
        source $ENV_FILE
        missing_vars=()
        
        [ -z "$SUPABASE_URL" ] && missing_vars+=("SUPABASE_URL")
        [ -z "$SUPABASE_ANON_KEY" ] && missing_vars+=("SUPABASE_ANON_KEY")
        [ -z "$JWT_SECRET" ] && missing_vars+=("JWT_SECRET")
        
        if [ ${#missing_vars[@]} -gt 0 ]; then
            echo -e "${RED}❌ 필수 환경변수가 누락되었습니다!${NC}"
            printf '%s\n' "${missing_vars[@]}"
            exit 1
        fi
        echo -e "${GREEN}✅ 필수 환경변수 검증 완료${NC}"
    fi
    
    # 빌드 및 시작
    echo ""
    echo -e "${BLUE}🏗️  $TARGET_ENV 환경으로 빌드하고 시작합니다...${NC}"
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        # 운영환경: 캐시 없이 완전 새로 빌드 (CSS 문제 방지)
        echo -e "${BLUE}   - 캐시 없이 완전 새로 빌드 (CSS 최적화 적용)${NC}"
        docker compose -f $COMPOSE_FILE --env-file $ENV_FILE build --no-cache
        docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d
    else
        # 개발환경: 일반 빌드 (빠른 개발)
        echo -e "${GREEN}   - 개발용 빠른 빌드 (HMR 지원)${NC}"
        docker compose -f $COMPOSE_FILE up -d --build
    fi
    
    # 서비스 시작 대기
    echo ""
    echo -e "${YELLOW}⏳ 서비스가 시작되기를 기다립니다...${NC}"
    if [ "$ENVIRONMENT" = "prod" ]; then
        sleep 40  # 운영환경은 빌드 시간 고려
        echo "   운영환경 빌드는 시간이 오래 걸릴 수 있습니다..."
    else
        sleep 20  # 개발환경
    fi
    
    # 컨테이너 상태 확인
    echo ""
    echo -e "${CYAN}📊 컨테이너 상태 확인${NC}"
    docker compose -f $COMPOSE_FILE ps
    
    # Health Check
    echo ""
    echo -e "${CYAN}🏥 서비스 Health Check${NC}"
    sleep 5
    
    # API 건강 상태 확인
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health 2>/dev/null || echo "FAIL")
    
    if [ "$API_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ API Health Check 통과${NC} (HTTP $API_STATUS)"
    else
        # health 엔드포인트가 없는 경우 로그인 API로 테스트
        API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/auth/login -X POST \
            -H "Content-Type: application/json" \
            -d '{"username":"test","password":"test"}' 2>/dev/null || echo "FAIL")
        
        if [ "$API_STATUS" = "401" ] || [ "$API_STATUS" = "400" ]; then
            echo -e "${GREEN}✅ API 서버 정상 응답${NC} (HTTP $API_STATUS)"
        else
            echo -e "${RED}❌ API 서버 응답 문제${NC} (HTTP $API_STATUS)"
        fi
    fi
    
    # Frontend 접근성 확인
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "FAIL")
    if [ "$FRONTEND_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Frontend 접근 가능${NC} (HTTP $FRONTEND_STATUS)"
    else
        echo -e "${RED}❌ Frontend 접근 실패${NC} (HTTP $FRONTEND_STATUS)"
    fi
    
    # 로그 확인 (최근 5줄만)
    echo ""
    echo -e "${CYAN}📋 서비스 로그 (최근 5줄)${NC}"
    
    echo -e "${PURPLE}--- Backend 로그 ---${NC}"
    docker logs woodie-backend --tail=5 2>/dev/null || echo "Backend 로그 없음"
    
    echo -e "${PURPLE}--- Frontend 로그 ---${NC}"
    docker logs woodie-frontend --tail=5 2>/dev/null || echo "Frontend 로그 없음"
    
    echo -e "${PURPLE}--- Nginx 로그 ---${NC}"
    docker logs woodie-nginx --tail=5 2>/dev/null || echo "Nginx 로그 없음"
    
    # 최종 결과
    echo ""
    echo -e "${GREEN}🎉 배포 완료!${NC}"
    echo ""
    echo -e "${CYAN}📋 접속 정보:${NC}"
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "IP조회실패")
        echo -e "${BLUE}🌐 웹사이트: http://$PUBLIC_IP/${NC}"
        echo -e "${BLUE}🔧 API: http://$PUBLIC_IP/api${NC}"
        echo -e "${BLUE}📊 Health: http://$PUBLIC_IP/health${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  운영환경 주의사항:${NC}"
        echo "- 보안을 위해 기본 관리자 비밀번호를 변경하세요"
        echo "- 방화벽 설정을 확인하세요"
        echo "- SSL 인증서 설정을 고려하세요"
    else
        echo -e "${GREEN}🌐 웹사이트: http://localhost${NC}"
        echo -e "${GREEN}🔧 API: http://localhost/api${NC}"
        echo -e "${GREEN}📊 Health: http://localhost/health${NC}"
        echo ""
        echo -e "${GREEN}💡 개발 모드 활성:${NC}"
        echo "- 코드 변경 시 자동 새로고침"
        echo "- 개발자 도구에서 상세한 오류 정보 제공"
    fi
    
    echo ""
    echo -e "${CYAN}📝 유용한 명령어:${NC}"
    echo "  docker compose -f $COMPOSE_FILE logs -f          # 실시간 로그"
    echo "  docker compose -f $COMPOSE_FILE ps               # 컨테이너 상태"
    echo "  docker compose -f $COMPOSE_FILE restart backend  # 서비스 재시작"
    echo "  docker compose -f $COMPOSE_FILE down             # 전체 중지"
    echo ""
}

# 스크립트 실행
main "$@"