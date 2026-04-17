import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GitHubImporter from '../../components/github/GitHubImporter';
/**
 * Example page: Import course materials from GitHub
 * This shows how an instructor can import code examples, tutorials, etc.
 */
export default function ImportFromGitHub() {
    const navigate = useNavigate();
    const [importedData, setImportedData] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const handleImportComplete = (data) => {
        setImportedData(data);
        console.log('Import completed:', data);
    };
    const toggleFileSelection = (filePath) => {
        const newSelection = new Set(selectedFiles);
        if (newSelection.has(filePath)) {
            newSelection.delete(filePath);
        }
        else {
            newSelection.add(filePath);
        }
        setSelectedFiles(newSelection);
    };
    const handleCreateLessons = () => {
        if (!importedData)
            return;
        const selectedFilesList = Array.from(selectedFiles);
        console.log('Creating lessons from:', selectedFilesList);
        // TODO: Implement lesson creation
        // This would:
        // 1. Create a new course or add to existing course
        // 2. Create modules based on directory structure
        // 3. Create code lessons for each selected file
        // 4. Populate lesson content with file contents
        alert(`Would create ${selectedFilesList.length} lessons from selected files`);
    };
    return (_jsx("div", { style: { minHeight: '100vh', backgroundColor: '#f6f8fa', padding: '2rem' }, children: _jsxs("div", { style: { maxWidth: '1200px', margin: '0 auto' }, children: [_jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("button", { onClick: () => navigate(-1), style: {
                                padding: '0.5rem 1rem',
                                backgroundColor: 'white',
                                border: '1px solid #d0d7de',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginBottom: '1rem',
                            }, children: "\u2190 Back" }), _jsx("h1", { style: { fontSize: '32px', fontWeight: '600', marginBottom: '0.5rem' }, children: "Import from GitHub" }), _jsx("p", { style: { color: '#656d76', fontSize: '18px' }, children: "Import code examples, tutorials, and course materials from public GitHub repositories" })] }), _jsx("div", { style: {
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        padding: '2rem',
                        marginBottom: '2rem',
                        border: '1px solid #d0d7de',
                    }, children: _jsx(GitHubImporter, { onImportComplete: handleImportComplete }) }), importedData && (_jsxs(_Fragment, { children: [_jsxs("div", { style: {
                                backgroundColor: 'white',
                                borderRadius: '6px',
                                padding: '2rem',
                                marginBottom: '2rem',
                                border: '1px solid #d0d7de',
                            }, children: [_jsx("h2", { style: { fontSize: '24px', fontWeight: '600', marginBottom: '1rem' }, children: "Select Files to Import" }), _jsx("p", { style: { color: '#656d76', marginBottom: '1.5rem' }, children: "Choose which files you want to create lessons from" }), _jsx("div", { style: {
                                        maxHeight: '400px',
                                        overflowY: 'auto',
                                        border: '1px solid #d0d7de',
                                        borderRadius: '6px',
                                        padding: '1rem',
                                    }, children: importedData.files
                                        .filter((file) => file.type === 'file')
                                        .map((file) => (_jsxs("div", { style: {
                                            padding: '0.75rem',
                                            marginBottom: '0.5rem',
                                            backgroundColor: selectedFiles.has(file.path)
                                                ? '#ddf4ff'
                                                : '#f6f8fa',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'background-color 0.2s',
                                        }, onClick: () => toggleFileSelection(file.path), onMouseEnter: (e) => {
                                            if (!selectedFiles.has(file.path)) {
                                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                                            }
                                        }, onMouseLeave: (e) => {
                                            if (!selectedFiles.has(file.path)) {
                                                e.currentTarget.style.backgroundColor = '#f6f8fa';
                                            }
                                        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' }, children: [_jsx("input", { type: "checkbox", checked: selectedFiles.has(file.path), onChange: () => { }, style: { cursor: 'pointer' } }), _jsxs("span", { style: { fontFamily: 'monospace' }, children: ["\uD83D\uDCC4 ", file.path] })] }), _jsxs("span", { style: { color: '#656d76', fontSize: '14px' }, children: [(file.size / 1024).toFixed(1), " KB"] })] }, file.path))) }), _jsxs("div", { style: { marginTop: '1.5rem' }, children: [_jsxs("div", { style: { marginBottom: '1rem', color: '#656d76' }, children: ["Selected: ", selectedFiles.size, " file(s)"] }), _jsxs("button", { onClick: handleCreateLessons, disabled: selectedFiles.size === 0, style: {
                                                padding: '0.75rem 1.5rem',
                                                fontSize: '16px',
                                                backgroundColor: selectedFiles.size > 0 ? '#2da44e' : '#94d3a2',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: selectedFiles.size > 0 ? 'pointer' : 'not-allowed',
                                                fontWeight: '500',
                                            }, children: ["Create ", selectedFiles.size, " Lesson(s)"] })] })] }), _jsxs("div", { style: {
                                backgroundColor: '#fff8c5',
                                border: '1px solid #d4a72c',
                                borderRadius: '6px',
                                padding: '1rem',
                            }, children: [_jsx("h3", { style: { fontSize: '16px', fontWeight: '600', marginBottom: '0.5rem' }, children: "\uD83D\uDCA1 Next Steps" }), _jsxs("ul", { style: { marginLeft: '1.5rem', color: '#1f2328' }, children: [_jsx("li", { children: "Selected files will be imported as code lessons" }), _jsx("li", { children: "Directory structure will be preserved in module organization" }), _jsx("li", { children: "File contents will be available as code templates" }), _jsx("li", { children: "You can edit and customize each lesson after import" })] })] })] }))] }) }));
}
