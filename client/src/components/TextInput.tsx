import { useEffect, useRef } from 'react';

interface TextInputProps {
  position: { x: number; y: number };
  color: string;
  fontSize: number;
  onCommit: (text: string) => void;
  onCancel: () => void;
}

export function TextInput({
  position,
  color,
  fontSize,
  onCommit,
  onCancel,
}: TextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = textareaRef.current?.value ?? '';
      onCommit(text);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      className="canvas-text-input"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        color,
        fontSize: `${fontSize}px`,
        lineHeight: `${fontSize * 1.2}px`,
        fontFamily: 'sans-serif',
      }}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        const text = textareaRef.current?.value ?? '';
        onCommit(text);
      }}
    />
  );
}
