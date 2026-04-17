import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export default function InsightsCard({ insights }) {
    if (insights.length === 0) {
        return null;
    }
    return (_jsxs("div", { style: {
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
        }, children: [_jsx("h3", { style: { fontSize: '18px', fontWeight: 600, marginBottom: '16px' }, children: "\uD83D\uDCA1 Learning Insights" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: insights.map((insight, index) => {
                    const styles = typeStyles[insight.type];
                    return (_jsx("div", { style: {
                            padding: '16px',
                            backgroundColor: styles.bg,
                            border: `1px solid ${styles.border}`,
                            borderRadius: '8px',
                            borderLeft: `4px solid ${styles.border}`,
                        }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', gap: '12px' }, children: [_jsx("div", { style: { fontSize: '20px' }, children: styles.icon }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: {
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                color: styles.title,
                                                marginBottom: '6px',
                                            }, children: insight.title }), _jsx("div", { style: {
                                                fontSize: '14px',
                                                color: '#374151',
                                                marginBottom: insight.suggestions ? '12px' : '0',
                                            }, children: insight.message }), insight.suggestions && insight.suggestions.length > 0 && (_jsxs("div", { children: [_jsx("div", { style: {
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: '#374151',
                                                        marginBottom: '6px',
                                                    }, children: "Suggestions:" }), _jsx("ul", { style: {
                                                        margin: 0,
                                                        paddingLeft: '20px',
                                                        fontSize: '13px',
                                                        color: '#4b5563',
                                                    }, children: insight.suggestions.map((suggestion, idx) => (_jsx("li", { style: { marginBottom: '4px' }, children: suggestion }, idx))) })] }))] })] }) }, index));
                }) })] }));
}
