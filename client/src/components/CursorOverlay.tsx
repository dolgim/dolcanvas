import type { RemoteCursor } from '../hooks/useCursors';
import './CursorOverlay.css';

const CURSOR_COLORS = [
  '#e74c3c', // red
  '#3498db', // blue
  '#2ecc71', // green
  '#f39c12', // orange
  '#9b59b6', // purple
  '#1abc9c', // teal
  '#e91e63', // pink
  '#795548', // brown
];

interface CursorOverlayProps {
  cursors: Map<string, RemoteCursor>;
}

export function CursorOverlay({ cursors }: CursorOverlayProps) {
  const entries: [string, RemoteCursor][] = [];
  cursors.forEach((cursor, userId) => {
    if (cursor.x >= 0 && cursor.y >= 0) {
      entries.push([userId, cursor]);
    }
  });

  return (
    <div className="cursor-overlay">
      {entries.map(([userId, cursor]) => {
        const color = CURSOR_COLORS[cursor.colorIndex % CURSOR_COLORS.length];
        const label = `User ${userId.slice(-4)}`;

        return (
          <div
            key={userId}
            className="remote-cursor"
            style={{
              transform: `translate(${cursor.x}px, ${cursor.y}px)`,
            }}
          >
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.5 0.5L15 10.5L8 11.5L5 19L0.5 0.5Z"
                fill={color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>
            <span
              className="cursor-label"
              style={{ backgroundColor: color }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
