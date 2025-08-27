# Woodie Campus 배포 가이드

## 환경 구분

### 개발환경 (Development)
- **파일**: `docker-compose.yml`
- **특징**: 
  - Vite HMR (Hot Module Replacement) 지원
  - 실시간 코드 변경 반영
  - 개발용 로그 레벨
  - 소스 맵 포함

### 프로덕션 환경 (Production)
- **파일**: `docker-compose.prod.yml`
- **특징**:
  - 정적 빌드된 파일 서빙
  - 최적화된 번들
  - Nginx를 통한 정적 파일 캐싱
  - 압축 및 성능 최적화

## 통합 배포 시스템

### 🚀 빠른 시작 (권장)

```bash
# 인터랙티브 배포 (환경 선택)
./deploy.sh

# 또는 직접 지정
./deploy.sh dev   # 개발환경
./deploy.sh prod  # 운영환경
```

### 📋 환경 설정

#### 개발환경 설정
```bash
# 1. 환경변수 파일 생성
cp .env.example .env

# 2. 필요한 값들 설정
nano .env
```

#### 운영환경 설정
```bash
# 1. 템플릿에서 복사
cp .env.production .env.prod

# 2. 실제 값으로 수정
nano .env.prod
```

필수 환경변수:
```bash
# JWT 설정
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Supabase 설정
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 관리자 계정 자동 생성
AUTO_SEED_ADMIN=true
```

### 🔧 환경별 특징

**개발환경 (dev):**
- ✅ Vite HMR로 실시간 코드 변경 반영
- ✅ 개발용 상세 로깅
- ✅ 빠른 빌드 (캐시 활용)
- ✅ 소스맵 포함

**운영환경 (prod):**
- ✅ 최적화된 정적 빌드
- ✅ CSS/JS 압축 및 최적화
- ✅ 보안 헤더 적용
- ✅ 캐싱 정책 활성화
- ✅ Health check 엔드포인트

### 📱 사용 예시

```bash
# 도움말 확인
./deploy.sh --help

# 개발환경 배포
./deploy.sh dev

# 운영환경 배포 (EC2)
./deploy.sh prod
```

## 문제해결

### CSS가 로드되지 않는 경우
- **원인**: 개발환경 설정으로 프로덕션 실행
- **해결**: `docker-compose.prod.yml` 사용 확인

### 빌드 실패
```bash
# 캐시 없이 재빌드
docker-compose -f docker-compose.prod.yml build --no-cache

# Docker 시스템 정리
docker system prune -f
```

### API 연결 실패
```bash
# 백엔드 로그 확인
docker-compose -f docker-compose.prod.yml logs backend

# 네트워크 확인
docker network ls
docker network inspect projectwoodiecampus_woodie-network
```

## 서비스 접근

- **프론트엔드**: http://localhost
- **API**: http://localhost/api
- **건강 상태**: http://localhost/health
- **PostgreSQL**: localhost:5433 (개발환경)
- **Redis**: localhost:6379

## 모니터링

```bash
# 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 리소스 사용량
docker stats

# 로그 실시간 확인
docker-compose -f docker-compose.prod.yml logs -f [서비스명]
```

## 백업 및 복원

### 데이터베이스 백업
```bash
# 로컬 PostgreSQL 백업
docker exec woodie-postgres pg_dump -U postgres woodie_campus > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 업로드 파일 백업
```bash
# 업로드 폴더 백업
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz uploads/
```

## SSL/HTTPS 설정 (선택사항)

Let's Encrypt를 사용한 SSL 인증서 설정:

```bash
# Certbot 설치 및 인증서 발급
# 추후 필요 시 구현
```