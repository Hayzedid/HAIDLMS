import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GitHubImporter from '../../components/github/GitHubImporter';
import { GitHubStructure, GitHubFile } from '../../api/github.api';

/**
 * Example page: Import course materials from GitHub
 * This shows how an instructor can import code examples, tutorials, etc.
 */
export default function ImportFromGitHub() {
  const navigate = useNavigate();
  const [importedData, setImportedData] = useState<GitHubStructure | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const handleImportComplete = (data: GitHubStructure) => {
    setImportedData(data);
    console.log('Import completed:', data);
  };

  const toggleFileSelection = (filePath: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(filePath)) {
      newSelection.delete(filePath);
    } else {
      newSelection.add(filePath);
    }
    setSelectedFiles(newSelection);
  };

  const handleCreateLessons = () => {
    if (!importedData) return;

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f6f8fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'white',
              border: '1px solid #d0d7de',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '1rem',
            }}
          >
            ← Back
          </button>

          <h1 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '0.5rem' }}>
            Import from GitHub
          </h1>
          <p style={{ color: '#656d76', fontSize: '18px' }}>
            Import code examples, tutorials, and course materials from public GitHub repositories
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '6px',
            padding: '2rem',
            marginBottom: '2rem',
            border: '1px solid #d0d7de',
          }}
        >
          <GitHubImporter onImportComplete={handleImportComplete} />
        </div>

        {importedData && (
          <>
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '6px',
                padding: '2rem',
                marginBottom: '2rem',
                border: '1px solid #d0d7de',
              }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '1rem' }}>
                Select Files to Import
              </h2>
              <p style={{ color: '#656d76', marginBottom: '1.5rem' }}>
                Choose which files you want to create lessons from
              </p>

              <div
                style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: '1px solid #d0d7de',
                  borderRadius: '6px',
                  padding: '1rem',
                }}
              >
                {importedData.files
                  .filter((file) => file.type === 'file')
                  .map((file) => (
                    <div
                      key={file.path}
                      style={{
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
                      }}
                      onClick={() => toggleFileSelection(file.path)}
                      onMouseEnter={(e) => {
                        if (!selectedFiles.has(file.path)) {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedFiles.has(file.path)) {
                          e.currentTarget.style.backgroundColor = '#f6f8fa';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.path)}
                          onChange={() => {}}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontFamily: 'monospace' }}>📄 {file.path}</span>
                      </div>
                      <span style={{ color: '#656d76', fontSize: '14px' }}>
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ marginBottom: '1rem', color: '#656d76' }}>
                  Selected: {selectedFiles.size} file(s)
                </div>
                <button
                  onClick={handleCreateLessons}
                  disabled={selectedFiles.size === 0}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '16px',
                    backgroundColor: selectedFiles.size > 0 ? '#2da44e' : '#94d3a2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: selectedFiles.size > 0 ? 'pointer' : 'not-allowed',
                    fontWeight: '500',
                  }}
                >
                  Create {selectedFiles.size} Lesson(s)
                </button>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#fff8c5',
                border: '1px solid #d4a72c',
                borderRadius: '6px',
                padding: '1rem',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '0.5rem' }}>
                💡 Next Steps
              </h3>
              <ul style={{ marginLeft: '1.5rem', color: '#1f2328' }}>
                <li>Selected files will be imported as code lessons</li>
                <li>Directory structure will be preserved in module organization</li>
                <li>File contents will be available as code templates</li>
                <li>You can edit and customize each lesson after import</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
