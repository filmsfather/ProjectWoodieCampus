# 🐙 GitHub 저장소 연결 가이드

## 1. GitHub에서 저장소 생성

1. https://github.com 접속
2. "New repository" 클릭
3. 저장소 정보 입력:
   - **Name**: `woodie-campus`
   - **Description**: `에빙하우스 망각곡선 기반 학습 플랫폼`
   - **Visibility**: Public 또는 Private 선택
   - ❌ **"Initialize with README" 체크 해제** (이미 있음)

## 2. 로컬 저장소와 연결

GitHub에서 저장소 생성 후, 터미널에서 실행:

```bash
# 원격 저장소 추가
git remote add origin https://github.com/YOUR_USERNAME/woodie-campus.git

# 기본 브랜치를 main으로 설정
git branch -M main

# 첫 번째 push
git push -u origin main
```

## 3. SSH 설정 (권장)

HTTPS 대신 SSH 사용 시:

```bash
# SSH 키 생성 (이미 있다면 생략)
ssh-keygen -t ed25519 -C "your_email@example.com"

# SSH 키를 GitHub에 등록 후
git remote set-url origin git@github.com:YOUR_USERNAME/woodie-campus.git
```

## 4. 브랜치 보호 규칙 설정

GitHub 저장소 Settings > Branches:

1. **Add rule** 클릭
2. **Branch name pattern**: `main`
3. 설정 옵션:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Dismiss stale PR approvals when new commits are pushed

## 5. 브랜치 생성 및 첫 번째 기능 개발

```bash
# 개발용 브랜치 생성
git checkout -b feat/frontend-auth-integration

# 작업 후 커밋
git add .
git commit -m "feat(auth): 프론트엔드 인증 상태 관리 구현"

# 원격 브랜치로 push
git push -u origin feat/frontend-auth-integration
```

## 6. Pull Request 생성

1. GitHub 저장소 페이지에서 **"Compare & pull request"** 클릭
2. PR 제목과 내용 작성
3. **Reviewers** 설정 (있다면)
4. **Create pull request** 클릭

## 현재 상태

✅ 로컬 Git 저장소 초기화 완료  
✅ 첫 번째 커밋 완료 (141개 파일)  
✅ 브랜치 전략 문서 생성  
⏳ GitHub 원격 저장소 연결 대기

## 다음 단계

원격 저장소 연결 완료 후:
1. `feat/frontend-auth-integration` 브랜치에서 프론트엔드 작업
2. `feat/problem-solving-system` 브랜치에서 문제 풀이 시스템 구현
3. `feat/review-scheduling` 브랜치에서 복습 스케줄링 시스템 구현