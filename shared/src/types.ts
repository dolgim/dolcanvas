/**
 * 그리기 도구 타입
 */
export type DrawingTool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line';

/**
 * 그리기 데이터 포인트
 */
export interface DrawPoint {
  x: number;
  y: number;
  timestamp: number;
}

/**
 * 그리기 스트로크 (펜 움직임 한 번)
 */
export interface DrawStroke {
  id: string;
  points: DrawPoint[];
  color: string;
  width: number;
  tool: DrawingTool;
  userId: string;
}

/**
 * WebSocket 메시지 타입
 */
export type MessageType =
  | 'draw'
  | 'clear'
  | 'join'
  | 'leave'
  | 'sync'
  | 'undo'
  | 'redo'
  | 'cursor';

/**
 * WebSocket 메시지 기본 구조
 */
export interface WSMessage<T = unknown> {
  type: MessageType;
  payload: T;
  timestamp: number;
}

/**
 * 그리기 메시지 페이로드
 */
export interface DrawMessagePayload {
  stroke: DrawStroke;
}

/**
 * 캔버스 지우기 메시지 페이로드
 */
export interface ClearMessagePayload {
  userId: string;
}

/**
 * 사용자 정보 (커서 색상 배정)
 */
export interface UserInfo {
  userId: string;
  colorIndex: number;
}

/**
 * 사용자 입장 메시지 페이로드
 */
export interface JoinMessagePayload {
  userId: string;
  colorIndex?: number;
}

/**
 * 사용자 퇴장 메시지 페이로드
 */
export interface LeaveMessagePayload {
  userId: string;
}

/**
 * 동기화 메시지 페이로드 (새 사용자에게 현재 상태 전송)
 */
export interface SyncMessagePayload {
  strokes: DrawStroke[];
  users?: UserInfo[];
}

/**
 * Undo 메시지 페이로드
 */
export interface UndoMessagePayload {
  userId: string;
  strokeId: string;
}

/**
 * Redo 메시지 페이로드
 */
export interface RedoMessagePayload {
  userId: string;
  stroke: DrawStroke;
}

/**
 * 커서 위치 메시지 페이로드
 */
export interface CursorMessagePayload {
  userId: string;
  x: number;
  y: number;
}
