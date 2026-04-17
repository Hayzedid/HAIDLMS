import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import CodeEditor, { DEFAULT_TEMPLATES } from './CodeEditor';
import OutputConsole from './OutputConsole';
import TestResults from './TestResults';
import { ideApi, } from '../../api/ide.api';
export default function IDEInterface({ lessonId, courseId, initialLanguage = 'python', initialCode, readOnly = false, onSubmissionComplete, }) {
    const [language, setLanguage] = useState(initialLanguage);
    const [code, setCode] = useState(initialCode || DEFAULT_TEMPLATES[initialLanguage]);
    const [stdin, setStdin] = useState('');
    const [outputLines, setOutputLines] = useState([]);
    const [activeTab, setActiveTab] = useState('output');
    const [isExecuting, setIsExecuting] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [testResults, setTestResults] = useState(null);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [useStreaming, setUseStreaming] = useState(false);
    const wsRef = useRef(null);
    // Load template when language changes
    useEffect(() => {
        const loadTemplate = async () => {
            try {
                const response = await ideApi.getTemplate(lessonId, language);
                setCode(response.data.data.starterCode);
            }
            catch (error) {
                // If no template exists, use default
                setCode(DEFAULT_TEMPLATES[language]);
            }
        };
        if (!initialCode) {
            loadTemplate();
        }
    }, [language, lessonId, initialCode]);
    const addOutputLine = (type, content) => {
        setOutputLines((prev) => [...prev, { type, content, timestamp: Date.now() }]);
    };
    const clearOutput = () => {
        setOutputLines([]);
    };
    const handleExecute = async () => {
        if (isExecuting || !code.trim())
            return;
        setIsExecuting(true);
        clearOutput();
        setActiveTab('output');
        if (useStreaming) {
            await executeWithStreaming();
        }
        else {
            await executeNormal();
        }
    };
    const executeNormal = async () => {
        try {
            addOutputLine('system', '⚡ Executing code...');
            const response = await ideApi.executeCode({
                language,
                code,
                stdin,
                timeoutMs: 30000,
                memoryLimitMB: 256,
            });
            const result = response.data.data;
            if (result.output.stdout) {
                addOutputLine('stdout', result.output.stdout);
            }
            if (result.output.stderr) {
                addOutputLine('stderr', result.output.stderr);
            }
            if (result.timedOut) {
                addOutputLine('error', '⏱️ Execution timed out');
            }
            else if (result.output.exitCode === 0) {
                addOutputLine('success', `✓ Completed in ${result.metrics.executionTimeMs}ms (Exit code: ${result.output.exitCode})`);
            }
            else {
                addOutputLine('error', `✗ Process exited with code ${result.output.exitCode}`);
            }
            if (result.metrics.memoryUsedKB) {
                addOutputLine('system', `📊 Memory used: ${(result.metrics.memoryUsedKB / 1024).toFixed(2)} MB`);
            }
        }
        catch (error) {
            addOutputLine('error', `❌ Execution failed: ${error.response?.data?.error || error.message}`);
        }
        finally {
            setIsExecuting(false);
        }
    };
    const executeWithStreaming = async () => {
        try {
            addOutputLine('system', '⚡ Starting execution with streaming...');
            // First, initiate the execution
            const response = await ideApi.executeCodeStream({
                language,
                code,
                stdin,
                timeoutMs: 30000,
                memoryLimitMB: 256,
            });
            const executionId = response.data.data.executionId;
            addOutputLine('system', `📡 Execution ID: ${executionId}`);
            // Connect to WebSocket
            const ws = ideApi.connectExecutionStream(executionId, (message) => {
                switch (message.type) {
                    case 'status':
                        addOutputLine('system', `[Status] ${message.data.status}`);
                        break;
                    case 'stdout':
                        addOutputLine('stdout', message.data);
                        break;
                    case 'stderr':
                        addOutputLine('stderr', message.data);
                        break;
                    case 'complete':
                        addOutputLine('success', `✓ Completed in ${message.data.executionTimeMs}ms (Exit code: ${message.data.exitCode})`);
                        if (message.data.memoryUsedKB) {
                            addOutputLine('system', `📊 Memory used: ${(message.data.memoryUsedKB / 1024).toFixed(2)} MB`);
                        }
                        setIsExecuting(false);
                        break;
                    case 'error':
                        addOutputLine('error', `❌ ${message.data.message}`);
                        setIsExecuting(false);
                        break;
                }
            });
            wsRef.current = ws;
            ws.onclose = () => {
                setIsExecuting(false);
            };
            ws.onerror = () => {
                addOutputLine('error', '❌ WebSocket connection failed');
                setIsExecuting(false);
            };
        }
        catch (error) {
            addOutputLine('error', `❌ Execution failed: ${error.response?.data?.error || error.message}`);
            setIsExecuting(false);
        }
    };
    const handleRunTests = async () => {
        if (isTesting || !code.trim())
            return;
        setIsTesting(true);
        setActiveTab('tests');
        setTestResults(null);
        try {
            const response = await ideApi.runTests({
                lessonId,
                language,
                code,
            });
            setTestResults(response.data.data);
        }
        catch (error) {
            addOutputLine('error', `❌ Test execution failed: ${error.response?.data?.error || error.message}`);
            setActiveTab('output');
        }
        finally {
            setIsTesting(false);
        }
    };
    const handleSubmit = async () => {
        if (isSubmitting || !code.trim())
            return;
        const confirmed = window.confirm('Are you sure you want to submit your code for grading? This will run all test cases including hidden tests.');
        if (!confirmed)
            return;
        setIsSubmitting(true);
        setActiveTab('tests');
        setSubmissionResult(null);
        try {
            const response = await ideApi.submitCode({
                lessonId,
                courseId,
                language,
                code,
            });
            const result = response.data.data;
            setSubmissionResult(result);
            if (onSubmissionComplete) {
                onSubmissionComplete(result);
            }
            if (result.passed) {
                alert(`🎉 Congratulations! You passed with a score of ${result.score}%`);
            }
            else {
                alert(`Your submission scored ${result.score}%. Review the test results and try again.`);
            }
        }
        catch (error) {
            addOutputLine('error', `❌ Submission failed: ${error.response?.data?.error || error.message}`);
            setActiveTab('output');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleLanguageChange = (newLanguage) => {
        if (code !== DEFAULT_TEMPLATES[language] && code.trim()) {
            const confirmed = window.confirm('Changing the language will reset your code. Are you sure?');
            if (!confirmed)
                return;
        }
        setLanguage(newLanguage);
        clearOutput();
        setTestResults(null);
        setSubmissionResult(null);
    };
    // Cleanup WebSocket on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                }, children: [_jsxs("div", { style: { display: 'flex', gap: '12px', alignItems: 'center' }, children: [_jsxs("select", { value: language, onChange: (e) => handleLanguageChange(e.target.value), disabled: readOnly, style: {
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }, children: [_jsx("option", { value: "python", children: "Python" }), _jsx("option", { value: "javascript", children: "JavaScript" }), _jsx("option", { value: "typescript", children: "TypeScript" }), _jsx("option", { value: "java", children: "Java" }), _jsx("option", { value: "cpp", children: "C++" }), _jsx("option", { value: "go", children: "Go" }), _jsx("option", { value: "rust", children: "Rust" }), _jsx("option", { value: "ruby", children: "Ruby" }), _jsx("option", { value: "php", children: "PHP" }), _jsx("option", { value: "csharp", children: "C#" })] }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }, children: [_jsx("input", { type: "checkbox", checked: useStreaming, onChange: (e) => setUseStreaming(e.target.checked) }), "Real-time output"] })] }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("button", { onClick: handleExecute, disabled: isExecuting || readOnly, style: {
                                    padding: '8px 16px',
                                    backgroundColor: isExecuting ? '#9ca3af' : '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: isExecuting ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }, children: isExecuting ? '⏳ Running...' : '▶️ Run' }), _jsx("button", { onClick: handleRunTests, disabled: isTesting || readOnly, style: {
                                    padding: '8px 16px',
                                    backgroundColor: isTesting ? '#9ca3af' : '#8b5cf6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: isTesting ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }, children: isTesting ? '⏳ Testing...' : '🧪 Test' }), _jsx("button", { onClick: handleSubmit, disabled: isSubmitting || readOnly, style: {
                                    padding: '8px 16px',
                                    backgroundColor: isSubmitting ? '#9ca3af' : '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }, children: isSubmitting ? '⏳ Submitting...' : '📤 Submit' })] })] }), _jsxs("div", { style: { display: 'flex', gap: '16px', flex: 1, minHeight: 0 }, children: [_jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }, children: [_jsx(CodeEditor, { language: language, value: code, onChange: setCode, readOnly: readOnly, height: "calc(100vh - 300px)" }), _jsxs("div", { children: [_jsx("label", { style: {
                                            display: 'block',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            marginBottom: '8px',
                                        }, children: "Input (stdin):" }), _jsx("textarea", { value: stdin, onChange: (e) => setStdin(e.target.value), disabled: readOnly, placeholder: "Enter input for your program...", style: {
                                            width: '100%',
                                            height: '80px',
                                            padding: '8px',
                                            fontFamily: "'Fira Code', monospace",
                                            fontSize: '13px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '4px',
                                            resize: 'vertical',
                                        } })] })] }), _jsxs("div", { style: { width: '45%', display: 'flex', flexDirection: 'column' }, children: [_jsxs("div", { style: {
                                    display: 'flex',
                                    borderBottom: '2px solid #e5e7eb',
                                    marginBottom: '12px',
                                }, children: [_jsx("button", { onClick: () => setActiveTab('output'), style: {
                                            padding: '12px 24px',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            borderBottom: activeTab === 'output' ? '2px solid #3b82f6' : '2px solid transparent',
                                            fontSize: '14px',
                                            fontWeight: activeTab === 'output' ? 600 : 400,
                                            color: activeTab === 'output' ? '#3b82f6' : '#6b7280',
                                            cursor: 'pointer',
                                            marginBottom: '-2px',
                                        }, children: "Output" }), _jsxs("button", { onClick: () => setActiveTab('tests'), style: {
                                            padding: '12px 24px',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            borderBottom: activeTab === 'tests' ? '2px solid #3b82f6' : '2px solid transparent',
                                            fontSize: '14px',
                                            fontWeight: activeTab === 'tests' ? 600 : 400,
                                            color: activeTab === 'tests' ? '#3b82f6' : '#6b7280',
                                            cursor: 'pointer',
                                            marginBottom: '-2px',
                                        }, children: ["Test Results", (testResults || submissionResult) && (_jsx("span", { style: {
                                                    marginLeft: '8px',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    backgroundColor: (submissionResult?.passed || testResults?.failed === 0) ? '#d1fae5' : '#fee2e2',
                                                    color: (submissionResult?.passed || testResults?.failed === 0) ? '#059669' : '#dc2626',
                                                }, children: submissionResult
                                                    ? `${submissionResult.tests.passed}/${submissionResult.tests.total}`
                                                    : testResults
                                                        ? `${testResults.passed}/${testResults.total}`
                                                        : '' }))] })] }), _jsxs("div", { style: { flex: 1, overflowY: 'auto' }, children: [activeTab === 'output' && (_jsx(OutputConsole, { lines: outputLines, height: "calc(100vh - 400px)" })), activeTab === 'tests' && (_jsx("div", { children: submissionResult ? (_jsx(TestResults, { results: submissionResult.results, totalTests: submissionResult.tests.total, passedTests: submissionResult.tests.passed, failedTests: submissionResult.tests.failed, score: submissionResult.score, executionTime: submissionResult.executionTimeMs })) : testResults ? (_jsx(TestResults, { results: testResults.results, totalTests: testResults.total, passedTests: testResults.passed, failedTests: testResults.failed })) : (_jsx("div", { style: {
                                                padding: '32px',
                                                textAlign: 'center',
                                                color: '#6b7280',
                                                fontStyle: 'italic',
                                            }, children: "Run tests to see results here" })) }))] })] })] })] }));
}
