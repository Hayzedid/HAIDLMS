interface ProgressChartProps {
  title: string;
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  type?: 'bar' | 'line';
  height?: number;
}

export default function ProgressChart({
  title,
  data,
  type = 'bar',
  height = 300,
}: ProgressChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const defaultColors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
  ];

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
        {title}
      </h3>

      {type === 'bar' ? (
        <div
          style={{
            height: `${height}px`,
            display: 'flex',
            alignItems: 'flex-end',
            gap: '12px',
            paddingBottom: '10px',
          }}
        >
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * (height - 50);
            const color = item.color || defaultColors[index % defaultColors.length];

            return (
              <div
                key={index}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#374151',
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    width: '100%',
                    height: `${barHeight}px`,
                    backgroundColor: color,
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                  }}
                  title={`${item.label}: ${item.value}`}
                />
                <div
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    textAlign: 'center',
                    maxWidth: '80px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={item.label}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Line chart (simple implementation)
        <div style={{ height: `${height}px`, position: 'relative' }}>
          <svg
            width="100%"
            height={height}
            style={{ display: 'block' }}
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((percent) => (
              <line
                key={percent}
                x1="0"
                y1={`${percent}%`}
                x2="100%"
                y2={`${percent}%`}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}

            {/* Line path */}
            {data.length > 1 && (
              <polyline
                points={data
                  .map((item, index) => {
                    const x = (index / (data.length - 1)) * 100;
                    const y = 100 - (item.value / maxValue) * 80;
                    return `${x}%,${y}%`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />
            )}

            {/* Data points */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - (item.value / maxValue) * 80;

              return (
                <circle
                  key={index}
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="4"
                  fill="#3b82f6"
                >
                  <title>{`${item.label}: ${item.value}`}</title>
                </circle>
              );
            })}
          </svg>

          {/* X-axis labels */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '11px',
              color: '#6b7280',
            }}
          >
            {data.map((item, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
