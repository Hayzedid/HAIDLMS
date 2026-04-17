import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
export default function OutputConsole({ lines, height = '300px', showTimestamps = false, }) {
    const consoleRef = useRef(null);
    // Auto-scroll to bottom when new lines are added
    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [lines]);
    const getLineColor = (type) => {
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
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
        });
    };
    return (_jsx("div", { ref: consoleRef, style: {
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
        }, children: lines.length === 0 ? (_jsx("div", { style: { color: '#666', fontStyle: 'italic' }, children: "Output will appear here..." })) : (lines.map((line, index) => (_jsxs("div", { style: {
                marginBottom: '2px',
                color: getLineColor(line.type),
            }, children: [showTimestamps && (_jsxs("span", { style: { color: '#666', marginRight: '8px' }, children: ["[", formatTimestamp(line.timestamp), "]"] })), line.content] }, index)))) }));
}
