import { TestResult } from '../../api/ide.api';

interface TestResultsProps {
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  score?: number;
  executionTime?: number;
  showHidden?: boolean;
}

export default function TestResults({
  results,
  totalTests,
  passedTests,
  failedTests,
  score,
  executionTime,
  showHidden = false,
}: TestResultsProps) {
  const allPassed = failedTests === 0 && totalTests > 0;

  return (
    <div style={{ padding: '16px' }}>
      {/* Summary Header */}
      <div
        style={{
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: allPassed ? '#d1fae5' : failedTests > 0 ? '#fee2e2' : '#f3f4f6',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
              {allPassed ? '✓ All Tests Passed!' : `${passedTests}/${totalTests} Tests Passed`}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {passedTests} passed, {failedTests} failed
              {executionTime && ` • ${executionTime}ms`}
            </div>
          </div>
          {score !== undefined && (
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: allPassed ? '#059669' : failedTests > 0 ? '#dc2626' : '#6b7280',
              }}
            >
              {score.toFixed(0)}%
            </div>
          )}
        </div>
      </div>

      {/* Test Cases */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {results.map((result, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              overflow: 'hidden',
              backgroundColor: result.passed ? '#f0fdf4' : '#fef2f2',
            }}
          >
            {/* Test Header */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: result.passed ? '#d1fae5' : '#fee2e2',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>
                  {result.passed ? '✓' : '✗'}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>
                    {result.name}
                    {result.isHidden && !showHidden && (
                      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                        (Hidden Test)
                      </span>
                    )}
                  </div>
                  {result.description && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                      {result.description}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {result.executionTimeMs}ms
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>
                  {result.points}/{result.maxPoints} pts
                </span>
              </div>
            </div>

            {/* Test Details */}
            {!result.passed && (
              <div style={{ padding: '12px 16px' }}>
                {result.error ? (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626', marginBottom: '4px' }}>
                      Error:
                    </div>
                    <pre
                      style={{
                        fontSize: '12px',
                        color: '#991b1b',
                        backgroundColor: '#fef2f2',
                        padding: '8px',
                        borderRadius: '4px',
                        overflow: 'auto',
                        margin: 0,
                      }}
                    >
                      {result.error}
                    </pre>
                  </div>
                ) : (
                  <>
                    {!result.isHidden && result.input && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                          Input:
                        </div>
                        <pre
                          style={{
                            fontSize: '12px',
                            backgroundColor: '#f9fafb',
                            padding: '8px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            margin: 0,
                          }}
                        >
                          {result.input}
                        </pre>
                      </div>
                    )}

                    {!result.isHidden && result.expectedOutput && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                          Expected Output:
                        </div>
                        <pre
                          style={{
                            fontSize: '12px',
                            backgroundColor: '#f9fafb',
                            padding: '8px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            margin: 0,
                          }}
                        >
                          {result.expectedOutput}
                        </pre>
                      </div>
                    )}

                    {result.actualOutput !== undefined && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626', marginBottom: '4px' }}>
                          Your Output:
                        </div>
                        <pre
                          style={{
                            fontSize: '12px',
                            backgroundColor: '#fef2f2',
                            padding: '8px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            margin: 0,
                            color: '#991b1b',
                          }}
                        >
                          {result.actualOutput || '(empty)'}
                        </pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
