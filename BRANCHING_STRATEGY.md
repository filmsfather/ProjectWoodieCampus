# 🌿 Git 브랜치 전략

## 브랜치 구조

### `main` 브랜치
- **목적**: 항상 배포 가능한 안정적인 상태 유지
- **보호**: 직접 push 금지, PR을 통한 merge만 허용
- **배포**: 이 브랜치에서 운영 환경으로 자동 배포

### 기능 개발 브랜치: `feat/<기능명>`
```bash
feat/user-authentication     # 사용자 인증 기능
feat/problem-solving-system  # 문제 풀이 시스템
feat/review-scheduling       # 복습 스케줄링
feat/dashboard-ui           # 대시보드 UI
```

### 버그 수정 브랜치: `fix/<버그명>`
```bash
fix/login-token-expire      # 로그인 토큰 만료 문제
fix/problem-display-error   # 문제 표시 오류
fix/database-connection     # 데이터베이스 연결 문제
```

### 기타 작업 브랜치: `chore/<작업명>`
```bash
chore/update-dependencies   # 의존성 업데이트
chore/improve-performance   # 성능 개선
chore/refactor-auth-service # 인증 서비스 리팩토링
```

## 워크플로우

### 1. 새 기능 개발
```bash
# main에서 새 브랜치 생성
git checkout main
git pull origin main
git checkout -b feat/새기능명

# 개발 작업
git add .
git commit -m "feat: 새 기능 구현"
git push origin feat/새기능명

# PR 생성하여 main으로 merge
```

### 2. 버그 수정
```bash
# main에서 수정 브랜치 생성
git checkout main
git pull origin main
git checkout -b fix/버그명

# 버그 수정
git add .
git commit -m "fix: 버그 수정"
git push origin fix/버그명

# PR 생성하여 main으로 merge
```

### 3. 응급 수정 (Hotfix)
```bash
# main에서 직접 수정 (예외적)
git checkout main
git pull origin main
git checkout -b fix/urgent-hotfix

# 응급 수정
git add .
git commit -m "fix: 긴급 보안 패치"
git push origin fix/urgent-hotfix

# 즉시 PR 생성 및 merge
```

## 커밋 메시지 컨벤션

### 형식
```
<type>(<scope>): <description>

<body>

<footer>
```

### 타입
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 형식 변경 (기능 변경 없음)
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스, 도구 설정 등

### 예시
```bash
git commit -m "feat(auth): JWT 토큰 기반 인증 시스템 구현"
git commit -m "fix(api): 사용자 데이터 조회 시 null 체크 추가"
git commit -m "docs: API 문서 업데이트"
git commit -m "chore(deps): Supabase SDK 버전 업데이트"
```

## PR (Pull Request) 가이드

### PR 제목 형식
```
[타입] 간단한 설명 (예: [FEAT] 사용자 인증 시스템 구현)
```

### PR 템플릿
```markdown
## 📋 작업 내용
- [ ] 구현된 기능/수정된 버그 설명
- [ ] 관련 이슈 번호 (#123)

## 🧪 테스트
- [ ] 단위 테스트 통과
- [ ] 통합 테스트 통과
- [ ] 수동 테스트 완료

## 📸 스크린샷 (UI 변경 시)
<!-- 변경 사항의 스크린샷 첨부 -->

## 🔍 리뷰 포인트
- 중점적으로 확인해주었으면 하는 부분
```

## 간단한 릴리즈 전략

### 버전 관리
```bash
v1.0.0 - 초기 릴리즈 (인증 시스템)
v1.1.0 - 문제 풀이 기능 추가
v1.2.0 - 복습 스케줄링 기능 추가
v2.0.0 - 메이저 업데이트 (UI 개편)
```

### 태그 생성
```bash
git tag -a v1.0.0 -m "Release version 1.0.0: 초기 Woodie Campus 시스템"
git push origin v1.0.0
```

## 🚫 금지 사항

1. **main 브랜치에 직접 push 금지**
2. **force push 금지** (`git push --force`)
3. **merge commit 없이 rebase 권장**
4. **작업 중인 브랜치를 다른 사람이 사용하지 않기**

## 📝 참고사항

- 하루 단위로 자주 commit & push 권장
- PR은 가능한 작게, 리뷰하기 쉽게
- 브랜치명은 영어로, 간결하고 명확하게
- 완료된 기능 브랜치는 merge 후 삭제