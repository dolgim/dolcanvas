# dolcanvas

실시간 공유 그림판 웹 애플리케이션

## 프로젝트 상태
✅ **Phase 1 준비 완료** - 기본 기능 구현 시작 가능

## 기술 스택
- **Frontend**: React 19 + Vite 7 + TypeScript
- **Backend**: Node.js + TypeScript + ws (WebSocket)
- **Canvas**: Native Canvas API
- **패키지 관리**: pnpm workspace
- **코드 품질**: ESLint 9 + Prettier

## 프로젝트 구조
```
dolcanvas/
├── client/          # React 프론트엔드
├── server/          # WebSocket 서버
├── shared/          # 공유 타입 정의
├── AGENTS.md        # AI 에이전트 활용 가이드
├── CLAUDE.md        # Claude Code 작업 가이드
└── PROJECT_PLAN.md  # 프로젝트 계획서
```

## 개발 시작하기

### 1. 의존성 설치
```bash
pnpm install
```

### 2. 개발 서버 실행
```bash
# 전체 (client + server 동시 실행)
pnpm dev

# 또는 개별 실행
cd client && pnpm dev   # Frontend (http://localhost:5173)
cd server && pnpm dev   # Backend (ws://localhost:8080)
```

### 3. 빌드
```bash
pnpm build
```

### 4. 코드 품질
```bash
pnpm lint    # ESLint 검사
pnpm format  # Prettier 포맷팅
```

## 문서
- [프로젝트 계획서](./PROJECT_PLAN.md) - 전체 개발 계획 및 단계별 로드맵
- [AI 에이전트 가이드](./AGENTS.md) - AI 활용 검증 목표 및 가이드라인
- [Claude Code 가이드](./CLAUDE.md) - Claude Code 작업 컨텍스트

## 다음 단계
**Phase 1: 기본 펜 그리기** 구현
- Canvas 요소 렌더링
- 마우스 드래그로 선 그리기
- 색상 선택 UI
- 선 굵기 조절
- 캔버스 지우기

자세한 내용은 [AGENTS.md](./AGENTS.md)를 참조하세요.

---
Created: 2026-02-05
