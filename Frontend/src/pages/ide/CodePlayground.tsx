import { IDEInterface } from '../../components/ide';
import { useParams } from 'react-router-dom';

/**
 * Standalone code playground page for testing and experimentation
 * Can be accessed at /ide/playground or /lessons/:lessonId/ide
 */
export default function CodePlayground() {
  const { lessonId } = useParams<{ lessonId?: string }>();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          backgroundColor: '#1f2937',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
            💻 Code Playground
          </h1>
          {lessonId && (
            <span style={{ fontSize: '14px', color: '#9ca3af' }}>
              Lesson: {lessonId}
            </span>
          )}
        </div>
        <a
          href="/dashboard"
          style={{
            color: '#60a5fa',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          ← Back to Dashboard
        </a>
      </div>

      {/* IDE Interface */}
      <div style={{ flex: 1, padding: '24px', backgroundColor: '#f9fafb' }}>
        {lessonId ? (
          <IDEInterface
            lessonId={lessonId}
            courseId="00000000-0000-0000-0000-000000000000" // Placeholder for playground
            onSubmissionComplete={(result) => {
              console.log('Submission result:', result);
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
              Select a lesson or use the playground mode to start coding
            </p>
            <IDEInterface
              lessonId="playground"
              courseId="playground"
              initialLanguage="python"
            />
          </div>
        )}
      </div>
    </div>
  );
}
