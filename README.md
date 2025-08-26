# Woodie Campus

에빙하우스 망각곡선 기반 학습 플랫폼

## 🏗️ 아키텍처

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Container**: Docker + Docker Compose
- **Authentication**: JWT + Supabase Auth

## 🚀 빠른 시작

### 필수 요구사항

- Docker & Docker Compose
- Node.js 20+ (로컬 개발시)

### 개발 환경 실행

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd ProjectWoodieCampus

# 2. 환경변수 설정
cp .env.docker .env

# 3. Docker Compose로 전체 스택 실행
npm run dev

# 또는 직접 Docker Compose 사용
docker-compose up -d
```

### 접속 URL

- **Nginx Proxy (메인)**: http://localhost (포트 80)
- **Frontend (직접)**: http://localhost:3000 (개발모드만)
- **Backend API (직접)**: http://localhost:3001 (개발모드만)
- **Database**: localhost:5433
- **Redis**: localhost:6379

**추천 접속 방법:**
- **개발**: http://localhost - Nginx를 통한 통합 접속
- **API 테스트**: http://localhost/api - Nginx를 통한 API 접속

### 로그 확인

```bash
# 전체 서비스 로그
npm run dev:logs

# 개별 서비스 로그
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 📦 사용 가능한 스크립트

### 개발 환경

```bash
npm run dev          # 개발 환경 실행
npm run dev:build    # 빌드 후 개발 환경 실행
npm run dev:logs     # 로그 확인
npm run dev:stop     # 서비스 중지
npm run dev:down     # 서비스 중지 및 컨테이너 제거
```

### 운영 환경

```bash
npm run prod         # 운영 환경 실행
npm run prod:build   # 빌드 후 운영 환경 실행
npm run prod:stop    # 운영 환경 중지
npm run prod:down    # 운영 환경 중지 및 컨테이너 제거
```

### 기타

```bash
npm run setup        # 로컬 의존성 설치
npm run clean        # Docker 리소스 정리
```

## 🏛️ 프로젝트 구조

```
ProjectWoodieCampus/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/      # 재사용 컴포넌트
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── hooks/           # 커스텀 훅
│   │   ├── services/        # API 서비스
│   │   ├── types/           # TypeScript 타입
│   │   └── config/          # 설정 파일
│   ├── Dockerfile
│   └── nginx.conf           # Nginx 설정
├── backend/                  # Express 백엔드
│   ├── src/
│   │   ├── routes/          # API 라우트
│   │   ├── controllers/     # 컨트롤러
│   │   ├── middleware/      # 미들웨어
│   │   ├── services/        # 비즈니스 로직
│   │   ├── types/           # TypeScript 타입
│   │   └── config/          # 설정 파일
│   └── Dockerfile
├── nginx/                    # Nginx 리버스 프록시
│   ├── conf.d/              # 가상 호스트 설정
│   │   ├── default.conf     # 개발 환경 설정
│   │   └── production.conf  # 운영 환경 설정
│   ├── nginx.conf           # 메인 Nginx 설정
│   └── Dockerfile
├── database/                 # 데이터베이스 스크립트
│   └── init.sql
├── uploads/                  # 파일 업로드 디렉토리
├── docker-compose.yml        # Docker Compose 설정
├── docker-compose.override.yml # 개발 환경 오버라이드
├── docker-compose.prod.yml   # 운영 환경 설정
└── package.json             # 루트 패키지 설정
```

## 🔧 개발 가이드

### 로컬 개발 (Docker 없이)

```bash
# Backend 개발 서버
cd backend
npm install
npm run dev

# Frontend 개발 서버
cd frontend  
npm install
npm run dev
```

### API 테스트

```bash
# Health Check
curl http://localhost:3001/health

# 인증 API 테스트
curl -X POST http://localhost:3001/api/auth/login
```

## 🗄️ 데이터베이스

### Supabase (운영)

- URL: `https://deplrcqieakarykfcrne.supabase.co`
- 사용자 인증, 파일 저장, 실시간 기능 제공

**데이터베이스 설정:**
1. Supabase 대시보드 > SQL Editor 이동
2. `database/supabase-schema.sql` 실행 (스키마 생성)
3. `database/sample-data.sql` 실행 (샘플 데이터)

**테이블 구조:**
- `users`: 사용자 정보 (admin, teacher, student)
- `problems`: 문제 정보
- `problem_sets`: 문제집 정보
- `solution_records`: 풀이 기록
- `review_schedules`: 복습 스케줄 (에빙하우스 망각곡선)

### PostgreSQL (로컬 개발)

- 컨테이너: `woodie-postgres`
- 포트: 5433 (충돌 방지)
- 초기화 스크립트: `database/init.sql`

## 🔒 환경변수

### Backend (.env)

```bash
NODE_ENV=development
PORT=3001
JWT_SECRET=your_jwt_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

### Frontend (.env)

```bash
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🚢 배포

### Docker로 운영 환경 배포

```bash
# 운영 환경 빌드 및 실행
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# 또는 스크립트 사용
npm run prod:build
```

## 🧪 테스트

```bash
# 데이터베이스 연결 테스트
cd backend
npm run test:db

# Backend 테스트
npm test

# Frontend 테스트
cd ../frontend
npm test

# 데이터베이스 스키마 확인 안내
npm run db:schema
npm run db:sample
```

## 📝 API 문서

개발 서버 실행 후 다음 엔드포인트에서 API 확인:

- Health Check: `GET /health`
- Authentication: `POST /api/auth/login`
- Users: `GET /api/users`
- Problems: `GET /api/problems`

## 🤝 기여하기

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이센스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 확인하세요.