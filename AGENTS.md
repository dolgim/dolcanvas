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
- [ ] 도형 도구 (사각형, 원, 선)
- [ ] 텍스트 추가
- [ ] 지우개 도구
- [ ] Undo/Redo
- [ ] 사용자 커서 표시

### 마이그레이션 테스트 (선택)
- [ ] Fabric.js로 전환 요청
- [ ] 기존 기능 정상 작동 확인
- [ ] 코드 품질 비교
- [ ] 마이그레이션 소요 시간 측정

## 작업 규칙

### ✅ DO
- 한 번에 하나의 기능씩 구현하고, 동작 확인 후 다음으로 넘어간다
- `shared/src/types.ts`의 타입을 사용하여 타입 안정성을 유지한다
- 구현 후 테스트/확인 방법을 안내한다
- 작업 완료 시 이 파일의 체크리스트와 프로젝트 상태를 업데이트한다
- 기존 코드의 패턴과 컨벤션을 따른다

### ❌ DON'T
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
**마지막 업데이트**: 2026-02-05
**프로젝트 상태**: Phase 2 완료, Phase 3 대기 중
