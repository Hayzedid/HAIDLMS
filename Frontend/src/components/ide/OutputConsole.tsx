import { useEffect, useRef } from 'react';

interface OutputLine {
  type: 'stdout' | 'stderr' | 'system' | 'error' | 'success';
  content: string;
  timestamp: number;
}

interface OutputConsoleProps {
  lines: OutputLine[];
  height?: string;
  showTimestamps?: boolean;
}

export default function OutputConsole({
  lines,
  height = '300px',
  showTimestamps = false,
}: OutputConsoleProps) {
  const consoleRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [lines]);

  const getLineColor = (type: OutputLine['type']) => {
    switch (type) {
      case 'stdout':
        return '#d4d4d4';
      case 'stderr':
        return '#f87171';
      case 'error':
        return '#ef4444';
      case 'success':
        return '#10b981';
      case 'system':
        return '#60a5fa';
      default:
        return '#d4d4d4';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  return (
    <div
      ref={consoleRef}
      style={{
        height,
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: "'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace",
        fontSize: '13px',
        padding: '12px',
        overflowY: 'auto',
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        borderRadius: '4px',
        border: '1px solid #333',
      }}
    >
      {lines.length === 0 ? (
        <div style={{ color: '#666', fontStyle: 'italic' }}>
          Output will appear here...
        </div>
      ) : (
        lines.map((line, index) => (
          <div
            key={index}
            style={{
              marginBottom: '2px',
              color: getLineColor(line.type),
            }}
          >
            {showTimestamps && (
              <span style={{ color: '#666', marginRight: '8px' }}>
                [{formatTimestamp(line.timestamp)}]
              </span>
            )}
            {line.content}
          </div>
        ))
      )}
    </div>
  );
}

export type { OutputLine };
