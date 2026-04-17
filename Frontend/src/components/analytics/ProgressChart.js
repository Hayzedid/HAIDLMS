import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function ProgressChart({ title, data, type = 'bar', height = 300, }) {
    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const defaultColors = [
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#ef4444',
        '#8b5cf6',
        '#ec4899',
    ];
    return (_jsxs("div", { style: {
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px',
        }, children: [_jsx("h3", { style: { fontSize: '18px', fontWeight: 600, marginBottom: '20px' }, children: title }), type === 'bar' ? (_jsx("div", { style: {
                    height: `${height}px`,
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '12px',
                    paddingBottom: '10px',
                }, children: data.map((item, index) => {
                    const barHeight = (item.value / maxValue) * (height - 50);
                    const color = item.color || defaultColors[index % defaultColors.length];
                    return (_jsxs("div", { style: {
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                        }, children: [_jsx("div", { style: {
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#374151',
                                }, children: item.value }), _jsx("div", { style: {
                                    width: '100%',
                                    height: `${barHeight}px`,
                                    backgroundColor: color,
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'height 0.3s ease',
                                }, title: `${item.label}: ${item.value}` }), _jsx("div", { style: {
                                    fontSize: '11px',
                                    color: '#6b7280',
                                    textAlign: 'center',
                                    maxWidth: '80px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }, title: item.label, children: item.label })] }, index));
                }) })) : (
            // Line chart (simple implementation)
            _jsxs("div", { style: { height: `${height}px`, position: 'relative' }, children: [_jsxs("svg", { width: "100%", height: height, style: { display: 'block' }, children: [[0, 25, 50, 75, 100].map((percent) => (_jsx("line", { x1: "0", y1: `${percent}%`, x2: "100%", y2: `${percent}%`, stroke: "#e5e7eb", strokeWidth: "1" }, percent))), data.length > 1 && (_jsx("polyline", { points: data
                                    .map((item, index) => {
                                    const x = (index / (data.length - 1)) * 100;
                                    const y = 100 - (item.value / maxValue) * 80;
                                    return `${x}%,${y}%`;
                                })
                                    .join(' '), fill: "none", stroke: "#3b82f6", strokeWidth: "2" })), data.map((item, index) => {
                                const x = (index / (data.length - 1)) * 100;
                                const y = 100 - (item.value / maxValue) * 80;
                                return (_jsx("circle", { cx: `${x}%`, cy: `${y}%`, r: "4", fill: "#3b82f6", children: _jsx("title", { children: `${item.label}: ${item.value}` }) }, index));
                            })] }), _jsx("div", { style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '8px',
                            fontSize: '11px',
                            color: '#6b7280',
                        }, children: data.map((item, index) => (_jsx("div", { style: { textAlign: 'center' }, children: item.label }, index))) })] }))] }));
}
