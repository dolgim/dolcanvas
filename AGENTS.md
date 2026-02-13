# dolcanvas - AI 에이전트 작업 가이드

## 프로젝트 컨텍스트

**dolcanvas**는 실시간 공유 그림판 웹 애플리케이션입니다.

- Frontend: React 19 + Vite 7 + TypeScript + Native Canvas API
- Backend: Node.js + TypeScript + ws (WebSocket)
- 구조: 모노레포 (client/server/shared, pnpm workspace)

## 개발 명령어

```bash
# 전체 개발 서버 실행 (client + server 동시)
pnpm dev

# 빌드
pnpm build

# 린트
pnpm lint

# 포맷
pnpm format
```

## Git 워크플로우

**중요**: 각 기능은 별도의 브랜치에서 작업하고 PR(Pull Request)을 통해 main에 머지합니다.

### 브랜치 생성 및 작업
```bash
# 1. main 브랜치에서 최신 상태로 업데이트
git checkout main
git pull origin main

# 2. 기능 브랜치 생성 (네이밍: feature/기능명 또는 phase3/기능명)
git checkout -b feature/undo-redo
# 또는
git checkout -b phase3/shape-tools

# 3. 작업 진행 및 커밋
git add <files>
git commit -m "메시지"

# 4. 브랜치 푸시
git push -u origin feature/undo-redo
```

### PR 생성
```bash
# GitHub CLI 사용 (권장)
gh pr create --title "제목" --body "설명"

# 또는 브라우저에서 GitHub 웹사이트에서 PR 생성
```

### Git Worktree (기본 작업 방식)

**새 브랜치에서 작업할 때는 항상 `git worktree`를 사용한다.** 메인 작업 디렉토리의 브랜치 상태를 변경하지 않아 세션 간 충돌을 방지한다.

```bash
# 1. worktree 생성 (프로젝트 루트의 상위 디렉토리에 생성)
git worktree add ../dolcanvas-<브랜치명> -b <브랜치명>

# 2. worktree 디렉토리로 이동하여 작업
cd ../dolcanvas-<브랜치명>
pnpm install

# 3. 작업 완료 후 메인 디렉토리로 복귀 및 worktree 정리
cd ../dolcanvas
git worktree remove ../dolcanvas-<브랜치명>
```

- 모든 브랜치 작업은 worktree에서 수행한다
- 메인 디렉토리(`dolcanvas/`)는 항상 `main` 브랜치를 유지한다
- worktree 작업 완료 후 반드시 정리한다

### 브랜치 네이밍 컨벤션
- `feature/<기능명>`: 새로운 기능 추가
- `phase3/<기능명>`: Phase 3 관련 기능
- `fix/<버그명>`: 버그 수정
- `refactor/<내용>`: 리팩토링
- `docs/<내용>`: 문서 업데이트

## 작업 진행 상황

개발 단계, 체크리스트, 구현 내역, 다음 작업 등은 Linear를 참조하세요. Linear MCP 도구로 이슈를 조회하고 관리합니다.

## 작업 시 주의사항

1. **타입 정의**: `shared/src/types.ts`에 공통 타입이 정의되어 있습니다. 클라이언트-서버 간 통신 시 이 타입을 사용하세요.

2. **WebSocket 메시지**: 모든 WebSocket 메시지는 `WSMessage<T>` 형식을 따릅니다.

3. **최신 라이브러리**: 새 의존성을 추가할 때는 가급적 최신 버전을 사용하세요.

4. **모노레포 패키지 추가**:
   - 워크스페이스 전체: `pnpm add -w <package>`
   - 특정 패키지: `cd <package> && pnpm add <package>`

## 작업 규칙

### ✅ DO
- **문제가 인식되면 코드 작업 전에 먼저 Linear 이슈를 생성**한다 (버그 리포트, 기능 요청 등)
- **새 기능은 항상 별도 브랜치에서 작업**하고 PR을 통해 머지한다
- 한 번에 하나의 기능씩 구현하고, 동작 확인 후 다음으로 넘어간다
- `shared/src/types.ts`의 타입을 사용하여 타입 안정성을 유지한다
- 구현 후 테스트/확인 방법을 안내한다
- 작업 완료 시 Linear 이슈 상태를 업데이트한다
- 사용자가 후속 작업을 지시하면 Linear에 새 이슈를 생성한다
- 기존 코드의 패턴과 컨벤션을 따른다
- PR 생성 시 테스트 결과와 스크린샷(필요 시)을 포함한다
- 작업 완료 시 `pnpm lint`와 TypeScript 타입 에러가 없는지 반드시 확인한다

### ❌ DON'T
- main 브랜치에 직접 커밋하지 않는다 (문서 업데이트 제외)
- 여러 기능을 한꺼번에 구현하지 않는다
- 동작 검증 없이 다음 단계로 넘어가지 않는다
- 기존 아키텍처 패턴(임페러티브 렌더링, 훅 기반 로직 분리)을 무시하지 않는다
