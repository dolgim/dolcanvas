# dolcanvas 테스트 가이드

## Phase 2: WebSocket 실시간 공유 테스트

### 준비
```bash
pnpm dev
```
위 명령을 실행하면 서버(ws://localhost:8080)와 클라이언트(http://localhost:5174)가 동시에 시작됩니다.

### 테스트 시나리오

#### 1. 기본 실시간 공유 테스트
1. 브라우저 2개 창(또는 탭)을 열고 http://localhost:5174 접속
2. 창 A에서 펜으로 선을 그립니다
3. ✅ **검증**: 창 B에 즉시 같은 선이 나타나는지 확인
4. 창 B에서 다른 색상으로 선을 그립니다
5. ✅ **검증**: 창 A에 즉시 같은 선이 나타나는지 확인

#### 2. Clear 동기화 테스트
1. 창 A와 B 모두에 여러 개의 선을 그립니다
2. 창 A에서 "Clear Canvas" 버튼 클릭
3. ✅ **검증**: 창 B의 캔버스도 동시에 지워지는지 확인

#### 3. 초기 동기화 테스트 (새 사용자 입장)
1. 창 A에서 여러 개의 선을 그립니다 (다양한 색상과 굵기 사용)
2. 새 창 C를 열고 http://localhost:5174 접속
3. ✅ **검증**: 창 C에 기존에 그려진 모든 선이 즉시 표시되는지 확인

#### 4. 다중 사용자 테스트
1. 브라우저 3개 창(A, B, C)을 동시에 엽니다
2. 각 창에서 서로 다른 색상으로 동시에 그림을 그립니다
3. ✅ **검증**: 모든 창에서 3개 창의 그림이 모두 실시간으로 표시되는지 확인

#### 5. 재연결 테스트
1. 브라우저 개발자 도구(F12) → Network 탭 열기
2. Offline 모드 활성화 (또는 서버 재시작)
3. ✅ **검증**: 콘솔에 "WebSocket disconnected, reconnecting in 3s..." 메시지 확인
4. Offline 모드 해제 (또는 서버 재시작 완료 대기)
5. ✅ **검증**: 3초 후 자동으로 재연결되는지 확인 ("WebSocket connected" 메시지)

### 서버 로그 확인

서버 터미널에서 다음과 같은 로그를 확인할 수 있습니다:

```
WebSocket server is running on ws://localhost:8080
New client connected                    # 클라이언트 접속
Received: join                          # join 메시지 수신
User <userId> joined                    # 사용자 입장
Received: draw                          # 그리기 메시지 수신
Draw stroke: <strokeId>                 # 스트로크 처리
Received: clear                         # 클리어 메시지 수신
User <userId> cleared canvas            # 캔버스 지우기
Client disconnected                     # 클라이언트 연결 해제
```

### 예상 동작

- **로컬 드로잉**: 즉시 화면에 표시 (지연 없음)
- **원격 드로잉**: WebSocket 왕복 시간만큼 지연 (보통 < 50ms)
- **초기 동기화**: 새 클라이언트가 join하면 서버가 전체 히스토리 전송
- **송신자 제외**: 자신이 그린 선은 서버에서 다시 받지 않음 (중복 방지)

### 문제 해결

#### 연결이 안 되는 경우
```bash
# 서버 포트 확인
lsof -i :8080

# 서버 재시작
pkill -f "node --watch"
cd server && pnpm dev
```

#### 클라이언트가 업데이트되지 않는 경우
```bash
# 브라우저 캐시 삭제 후 새로고침 (Cmd+Shift+R / Ctrl+Shift+R)
# 또는 브라우저 개발자 도구에서 "Disable cache" 활성화
```

## Phase 1 기능도 테스트

### 펜 도구
- ✅ 마우스 드래그로 선 그리기
- ✅ 색상 변경 (8가지 프리셋)
- ✅ 선 굵기 조절 (1-20)

### 캔버스
- ✅ 캔버스 지우기 버튼
- ✅ 마우스가 캔버스 밖으로 나가면 그리기 종료

## 다음 Phase 준비

Phase 3에서 추가할 기능:
- 지우개 도구
- Undo/Redo
- 터치 지원 (모바일)
- 고DPI 스케일링
