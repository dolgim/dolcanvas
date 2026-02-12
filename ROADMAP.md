# dolcanvas 로드맵

## 현재 상태

Phase 3 진행 중, 다음 작업: 사용자 커서 표시

## 다음 작업 (우선순위 순)

1. 사용자 커서 표시
2. ~~의존성 정리~~ ✅ (완료)

## 완료된 작업

### Phase 1: 기본 펜 그리기 ✅

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

**아키텍처**:
- **App.tsx**: useDrawing 훅 호출, 상태 관리
- **Canvas**: props로 핸들러 전달받아 마우스 이벤트 바인딩
- **useDrawing**: 임페러티브 렌더링 (mousemove 중 ctx에 직접 그림)
- **Toolbar**: 색상 팔레트, 선 굵기 슬라이더, 지우기 버튼

**핵심 구현 패턴**:
- 좌표 변환: `getBoundingClientRect()`로 정확한 캔버스 좌표 계산
- `lineCap/lineJoin: 'round'`: 부드러운 선 외관
- 임페러티브 렌더링: 성능 최적화를 위해 mousemove 중 직접 ctx 조작

### Phase 2: 실시간 동기화 ✅

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

**아키텍처**:
- **App.tsx**: useWebSocket + useDrawing 오케스트레이션, 메시지 라우팅
- **useWebSocket**: WebSocket 연결 관리, 자동 재연결, sendMessage 함수 제공
- **useDrawing**: WebSocket 통합, 로컬/원격 액션 처리
- **server/index.ts**: 타입 기반 메시지 처리, 히스토리 관리, broadcast

**핵심 구현 패턴**:
- **순환 의존 해결**: App.tsx에서 `messageHandlerRef`로 useWebSocket ↔ useDrawing 연결
- **송신자 제외**: 서버에서 broadcast시 송신자 제외 → 중복 렌더링 방지
- **초기 동기화**: 새 클라이언트 join시 서버가 sync 메시지로 전체 strokes 전송
- **Per-stroke 전송**: 실시간 커서 추적 없이 완성된 선만 전송 (성능 최적화)

**테스트 방법**:
```bash
pnpm dev  # 브라우저 2개 이상 창에서 http://localhost:5174 접속
```
자세한 테스트 시나리오는 `TESTING.md` 참조.

### Phase 3: 추가 기능 (진행 중)

- [x] 지우개 도구
- [x] Undo/Redo
- [x] 도형 도구 (사각형, 원, 선)
- [x] 텍스트 추가
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

**구현 내역 (도형 도구)**:
- shared/types.ts: DrawingTool에 'rectangle' | 'circle' | 'line' 추가
- drawingUtils.ts: isShapeTool() 헬퍼, drawShape() 함수 (rect/ellipse/line), drawStroke()에서 도형 위임
- useDrawing.ts: 스냅샷 기반 미리보기 (getImageData/putImageData), shapeStartPointRef/lastPointRef로 도형 좌표 관리
- Toolbar.tsx: Rect/Circle/Line 버튼 추가 (구분선으로 펜/지우개와 시각적 분리)
- 제로 사이즈 도형 무시, 드래그 중 원격 스트로크 도착 시 redrawAllStrokes 폴백
- 서버 변경 불필요 (도형도 2포인트 stroke로 표현)

**구현 내역 (텍스트 도구)**:
- shared/types.ts: DrawingTool에 'text' 추가, DrawStroke에 text?/fontSize? 필드 추가
- drawingUtils.ts: isTextTool() 헬퍼, drawText() 함수 (ctx.fillText로 멀티라인 지원), drawStroke()에서 텍스트 위임
- useDrawing.ts: textInput/fontSize 상태, handleMouseDown에서 텍스트 도구 분기, commitText/cancelText 함수
- TextInput.tsx: 캔버스 위 absolute 포지션 textarea (Enter로 확정, Shift+Enter 줄바꿈, Esc 취소, blur 시 자동 확정)
- Canvas.tsx: TextInput 조건부 렌더링 (canvas-container 내 오버레이)
- Toolbar.tsx: Text 버튼 추가 (도형 도구 뒤 separator 후), 텍스트 도구 선택 시 Width→Font Size (12-72px) 전환
- App.tsx: fontSize/textInput/commitText/cancelText props 전달
- 서버 변경 불필요 (텍스트도 DrawStroke로 표현)
- Undo/Redo 자동 지원 (기존 로직 그대로)

## 미래 아이디어 (선택)

### 마이그레이션 테스트
- [ ] Fabric.js로 전환 요청
- [ ] 기존 기능 정상 작동 확인
- [ ] 코드 품질 비교
- [ ] 마이그레이션 소요 시간 측정

### 기타
- 터치 지원
- 고DPI 스케일링

---
**마지막 업데이트**: 2026-02-12
