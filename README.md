# dolcanvas

실시간 공유 그림판 웹 애플리케이션

## 프로젝트 목적

AI 에이전트(특히 Claude Code)를 활용한 개발 프로세스를 검증하기 위한 실험적 프로젝트.

- AI 에이전트가 얼마나 효과적으로 웹 애플리케이션을 개발할 수 있는가?
- 복잡도가 증가할 때 AI가 얼마나 잘 대응하는가?
- 기술 스택 변경(마이그레이션) 시 AI의 역할은?

## 기술 스택

- **Frontend**: React 19 + Vite 7 + TypeScript + Native Canvas API
- **Backend**: Node.js + TypeScript + ws (WebSocket)
- **패키지 관리**: pnpm workspace
- **코드 품질**: ESLint 9 + Prettier

## 프로젝트 구조

```
dolcanvas/
├── client/          # React + Vite 프론트엔드
├── server/          # WebSocket 서버
├── shared/          # 공유 타입 정의
├── AGENTS.md        # AI 에이전트 작업 가이드
└── CLAUDE.md        # Claude Code 진입점
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

## WebSocket 선택 이유

**WebSocket 선택** (WebRTC 대신):
- 구현이 단순하고 직관적
- 방(Room) 관리가 쉬움
- 서버에서 데이터 히스토리 관리 가능
- 나중에 들어온 사용자에게 기존 그림 전송 가능
- 디버깅이 용이함
- 초기 프로토타입에 적합

## 개발 단계

### Phase 1: 기본 펜 그리기 ✅ 완료
- Canvas 요소 렌더링
- 마우스 드래그로 선 그리기
- 색상 선택 UI (8개 프리셋)
- 선 굵기 조절 (1-20px)
- 캔버스 지우기

### Phase 2: 실시간 동기화 (현재)
- WebSocket 연결
- 그림 데이터 브로드캐스트
- 여러 사용자 동시 작업
- 새 사용자 입장 시 기존 그림 동기화

### Phase 3: 추가 기능
- 방(Room) 개념 - 여러 그림판 세션 분리
- 도형 도구 - 사각형, 원, 선 그리기
- 텍스트 추가
- 지우개 도구
- Undo/Redo 기능
- 사용자 커서 표시
- 저장/불러오기

## AI 에이전트 활용 방향

### 1. 점진적 기능 개발
각 Phase를 단계적으로 구현하면서 AI가 얼마나 효과적으로 기능을 구현하는지 관찰합니다.

### 2. 코드 품질 검증
- AI가 생성한 코드의 품질
- TypeScript 타입 안정성
- 버그 발생 빈도
- 코드 가독성 및 유지보수성

### 3. 라이브러리 마이그레이션 테스트
**중요**: 이 프로젝트는 Native Canvas API로 시작하지만, 나중에 Fabric.js나 Konva.js로 마이그레이션하는 것을 고려합니다.

**테스트 시나리오**:
1. Native Canvas로 기본 기능 구현
2. 도형/텍스트 기능 추가 시 복잡도 증가 관찰
3. Fabric.js로 마이그레이션 요청
4. AI가 마이그레이션을 얼마나 효과적으로 수행하는가?
5. 기존 기능이 정상 작동하는가?

### 4. 디버깅 및 문제 해결
- AI가 버그를 얼마나 빠르게 진단하고 수정하는가?
- 오류 메시지를 보고 근본 원인을 파악하는가?
- 최적화 제안을 하는가?

## 호스팅 옵션

**현재**: 로컬 개발
**향후 배포 옵션**: Glitch, Render, Railway 등 무료 호스팅 서비스

## 문서화

AI와의 작업 과정에서 다음을 기록하세요:
- 성공적이었던 프롬프트 패턴
- 실패하거나 어려웠던 부분
- AI가 제안한 유용한 개선 사항
- 예상치 못한 버그나 문제

## 문서

- [AI 에이전트 작업 가이드](./AGENTS.md) - 에이전트가 작업할 때 참조하는 기술 가이드
- [Claude Code 진입점](./CLAUDE.md) - Claude Code 작업 시작점

---
**프로젝트 상태**: Phase 1 완료, Phase 2 진행 중
**마지막 업데이트**: 2026-02-05
