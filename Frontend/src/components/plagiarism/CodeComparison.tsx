import { useState, useEffect } from 'react';
import { diffLines, Change } from 'diff';

interface Props {
  code1: string;
  code2: string;
  fileName1?: string;
  fileName2?: string;
  language?: string;
  similarityScore: number;
  matchingLines?: number;
  totalLines?: number;
}

export default function CodeComparison({
  code1,
  code2,
  fileName1 = 'Submission 1',
  fileName2 = 'Submission 2',
  language = 'javascript',
  similarityScore,
  matchingLines,
  totalLines,
}: Props) {
  const [diffResult, setDiffResult] = useState<Change[]>([]);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [highlightCommon, setHighlightCommon] = useState(true);

  useEffect(() => {
    // Calculate diff between the two code snippets
    const diff = diffLines(code1, code2);
    setDiffResult(diff);
  }, [code1, code2]);

  const getSeverityColor = (score: number): string => {
    if (score >= 90) return '#dc2626'; // Critical - Red
    if (score >= 75) return '#f59e0b'; // High - Orange
    if (score >= 60) return '#fbbf24'; // Medium - Yellow
    return '#10b981'; // Low - Green
  };

  const getSeverityLabel = (score: number): string => {
    if (score >= 90) return 'CRITICAL';
    if (score >= 75) return 'HIGH';
    if (score >= 60) return 'MEDIUM';
    return 'LOW';
  };

  const renderSplitView = () => {
    const lines1 = code1.split('\n');
    const lines2 = code2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Left Side - Code 1 */}
        <div>
          <div
            style={{
              backgroundColor: '#1e293b',
              color: 'white',
              padding: '0.75rem 1rem',
              fontWeight: 'bold',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{fileName1}</span>
            <span style={{ fontSize: '14px', opacity: 0.8 }}>{lines1.length} lines</span>
          </div>
          <pre
            style={{
              margin: 0,
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0 0 8px 8px',
              fontSize: '14px',
              lineHeight: '1.6',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              overflow: 'auto',
              maxHeight: '600px',
              border: '1px solid #e2e8f0',
            }}
          >
            {lines1.map((line, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  backgroundColor:
                    highlightCommon && lines2.includes(line) ? '#fef3c7' : 'transparent',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '40px',
                    color: '#94a3b8',
                    textAlign: 'right',
                    marginRight: '1rem',
                    userSelect: 'none',
                  }}
                >
                  {idx + 1}
                </span>
                <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {line || ' '}
                </span>
              </div>
            ))}
          </pre>
        </div>

        {/* Right Side - Code 2 */}
        <div>
          <div
            style={{
              backgroundColor: '#1e293b',
              color: 'white',
              padding: '0.75rem 1rem',
              fontWeight: 'bold',
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{fileName2}</span>
            <span style={{ fontSize: '14px', opacity: 0.8 }}>{lines2.length} lines</span>
          </div>
          <pre
            style={{
              margin: 0,
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0 0 8px 8px',
              fontSize: '14px',
              lineHeight: '1.6',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              overflow: 'auto',
              maxHeight: '600px',
              border: '1px solid #e2e8f0',
            }}
          >
            {lines2.map((line, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  backgroundColor:
                    highlightCommon && lines1.includes(line) ? '#fef3c7' : 'transparent',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '40px',
                    color: '#94a3b8',
                    textAlign: 'right',
                    marginRight: '1rem',
                    userSelect: 'none',
                  }}
                >
                  {idx + 1}
                </span>
                <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {line || ' '}
                </span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    );
  };

  const renderUnifiedView = () => {
    return (
      <div>
        <div
          style={{
            backgroundColor: '#1e293b',
            color: 'white',
            padding: '0.75rem 1rem',
            fontWeight: 'bold',
            borderRadius: '8px 8px 0 0',
          }}
        >
          Unified Diff View
        </div>
        <pre
          style={{
            margin: 0,
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0 0 8px 8px',
            fontSize: '14px',
            lineHeight: '1.6',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            overflow: 'auto',
            maxHeight: '600px',
            border: '1px solid #e2e8f0',
          }}
        >
          {diffResult.map((part, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: part.added
                  ? '#d1fae5'
                  : part.removed
                  ? '#fee2e2'
                  : 'transparent',
                padding: '2px 0',
              }}
            >
              <span
                style={{
                  color: part.added ? '#059669' : part.removed ? '#dc2626' : '#1e293b',
                  fontWeight: part.added || part.removed ? 'bold' : 'normal',
                }}
              >
                {part.added ? '+ ' : part.removed ? '- ' : '  '}
              </span>
              {part.value.split('\n').map((line, lineIdx) => (
                <div key={lineIdx} style={{ paddingLeft: '20px' }}>
                  {line}
                </div>
              ))}
            </div>
          ))}
        </pre>
      </div>
    );
  };

  return (
    <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '12px' }}>
      {/* Header with Similarity Score */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: `2px solid ${getSeverityColor(similarityScore * 100)}`,
        }}
      >
        <div>
          <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Code Similarity Analysis</h3>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            {matchingLines && totalLines
              ? `${matchingLines} of ${totalLines} lines matched`
              : 'Structural similarity detected'}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: getSeverityColor(similarityScore * 100),
              lineHeight: 1,
            }}
          >
            {(similarityScore * 100).toFixed(0)}%
          </div>
          <div
            style={{
              marginTop: '0.25rem',
              fontSize: '12px',
              fontWeight: 'bold',
              color: getSeverityColor(similarityScore * 100),
            }}
          >
            {getSeverityLabel(similarityScore * 100)} SIMILARITY
          </div>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setViewMode('split')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: viewMode === 'split' ? '#2da44e' : '#f1f5f9',
              color: viewMode === 'split' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Split View
          </button>
          <button
            onClick={() => setViewMode('unified')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: viewMode === 'unified' ? '#2da44e' : '#f1f5f9',
              color: viewMode === 'unified' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Unified View
          </button>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={highlightCommon}
            onChange={(e) => setHighlightCommon(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '14px', color: '#64748b' }}>Highlight Common Lines</span>
        </label>
      </div>

      {/* Code Comparison */}
      {viewMode === 'split' ? renderSplitView() : renderUnifiedView()}

      {/* Legend */}
      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#64748b',
        }}
      >
        <strong>Legend:</strong>
        <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                backgroundColor: '#fef3c7',
                marginRight: '0.5rem',
                border: '1px solid #fbbf24',
              }}
            />
            Common lines
          </div>
          <div>
            <span
              style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                backgroundColor: '#d1fae5',
                marginRight: '0.5rem',
                border: '1px solid #059669',
              }}
            />
            Added
          </div>
          <div>
            <span
              style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                backgroundColor: '#fee2e2',
                marginRight: '0.5rem',
                border: '1px solid #dc2626',
              }}
            />
            Removed
          </div>
        </div>
      </div>
    </div>
  );
}
