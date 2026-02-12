import type { DrawingTool } from '@dolcanvas/shared';
import './Toolbar.css';

interface ToolbarProps {
  tool: DrawingTool;
  color: string;
  width: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

const PRESET_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#f44336' },
  { name: 'Blue', value: '#2196f3' },
  { name: 'Green', value: '#4caf50' },
  { name: 'Orange', value: '#ff9800' },
  { name: 'Purple', value: '#9c27b0' },
  { name: 'Brown', value: '#795548' },
  { name: 'White', value: '#ffffff' },
];

export function Toolbar({
  tool,
  color,
  width,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onWidthChange,
  onClear,
  onUndo,
  onRedo,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <span className="toolbar-label">Tool:</span>
        <div className="tool-buttons">
          <button
            className={`tool-button ${tool === 'pen' ? 'selected' : ''}`}
            onClick={() => onToolChange('pen')}
            title="Pen"
            aria-label="Select Pen tool"
          >
            🖊️ Pen
          </button>
          <button
            className={`tool-button ${tool === 'eraser' ? 'selected' : ''}`}
            onClick={() => onToolChange('eraser')}
            title="Eraser"
            aria-label="Select Eraser tool"
          >
            🧹 Eraser
          </button>
          <span className="tool-separator" />
          <button
            className={`tool-button ${tool === 'rectangle' ? 'selected' : ''}`}
            onClick={() => onToolChange('rectangle')}
            title="Rectangle"
            aria-label="Select Rectangle tool"
          >
            ▭ Rect
          </button>
          <button
            className={`tool-button ${tool === 'circle' ? 'selected' : ''}`}
            onClick={() => onToolChange('circle')}
            title="Circle"
            aria-label="Select Circle tool"
          >
            ⭕ Circle
          </button>
          <button
            className={`tool-button ${tool === 'line' ? 'selected' : ''}`}
            onClick={() => onToolChange('line')}
            title="Line"
            aria-label="Select Line tool"
          >
            ╱ Line
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <div className="tool-buttons">
          <button
            className="tool-button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            ↩ Undo
          </button>
          <button
            className="tool-button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            ↪ Redo
          </button>
        </div>
      </div>

      <div className={`toolbar-section ${tool === 'eraser' ? 'dimmed' : ''}`}>
        <span className="toolbar-label">Color:</span>
        <div className="color-palette">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.value}
              className={`color-button ${color === preset.value ? 'selected' : ''}`}
              style={{ backgroundColor: preset.value }}
              onClick={() => onColorChange(preset.value)}
              title={preset.name}
              aria-label={`Select ${preset.name}`}
              disabled={tool === 'eraser'}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <span className="toolbar-label">Width:</span>
        <div className="width-control">
          <input
            type="range"
            min="1"
            max="20"
            value={width}
            onChange={(e) => onWidthChange(Number(e.target.value))}
            className="width-slider"
            aria-label="Line width"
          />
          <div className="width-preview">
            <div
              className="width-preview-dot"
              style={{
                width: `${width}px`,
                height: `${width}px`,
              }}
            />
          </div>
        </div>
      </div>

      <button className="clear-button" onClick={onClear}>
        Clear Canvas
      </button>
    </div>
  );
}
