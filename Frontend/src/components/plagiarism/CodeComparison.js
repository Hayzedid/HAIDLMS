import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { diffLines } from 'diff';
export default function CodeComparison({ code1, code2, fileName1 = 'Submission 1', fileName2 = 'Submission 2', language = 'javascript', similarityScore, matchingLines, totalLines, }) {
    const [diffResult, setDiffResult] = useState([]);
    const [viewMode, setViewMode] = useState('split');
    const [highlightCommon, setHighlightCommon] = useState(true);
    useEffect(() => {
        // Calculate diff between the two code snippets
        const diff = diffLines(code1, code2);
        setDiffResult(diff);
    }, [code1, code2]);
    const getSeverityColor = (score) => {
        if (score >= 90)
            return '#dc2626'; // Critical - Red
        if (score >= 75)
            return '#f59e0b'; // High - Orange
        if (score >= 60)
            return '#fbbf24'; // Medium - Yellow
        return '#10b981'; // Low - Green
    };
    const getSeverityLabel = (score) => {
        if (score >= 90)
            return 'CRITICAL';
        if (score >= 75)
            return 'HIGH';
        if (score >= 60)
            return 'MEDIUM';
        return 'LOW';
    };
    const renderSplitView = () => {
        const lines1 = code1.split('\n');
        const lines2 = code2.split('\n');
        const maxLines = Math.max(lines1.length, lines2.length);
        return (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }, children: [_jsxs("div", { children: [_jsxs("div", { style: {
                                backgroundColor: '#1e293b',
                                color: 'white',
                                padding: '0.75rem 1rem',
                                fontWeight: 'bold',
                                borderRadius: '8px 8px 0 0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }, children: [_jsx("span", { children: fileName1 }), _jsxs("span", { style: { fontSize: '14px', opacity: 0.8 }, children: [lines1.length, " lines"] })] }), _jsx("pre", { style: {
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
                            }, children: lines1.map((line, idx) => (_jsxs("div", { style: {
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    backgroundColor: highlightCommon && lines2.includes(line) ? '#fef3c7' : 'transparent',
                                }, children: [_jsx("span", { style: {
                                            display: 'inline-block',
                                            width: '40px',
                                            color: '#94a3b8',
                                            textAlign: 'right',
                                            marginRight: '1rem',
                                            userSelect: 'none',
                                        }, children: idx + 1 }), _jsx("span", { style: { flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }, children: line || ' ' })] }, idx))) })] }), _jsxs("div", { children: [_jsxs("div", { style: {
                                backgroundColor: '#1e293b',
                                color: 'white',
                                padding: '0.75rem 1rem',
                                fontWeight: 'bold',
                                borderRadius: '8px 8px 0 0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }, children: [_jsx("span", { children: fileName2 }), _jsxs("span", { style: { fontSize: '14px', opacity: 0.8 }, children: [lines2.length, " lines"] })] }), _jsx("pre", { style: {
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
                            }, children: lines2.map((line, idx) => (_jsxs("div", { style: {
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    backgroundColor: highlightCommon && lines1.includes(line) ? '#fef3c7' : 'transparent',
                                }, children: [_jsx("span", { style: {
                                            display: 'inline-block',
                                            width: '40px',
                                            color: '#94a3b8',
                                            textAlign: 'right',
                                            marginRight: '1rem',
                                            userSelect: 'none',
                                        }, children: idx + 1 }), _jsx("span", { style: { flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }, children: line || ' ' })] }, idx))) })] })] }));
    };
    const renderUnifiedView = () => {
        return (_jsxs("div", { children: [_jsx("div", { style: {
                        backgroundColor: '#1e293b',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        fontWeight: 'bold',
                        borderRadius: '8px 8px 0 0',
                    }, children: "Unified Diff View" }), _jsx("pre", { style: {
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
                    }, children: diffResult.map((part, idx) => (_jsxs("div", { style: {
                            backgroundColor: part.added
                                ? '#d1fae5'
                                : part.removed
                                    ? '#fee2e2'
                                    : 'transparent',
                            padding: '2px 0',
                        }, children: [_jsx("span", { style: {
                                    color: part.added ? '#059669' : part.removed ? '#dc2626' : '#1e293b',
                                    fontWeight: part.added || part.removed ? 'bold' : 'normal',
                                }, children: part.added ? '+ ' : part.removed ? '- ' : '  ' }), part.value.split('\n').map((line, lineIdx) => (_jsx("div", { style: { paddingLeft: '20px' }, children: line }, lineIdx)))] }, idx))) })] }));
    };
    return (_jsxs("div", { style: { padding: '1.5rem', backgroundColor: 'white', borderRadius: '12px' }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: `2px solid ${getSeverityColor(similarityScore * 100)}`,
                }, children: [_jsxs("div", { children: [_jsx("h3", { style: { margin: 0, marginBottom: '0.5rem' }, children: "Code Similarity Analysis" }), _jsx("div", { style: { fontSize: '14px', color: '#64748b' }, children: matchingLines && totalLines
                                    ? `${matchingLines} of ${totalLines} lines matched`
                                    : 'Structural similarity detected' })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsxs("div", { style: {
                                    fontSize: '36px',
                                    fontWeight: 'bold',
                                    color: getSeverityColor(similarityScore * 100),
                                    lineHeight: 1,
                                }, children: [(similarityScore * 100).toFixed(0), "%"] }), _jsxs("div", { style: {
                                    marginTop: '0.25rem',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: getSeverityColor(similarityScore * 100),
                                }, children: [getSeverityLabel(similarityScore * 100), " SIMILARITY"] })] })] }), _jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                }, children: [_jsxs("div", { style: { display: 'flex', gap: '0.5rem' }, children: [_jsx("button", { onClick: () => setViewMode('split'), style: {
                                    padding: '0.5rem 1rem',
                                    backgroundColor: viewMode === 'split' ? '#2da44e' : '#f1f5f9',
                                    color: viewMode === 'split' ? 'white' : '#64748b',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                }, children: "Split View" }), _jsx("button", { onClick: () => setViewMode('unified'), style: {
                                    padding: '0.5rem 1rem',
                                    backgroundColor: viewMode === 'unified' ? '#2da44e' : '#f1f5f9',
                                    color: viewMode === 'unified' ? 'white' : '#64748b',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                }, children: "Unified View" })] }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: highlightCommon, onChange: (e) => setHighlightCommon(e.target.checked), style: { cursor: 'pointer' } }), _jsx("span", { style: { fontSize: '14px', color: '#64748b' }, children: "Highlight Common Lines" })] })] }), viewMode === 'split' ? renderSplitView() : renderUnifiedView(), _jsxs("div", { style: {
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#64748b',
                }, children: [_jsx("strong", { children: "Legend:" }), _jsxs("div", { style: { display: 'flex', gap: '2rem', marginTop: '0.5rem' }, children: [_jsxs("div", { children: [_jsx("span", { style: {
                                            display: 'inline-block',
                                            width: '16px',
                                            height: '16px',
                                            backgroundColor: '#fef3c7',
                                            marginRight: '0.5rem',
                                            border: '1px solid #fbbf24',
                                        } }), "Common lines"] }), _jsxs("div", { children: [_jsx("span", { style: {
                                            display: 'inline-block',
                                            width: '16px',
                                            height: '16px',
                                            backgroundColor: '#d1fae5',
                                            marginRight: '0.5rem',
                                            border: '1px solid #059669',
                                        } }), "Added"] }), _jsxs("div", { children: [_jsx("span", { style: {
                                            display: 'inline-block',
                                            width: '16px',
                                            height: '16px',
                                            backgroundColor: '#fee2e2',
                                            marginRight: '0.5rem',
                                            border: '1px solid #dc2626',
                                        } }), "Removed"] })] })] })] }));
}
