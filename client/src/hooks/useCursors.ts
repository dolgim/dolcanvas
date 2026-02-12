import { useState, useRef, useCallback } from 'react';
import type {
  WSMessage,
  CursorMessagePayload,
  UserInfo,
} from '@dolcanvas/shared';

export interface RemoteCursor {
  x: number;
  y: number;
  colorIndex: number;
}

interface UseCursorsOptions {
  userId: string;
  sendMessage?: <T>(message: WSMessage<T>) => void;
}

const THROTTLE_MS = 50;

export function useCursors({ userId, sendMessage }: UseCursorsOptions) {
  const [remoteCursors, setRemoteCursors] = useState<
    Map<string, RemoteCursor>
  >(new Map());

  const lastSendTimeRef = useRef(0);

  const handleLocalCursorMove = useCallback(
    (x: number, y: number) => {
      if (!sendMessage) return;

      const now = Date.now();
      if (now - lastSendTimeRef.current < THROTTLE_MS) return;
      lastSendTimeRef.current = now;

      const message: WSMessage<CursorMessagePayload> = {
        type: 'cursor',
        payload: { userId, x, y },
        timestamp: now,
      };
      sendMessage(message);
    },
    [userId, sendMessage],
  );

  const handleLocalCursorLeave = useCallback(() => {
    if (!sendMessage) return;

    const message: WSMessage<CursorMessagePayload> = {
      type: 'cursor',
      payload: { userId, x: -1, y: -1 },
      timestamp: Date.now(),
    };
    sendMessage(message);
  }, [userId, sendMessage]);

  const handleRemoteCursor = useCallback(
    (payload: CursorMessagePayload) => {
      if (payload.userId === userId) return;

      setRemoteCursors((prev) => {
        const next = new Map(prev);
        const existing = next.get(payload.userId);
        if (existing) {
          next.set(payload.userId, {
            ...existing,
            x: payload.x,
            y: payload.y,
          });
        }
        // Ignore cursors for unknown users (they should arrive via join/sync first)
        return next;
      });
    },
    [userId],
  );

  const handleUserJoin = useCallback(
    (joinedUserId: string, colorIndex: number) => {
      if (joinedUserId === userId) return;

      setRemoteCursors((prev) => {
        const next = new Map(prev);
        next.set(joinedUserId, { x: -1, y: -1, colorIndex });
        return next;
      });
    },
    [userId],
  );

  const handleUserLeave = useCallback((leftUserId: string) => {
    setRemoteCursors((prev) => {
      const next = new Map(prev);
      next.delete(leftUserId);
      return next;
    });
  }, []);

  const handleUsersSync = useCallback(
    (users: UserInfo[]) => {
      setRemoteCursors(() => {
        const next = new Map<string, RemoteCursor>();
        for (const user of users) {
          if (user.userId !== userId) {
            next.set(user.userId, {
              x: -1,
              y: -1,
              colorIndex: user.colorIndex,
            });
          }
        }
        return next;
      });
    },
    [userId],
  );

  return {
    remoteCursors,
    handleLocalCursorMove,
    handleLocalCursorLeave,
    handleRemoteCursor,
    handleUserJoin,
    handleUserLeave,
    handleUsersSync,
  };
}
