import { useRef } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { useDrawing } from './hooks/useDrawing';
import './App.css';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    color,
    width,
    setColor,
    setWidth,
    handleClear,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  } = useDrawing({
    canvasRef,
  });

  return (
    <div className="app">
      <Toolbar
        color={color}
        width={width}
        onColorChange={setColor}
        onWidthChange={setWidth}
        onClear={handleClear}
      />
      <Canvas
        canvasRef={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}

export default App;
