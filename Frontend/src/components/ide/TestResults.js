import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
export default function TestResults({ results, totalTests, passedTests, failedTests, score, executionTime, showHidden = false, }) {
    const allPassed = failedTests === 0 && totalTests > 0;
    return (_jsxs("div", { style: { padding: '16px' }, children: [_jsx("div", { style: {
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: allPassed ? '#d1fae5' : failedTests > 0 ? '#fee2e2' : '#f3f4f6',
                    marginBottom: '16px',
                }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '18px', fontWeight: 600, marginBottom: '4px' }, children: allPassed ? '✓ All Tests Passed!' : `${passedTests}/${totalTests} Tests Passed` }), _jsxs("div", { style: { fontSize: '14px', color: '#666' }, children: [passedTests, " passed, ", failedTests, " failed", executionTime && ` • ${executionTime}ms`] })] }), score !== undefined && (_jsxs("div", { style: {
                                fontSize: '32px',
                                fontWeight: 700,
                                color: allPassed ? '#059669' : failedTests > 0 ? '#dc2626' : '#6b7280',
                            }, children: [score.toFixed(0), "%"] }))] }) }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' }, children: results.map((result, index) => (_jsxs("div", { style: {
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: result.passed ? '#f0fdf4' : '#fef2f2',
                    }, children: [_jsxs("div", { style: {
                                padding: '12px 16px',
                                backgroundColor: result.passed ? '#d1fae5' : '#fee2e2',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("span", { style: { fontSize: '18px' }, children: result.passed ? '✓' : '✗' }), _jsxs("div", { children: [_jsxs("div", { style: { fontWeight: 600, fontSize: '14px' }, children: [result.name, result.isHidden && !showHidden && (_jsx("span", { style: { marginLeft: '8px', fontSize: '12px', color: '#666' }, children: "(Hidden Test)" }))] }), result.description && (_jsx("div", { style: { fontSize: '12px', color: '#666', marginTop: '2px' }, children: result.description }))] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsxs("span", { style: { fontSize: '12px', color: '#666' }, children: [result.executionTimeMs, "ms"] }), _jsxs("span", { style: { fontSize: '14px', fontWeight: 600 }, children: [result.points, "/", result.maxPoints, " pts"] })] })] }), !result.passed && (_jsx("div", { style: { padding: '12px 16px' }, children: result.error ? (_jsxs("div", { children: [_jsx("div", { style: { fontSize: '12px', fontWeight: 600, color: '#dc2626', marginBottom: '4px' }, children: "Error:" }), _jsx("pre", { style: {
                                            fontSize: '12px',
                                            color: '#991b1b',
                                            backgroundColor: '#fef2f2',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            overflow: 'auto',
                                            margin: 0,
                                        }, children: result.error })] })) : (_jsxs(_Fragment, { children: [!result.isHidden && result.input && (_jsxs("div", { style: { marginBottom: '8px' }, children: [_jsx("div", { style: { fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }, children: "Input:" }), _jsx("pre", { style: {
                                                    fontSize: '12px',
                                                    backgroundColor: '#f9fafb',
                                                    padding: '8px',
                                                    borderRadius: '4px',
                                                    overflow: 'auto',
                                                    margin: 0,
                                                }, children: result.input })] })), !result.isHidden && result.expectedOutput && (_jsxs("div", { style: { marginBottom: '8px' }, children: [_jsx("div", { style: { fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }, children: "Expected Output:" }), _jsx("pre", { style: {
                                                    fontSize: '12px',
                                                    backgroundColor: '#f9fafb',
                                                    padding: '8px',
                                                    borderRadius: '4px',
                                                    overflow: 'auto',
                                                    margin: 0,
                                                }, children: result.expectedOutput })] })), result.actualOutput !== undefined && (_jsxs("div", { children: [_jsx("div", { style: { fontSize: '12px', fontWeight: 600, color: '#dc2626', marginBottom: '4px' }, children: "Your Output:" }), _jsx("pre", { style: {
                                                    fontSize: '12px',
                                                    backgroundColor: '#fef2f2',
                                                    padding: '8px',
                                                    borderRadius: '4px',
                                                    overflow: 'auto',
                                                    margin: 0,
                                                    color: '#991b1b',
                                                }, children: result.actualOutput || '(empty)' })] }))] })) }))] }, index))) })] }));
}
