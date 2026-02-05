import './Toolbar.css';

interface ToolbarProps {
  color: string;
  width: number;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onClear: () => void;
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
  color,
  width,
  onColorChange,
  onWidthChange,
  onClear,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
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
