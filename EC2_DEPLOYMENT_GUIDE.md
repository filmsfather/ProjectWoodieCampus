# 🚀 Woodie Campus EC2 배포 가이드

이 가이드는 AWS EC2에서 Woodie Campus를 배포하는 단계별 과정을 안내합니다.

## 📋 사전 준비사항

### AWS EC2 인스턴스 요구사항
- **인스턴스 타입**: t3.small 이상 (최소 2GB RAM)
- **OS**: Ubuntu 22.04 LTS
- **스토리지**: 20GB 이상
- **보안 그룹**: HTTP(80), HTTPS(443), SSH(22) 포트 열기

### 필요한 계정/서비스
- Supabase 프로젝트 (데이터베이스)
- AWS EC2 인스턴스
- 도메인 (선택사항, IP로도 접근 가능)

## 🎯 배포 액션 단계

### **액션 1: EC2 인스턴스 준비**
```bash
# SSH로 EC2 인스턴스 접속
ssh -i your-key.pem ubuntu@your-ec2-ip

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Git 설치
sudo apt install -y git curl

# 재로그인 (Docker 그룹 권한 적용)
exit
# SSH로 다시 접속
```

**✅ 확인**: `docker --version` 및 `docker-compose --version` 명령어가 정상 작동하는지 확인

---

### **액션 2: 프로젝트 클론 및 설정**
```bash
# 프로젝트 클론
git clone https://github.com/filmsfather/ProjectWoodieCampus.git
cd ProjectWoodieCampus

# 환경변수 파일 생성
cp .env.production .env
```

**✅ 확인**: `.env` 파일이 생성되었는지 확인

---

### **액션 3: 환경변수 설정**
```bash
# .env 파일 편집
nano .env
```

다음 값들을 실제 값으로 변경:
```bash
# JWT Configuration
JWT_SECRET=생성한_강력한_시크릿_키

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=실제_supabase_anon_키
SUPABASE_SERVICE_ROLE_KEY=실제_supabase_service_role_키

# Admin Account
ADMIN_PASSWORD=강력한_관리자_비밀번호

# CORS & API URLs (EC2 퍼블릭 IP로 변경)
CORS_ORIGIN=http://YOUR_EC2_PUBLIC_IP
VITE_API_BASE_URL=http://YOUR_EC2_PUBLIC_IP
```

**✅ 확인**: 모든 `your-`, `실제_` 값들이 실제 값으로 변경되었는지 확인

---

### **액션 4: Supabase 데이터베이스 설정**
Supabase 대시보드에서:
1. SQL 에디터 열기
2. `/database/supabase-schema.sql` 파일 내용 실행
3. 테이블이 생성되었는지 확인

**✅ 확인**: Supabase에서 `users`, `problems`, `problem_sets` 등 테이블이 생성되었는지 확인

---

### **액션 5: 배포 실행**
```bash
# 배포 스크립트 실행
./deploy.sh
```

배포 과정에서 다음이 실행됩니다:
- Docker 이미지 빌드 (5-10분 소요)
- 컨테이너 시작
- 서비스 헬스체크
- 초기 관리자 계정 자동 생성

**✅ 확인**: 배포 스크립트가 "Deployment completed successfully! 🎉" 메시지와 함께 완료

---

### **액션 6: 서비스 접속 테스트**
```bash
# 서비스 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인 (필요시)
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

브라우저에서 접속:
- **프론트엔드**: `http://YOUR_EC2_PUBLIC_IP`
- **백엔드 헬스체크**: `http://YOUR_EC2_PUBLIC_IP/health`
- **API**: `http://YOUR_EC2_PUBLIC_IP/api`

**✅ 확인**: 웹사이트가 정상적으로 로드되는지 확인

---

### **액션 7: 관리자 로그인 테스트**
1. 웹사이트 접속 후 로그인 페이지로 이동
2. 관리자 계정으로 로그인:
   - **사용자명**: `.env`에 설정한 `ADMIN_USERNAME` (기본: admin)
   - **비밀번호**: `.env`에 설정한 `ADMIN_PASSWORD`
3. 관리자 페이지 접속하여 사용자 관리 기능 테스트

**✅ 확인**: 관리자 대시보드에 접근 가능하고 사용자 관리 기능이 작동하는지 확인

---

## 🔧 문제 해결

### 컨테이너가 시작되지 않는 경우
```bash
# 로그 확인
docker-compose -f docker-compose.prod.yml logs

# 컨테이너 재시작
docker-compose -f docker-compose.prod.yml restart
```

### 데이터베이스 연결 오류
1. `.env` 파일의 Supabase 설정 확인
2. Supabase 프로젝트가 활성화되어 있는지 확인
3. 네트워크 연결 상태 확인

### 프론트엔드가 API에 연결되지 않는 경우
1. `.env`의 `VITE_API_BASE_URL`이 올바른 EC2 IP인지 확인
2. EC2 보안 그룹에서 80번 포트가 열려있는지 확인
3. 브라우저 개발자 도구에서 네트워크 오류 확인

## 🔄 업데이트 방법
```bash
# 코드 업데이트
git pull origin main

# 서비스 재빌드 및 재시작
docker-compose -f docker-compose.prod.yml up -d --build

# 또는 배포 스크립트 재실행
./deploy.sh
```

## 📊 모니터링
```bash
# 실시간 로그 보기
docker-compose -f docker-compose.prod.yml logs -f

# 특정 서비스 로그
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# 시스템 리소스 사용량
docker stats

# 컨테이너 상태
docker-compose -f docker-compose.prod.yml ps
```

## 🛡️ 보안 권장사항
1. **방화벽 설정**: 필요한 포트만 열기
2. **SSL 인증서**: Let's Encrypt 사용 권장
3. **정기 업데이트**: 시스템 및 Docker 이미지 업데이트
4. **백업**: 정기적인 데이터베이스 백업
5. **강력한 비밀번호**: JWT secret과 관리자 비밀번호는 복잡하게 설정

## 🎯 성능 최적화
1. **메모리 모니터링**: `htop` 또는 `docker stats` 사용
2. **로그 로테이션**: Docker 로그 크기 제한 설정
3. **이미지 정리**: 정기적으로 `docker system prune` 실행

---

문제가 발생하면 각 액션 단계의 ✅ 확인 사항을 점검하고, 로그를 확인하여 문제를 해결하세요.