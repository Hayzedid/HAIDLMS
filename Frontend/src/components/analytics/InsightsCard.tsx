interface Insight {
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  suggestions?: string[];
}

interface InsightsCardProps {
  insights: Insight[];
}

const typeStyles = {
  info: {
    bg: '#eff6ff',
    border: '#3b82f6',
    icon: 'ℹ️',
    title: '#1e40af',
  },
  warning: {
    bg: '#fef3c7',
    border: '#f59e0b',
    icon: '⚠️',
    title: '#d97706',
  },
  success: {
    bg: '#f0fdf4',
    border: '#10b981',
    icon: '✅',
    title: '#047857',
  },
  error: {
    bg: '#fef2f2',
    border: '#ef4444',
    icon: '❌',
    title: '#b91c1c',
  },
};

export default function InsightsCard({ insights }: InsightsCardProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
        💡 Learning Insights
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {insights.map((insight, index) => {
          const styles = typeStyles[insight.type];

          return (
            <div
              key={index}
              style={{
                padding: '16px',
                backgroundColor: styles.bg,
                border: `1px solid ${styles.border}`,
                borderRadius: '8px',
                borderLeft: `4px solid ${styles.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ fontSize: '20px' }}>{styles.icon}</div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: styles.title,
                      marginBottom: '6px',
                    }}
                  >
                    {insight.title}
                  </div>

                  <div
                    style={{
                      fontSize: '14px',
                      color: '#374151',
                      marginBottom: insight.suggestions ? '12px' : '0',
                    }}
                  >
                    {insight.message}
                  </div>

                  {insight.suggestions && insight.suggestions.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#374151',
                          marginBottom: '6px',
                        }}
                      >
                        Suggestions:
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: '20px',
                          fontSize: '13px',
                          color: '#4b5563',
                        }}
                      >
                        {insight.suggestions.map((suggestion, idx) => (
                          <li key={idx} style={{ marginBottom: '4px' }}>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
