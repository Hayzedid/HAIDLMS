import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export default function MetricsCard({ title, value, subtitle, icon, trend, color = 'blue', }) {
    const colors = colorMap[color];
    return (_jsxs("div", { style: {
            padding: '20px',
            backgroundColor: colors.bg,
            borderRadius: '8px',
            border: `1px solid ${colors.border}`,
        }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: {
                                    fontSize: '14px',
                                    color: colors.accent,
                                    fontWeight: 500,
                                    marginBottom: '8px',
                                }, children: title }), _jsx("div", { style: {
                                    fontSize: '32px',
                                    fontWeight: 700,
                                    color: colors.text,
                                    marginBottom: '4px',
                                }, children: value }), subtitle && (_jsx("div", { style: { fontSize: '12px', color: '#6b7280' }, children: subtitle }))] }), icon && (_jsx("div", { style: { fontSize: '28px', opacity: 0.7 }, children: icon }))] }), trend && (_jsxs("div", { style: {
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                }, children: [_jsxs("span", { style: {
                            color: trend.value > 0 ? '#10b981' : trend.value < 0 ? '#ef4444' : '#6b7280',
                            fontWeight: 600,
                        }, children: [trend.value > 0 && '↑', trend.value < 0 && '↓', trend.value === 0 && '→', ' ', Math.abs(trend.value), "%"] }), _jsx("span", { style: { color: '#6b7280' }, children: trend.label })] }))] }));
}
