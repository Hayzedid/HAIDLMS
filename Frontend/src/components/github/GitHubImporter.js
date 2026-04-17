import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { processGitHubUrl } from '../../api/github.api';
export default function GitHubImporter({ onImportComplete }) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [includeContent, setIncludeContent] = useState(false);
    const handleImport = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = await processGitHubUrl(url, includeContent);
            setResult(data);
            onImportComplete?.(data);
        }
        catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to import repository');
        }
        finally {
            setLoading(false);
        }
    };
    const renderFileTree = (files) => {
        // Group files by directory
        const directories = new Set();
        const filesByDir = { '': [] };
        files.forEach((file) => {
            const parts = file.path.split('/');
            if (parts.length > 1) {
                const dir = parts.slice(0, -1).join('/');
                directories.add(dir);
                if (!filesByDir[dir])
                    filesByDir[dir] = [];
                filesByDir[dir].push(file);
            }
            else {
                filesByDir[''].push(file);
            }
        });
        return (_jsx("div", { style: { fontFamily: 'monospace', fontSize: '14px' }, children: Object.entries(filesByDir).map(([dir, dirFiles]) => (_jsxs("div", { style: { marginBottom: '1rem' }, children: [dir && (_jsxs("div", { style: { fontWeight: 'bold', color: '#0969da', marginBottom: '0.5rem' }, children: ["\uD83D\uDCC1 ", dir, "/"] })), dirFiles.map((file) => (_jsxs("div", { style: {
                            marginLeft: dir ? '1.5rem' : '0',
                            padding: '0.25rem 0',
                            color: '#1f2328',
                        }, children: [file.type === 'file' ? '📄' : '📁', " ", file.name, _jsxs("span", { style: { color: '#656d76', marginLeft: '0.5rem' }, children: ["(", (file.size / 1024).toFixed(1), " KB)"] })] }, file.path)))] }, dir))) }));
    };
    return (_jsxs("div", { style: { maxWidth: '800px', margin: '0 auto', padding: '2rem' }, children: [_jsx("h2", { children: "Import from GitHub" }), _jsx("p", { style: { color: '#656d76' }, children: "Enter a public GitHub repository URL to import its contents" }), _jsxs("form", { onSubmit: handleImport, style: { marginBottom: '2rem' }, children: [_jsx("div", { style: { marginBottom: '1rem' }, children: _jsx("input", { type: "text", value: url, onChange: (e) => setUrl(e.target.value), placeholder: "https://github.com/owner/repo", style: {
                                width: '100%',
                                padding: '0.75rem',
                                fontSize: '16px',
                                border: '1px solid #d0d7de',
                                borderRadius: '6px',
                            }, disabled: loading }) }), _jsx("div", { style: { marginBottom: '1rem' }, children: _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [_jsx("input", { type: "checkbox", checked: includeContent, onChange: (e) => setIncludeContent(e.target.checked), disabled: loading }), _jsx("span", { children: "Include file contents (may take longer)" })] }) }), _jsx("button", { type: "submit", disabled: loading || !url, style: {
                            padding: '0.75rem 1.5rem',
                            fontSize: '16px',
                            backgroundColor: loading ? '#6e7781' : '#2da44e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: '500',
                        }, children: loading ? 'Importing...' : 'Import Repository' })] }), error && (_jsxs("div", { style: {
                    padding: '1rem',
                    backgroundColor: '#fff0f0',
                    border: '1px solid #ff8080',
                    borderRadius: '6px',
                    color: '#d93025',
                    marginBottom: '2rem',
                }, children: ["\u274C ", error] })), result && (_jsxs("div", { style: {
                    border: '1px solid #d0d7de',
                    borderRadius: '6px',
                    padding: '1.5rem',
                    backgroundColor: '#f6f8fa',
                }, children: [_jsxs("h3", { style: { marginTop: 0 }, children: ["Repository: ", result.info.full_name] }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("div", { style: { color: '#656d76', marginBottom: '0.5rem' }, children: result.info.description }), _jsxs("div", { style: { display: 'flex', gap: '1rem', fontSize: '14px', color: '#656d76' }, children: [_jsxs("span", { children: ["\u2B50 ", result.info.stargazers_count] }), _jsxs("span", { children: ["\uD83C\uDF74 ", result.info.forks_count] }), _jsxs("span", { children: ["\uD83D\uDCDD ", result.info.language || 'N/A'] }), _jsxs("span", { children: ["\uD83C\uDF3F ", result.branch] })] })] }), _jsx("div", { style: { marginBottom: '1rem' }, children: _jsxs("strong", { children: ["Files found: ", result.files.length] }) }), result.files.length > 0 && (_jsx("div", { style: {
                            maxHeight: '400px',
                            overflowY: 'auto',
                            backgroundColor: 'white',
                            padding: '1rem',
                            borderRadius: '6px',
                            border: '1px solid #d0d7de',
                        }, children: renderFileTree(result.files) })), result.filesWithContent && result.filesWithContent.length > 0 && (_jsxs("div", { style: { marginTop: '1rem' }, children: [_jsxs("h4", { children: ["Files with Content (", result.filesWithContent.length, ")"] }), _jsx("div", { style: { fontSize: '14px', color: '#656d76' }, children: result.filesWithContent.map((file) => (_jsxs("div", { style: { marginBottom: '0.25rem' }, children: ["\u2713 ", file.path, " (", (file.size / 1024).toFixed(1), " KB)"] }, file.path))) })] }))] }))] }));
}
