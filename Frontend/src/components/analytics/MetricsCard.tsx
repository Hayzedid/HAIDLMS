interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const colorMap = {
  blue: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1e40af',
    accent: '#3b82f6',
  },
  green: {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    text: '#047857',
    accent: '#10b981',
  },
  yellow: {
    bg: '#fef3c7',
    border: '#fde68a',
    text: '#d97706',
    accent: '#f59e0b',
  },
  red: {
    bg: '#fef2f2',
    border: '#fecaca',
    text: '#b91c1c',
    accent: '#ef4444',
  },
  purple: {
    bg: '#f5f3ff',
    border: '#ddd6fe',
    text: '#6d28d9',
    accent: '#8b5cf6',
  },
};

export default function MetricsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
}: MetricsCardProps) {
  const colors = colorMap[color];

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: colors.bg,
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '14px',
              color: colors.accent,
              fontWeight: 500,
              marginBottom: '8px',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: colors.text,
              marginBottom: '4px',
            }}
          >
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {subtitle}
            </div>
          )}
        </div>

        {icon && (
          <div style={{ fontSize: '28px', opacity: 0.7 }}>
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
          }}
        >
          <span
            style={{
              color: trend.value > 0 ? '#10b981' : trend.value < 0 ? '#ef4444' : '#6b7280',
              fontWeight: 600,
            }}
          >
            {trend.value > 0 && '↑'}
            {trend.value < 0 && '↓'}
            {trend.value === 0 && '→'}
            {' '}
            {Math.abs(trend.value)}%
          </span>
          <span style={{ color: '#6b7280' }}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
