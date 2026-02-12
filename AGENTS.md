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

### 브랜치 네이밍 컨벤션
- `feature/<기능명>`: 새로운 기능 추가
- `phase3/<기능명>`: Phase 3 관련 기능
- `fix/<버그명>`: 버그 수정
- `refactor/<내용>`: 리팩토링
- `docs/<내용>`: 문서 업데이트

## 작업 시 주의사항

1. **타입 정의**: `shared/src/types.ts`에 공통 타입이 정의되어 있습니다. 클라이언트-서버 간 통신 시 이 타입을 사용하세요.

2. **WebSocket 메시지**: 모든 WebSocket 메시지는 `WSMessage<T>` 형식을 따릅니다.

3. **최신 라이브러리**: 새 의존성을 추가할 때는 가급적 최신 버전을 사용하세요.

4. **모노레포 패키지 추가**:
   - 워크스페이스 전체: `pnpm add -w <package>`
   - 특정 패키지: `cd <package> && pnpm add <package>`

## 개발 단계 및 검증 체크리스트

### Phase 1: 기본 펜 그리기 ✅ 완료
- [x] 프로젝트 세팅 완료
- [x] Canvas 요소 렌더링
- [x] 마우스 드래그로 선 그리기
- [x] 색상 선택 UI (8개 프리셋 색상)
- [x] 선 굵기 조절 (1-20px, 실시간 미리보기)
- [x] 캔버스 지우기

**구현 내역**:
- Canvas 컴포넌트: 전체 화면 캔버스, 마우스 이벤트 처리
- useDrawing 훅: 임페러티브 렌더링으로 성능 최적화
- Toolbar 컴포넌트: 색상 팔레트, 선 굵기 슬라이더, 지우기 버튼
- 유틸리티: drawingUtils (렌더링), idGenerator (ID 생성)
- shared 패키지: 빌드 없이 TypeScript 소스 직접 사용

### Phase 2: 실시간 동기화 ✅ 완료
- [x] WebSocket 서버 연결
- [x] 그림 데이터 브로드캐스트
- [x] 여러 브라우저에서 동시 작업 테스트
- [x] 새 사용자 입장 시 기존 그림 동기화

**구현 내역**:
- 서버: Node.js 네이티브 TypeScript 실행 (tsx 제거)
- 서버: 타입 기반 메시지 라우팅 (join, draw, clear, sync)
- 서버: 스트로크 히스토리 관리 + 송신자 제외 broadcast
- useWebSocket 훅: 연결 관리, 자동 재연결 (3초), 타입 안전한 메시지 전송
- useDrawing 훅: WebSocket 연동, 원격 핸들러 (handleRemoteStroke/Clear/Sync)
- App.tsx: useRef로 순환 의존 해결, 메시지 라우팅
- Per-stroke 전송: mouseUp/Leave 시점에 완성된 stroke 전송

### Phase 3: 추가 기능
- [x] 지우개 도구
- [ ] 도형 도구 (사각형, 원, 선)
- [ ] 텍스트 추가
- [x] Undo/Redo
- [ ] 사용자 커서 표시

**구현 내역 (지우개)**:
- useDrawing 훅: tool 상태 추가 ('pen' | 'eraser')
- drawingUtils: globalCompositeOperation을 'destination-out'으로 전환하여 지우개 구현
- Toolbar 컴포넌트: 펫/지우개 토글 버튼 추가, 지우개 선택 시 색상 팔레트 비활성화
- App.tsx: tool/setTool props를 Toolbar에 전달

**구현 내역 (Undo/Redo)**:
- shared/types.ts: MessageType에 'undo'/'redo' 추가, UndoMessagePayload/RedoMessagePayload 인터페이스
- server/index.ts: undo (strokeId로 삭제) / redo (stroke 복원) 핸들러 + broadcast
- useDrawing 훅: redoStack 상태, handleUndo/handleRedo/handleRemoteUndo 핸들러, canUndo/canRedo
- App.tsx: 메시지 라우팅 (undo/redo), 키보드 단축키 (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
- Toolbar: Undo/Redo 버튼 그룹, disabled 상태 스타일링
- Per-user undo: 자신의 마지막 스트로크만 undo (다른 사용자 스트로크 영향 없음)
- 새 스트로크/Clear/Sync 시 redoStack 초기화 (표준 undo/redo 동작)

### 마이그레이션 테스트 (선택)
- [ ] Fabric.js로 전환 요청
- [ ] 기존 기능 정상 작동 확인
- [ ] 코드 품질 비교
- [ ] 마이그레이션 소요 시간 측정

## 작업 규칙

### ✅ DO
- **새 기능은 항상 별도 브랜치에서 작업**하고 PR을 통해 머지한다
- 한 번에 하나의 기능씩 구현하고, 동작 확인 후 다음으로 넘어간다
- `shared/src/types.ts`의 타입을 사용하여 타입 안정성을 유지한다
- 구현 후 테스트/확인 방법을 안내한다
- 작업 완료 시 이 파일의 체크리스트와 프로젝트 상태를 업데이트한다
- 기존 코드의 패턴과 컨벤션을 따른다
- PR 생성 시 테스트 결과와 스크린샷(필요 시)을 포함한다

### ❌ DON'T
- main 브랜치에 직접 커밋하지 않는다 (문서 업데이트 제외)
- 여러 기능을 한꺼번에 구현하지 않는다
- 동작 검증 없이 다음 단계로 넘어가지 않는다
- 기존 아키텍처 패턴(임페러티브 렌더링, 훅 기반 로직 분리)을 무시하지 않는다

## Phase 1 구현 참고 (기존 코드 이해용)

### 아키텍처
- **App.tsx**: useDrawing 훅 호출, 상태 관리
- **Canvas**: props로 핸들러 전달받아 마우스 이벤트 바인딩
- **useDrawing**: 임페러티브 렌더링 (mousemove 중 ctx에 직접 그림)
- **Toolbar**: 색상 팔레트, 선 굵기 슬라이더, 지우기 버튼

### 핵심 구현 패턴
- 좌표 변환: `getBoundingClientRect()`로 정확한 캔버스 좌표 계산
- `lineCap/lineJoin: 'round'`: 부드러운 선 외관
- 임페러티브 렌더링: 성능 최적화를 위해 mousemove 중 직접 ctx 조작

## Phase 2 구현 참고 (기존 코드 이해용)

### 아키텍처
- **App.tsx**: useWebSocket + useDrawing 오케스트레이션, 메시지 라우팅
- **useWebSocket**: WebSocket 연결 관리, 자동 재연결, sendMessage 함수 제공
- **useDrawing**: WebSocket 통합, 로컬/원격 액션 처리
- **server/index.ts**: 타입 기반 메시지 처리, 히스토리 관리, broadcast

### 핵심 구현 패턴
- **순환 의존 해결**: App.tsx에서 `messageHandlerRef`로 useWebSocket ↔ useDrawing 연결
- **송신자 제외**: 서버에서 broadcast시 송신자 제외 → 중복 렌더링 방지
- **초기 동기화**: 새 클라이언트 join시 서버가 sync 메시지로 전체 strokes 전송
- **Per-stroke 전송**: 실시간 커서 추적 없이 완성된 선만 전송 (성능 최적화)

### 테스트 방법
```bash
pnpm dev  # 브라우저 2개 이상 창에서 http://localhost:5174 접속
```
자세한 테스트 시나리오는 `TESTING.md` 참조.

---
**마지막 업데이트**: 2026-02-12
**프로젝트 상태**: Phase 3 진행 중 (지우개, Undo/Redo 완료)
**Git 워크플로우**: 브랜치/PR 방식 적용 (2026-02-06부터)
