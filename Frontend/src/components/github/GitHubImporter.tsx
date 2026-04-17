import { useState } from 'react';
import { processGitHubUrl, GitHubStructure, GitHubFile } from '../../api/github.api';

interface Props {
  onImportComplete?: (data: GitHubStructure) => void;
}

export default function GitHubImporter({ onImportComplete }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GitHubStructure | null>(null);
  const [includeContent, setIncludeContent] = useState(false);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await processGitHubUrl(url, includeContent);
      setResult(data);
      onImportComplete?.(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to import repository');
    } finally {
      setLoading(false);
    }
  };

  const renderFileTree = (files: GitHubFile[]) => {
    // Group files by directory
    const directories = new Set<string>();
    const filesByDir: Record<string, GitHubFile[]> = { '': [] };

    files.forEach((file) => {
      const parts = file.path.split('/');
      if (parts.length > 1) {
        const dir = parts.slice(0, -1).join('/');
        directories.add(dir);
        if (!filesByDir[dir]) filesByDir[dir] = [];
        filesByDir[dir].push(file);
      } else {
        filesByDir[''].push(file);
      }
    });

    return (
      <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
        {Object.entries(filesByDir).map(([dir, dirFiles]) => (
          <div key={dir} style={{ marginBottom: '1rem' }}>
            {dir && (
              <div style={{ fontWeight: 'bold', color: '#0969da', marginBottom: '0.5rem' }}>
                📁 {dir}/
              </div>
            )}
            {dirFiles.map((file) => (
              <div
                key={file.path}
                style={{
                  marginLeft: dir ? '1.5rem' : '0',
                  padding: '0.25rem 0',
                  color: '#1f2328',
                }}
              >
                {file.type === 'file' ? '📄' : '📁'} {file.name}
                <span style={{ color: '#656d76', marginLeft: '0.5rem' }}>
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2>Import from GitHub</h2>
      <p style={{ color: '#656d76' }}>
        Enter a public GitHub repository URL to import its contents
      </p>

      <form onSubmit={handleImport} style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '16px',
              border: '1px solid #d0d7de',
              borderRadius: '6px',
            }}
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={includeContent}
              onChange={(e) => setIncludeContent(e.target.checked)}
              disabled={loading}
            />
            <span>Include file contents (may take longer)</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !url}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '16px',
            backgroundColor: loading ? '#6e7781' : '#2da44e',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '500',
          }}
        >
          {loading ? 'Importing...' : 'Import Repository'}
        </button>
      </form>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fff0f0',
            border: '1px solid #ff8080',
            borderRadius: '6px',
            color: '#d93025',
            marginBottom: '2rem',
          }}
        >
          ❌ {error}
        </div>
      )}

      {result && (
        <div
          style={{
            border: '1px solid #d0d7de',
            borderRadius: '6px',
            padding: '1.5rem',
            backgroundColor: '#f6f8fa',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Repository: {result.info.full_name}</h3>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ color: '#656d76', marginBottom: '0.5rem' }}>
              {result.info.description}
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '14px', color: '#656d76' }}>
              <span>⭐ {result.info.stargazers_count}</span>
              <span>🍴 {result.info.forks_count}</span>
              <span>📝 {result.info.language || 'N/A'}</span>
              <span>🌿 {result.branch}</span>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <strong>Files found: {result.files.length}</strong>
          </div>

          {result.files.length > 0 && (
            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #d0d7de',
              }}
            >
              {renderFileTree(result.files)}
            </div>
          )}

          {result.filesWithContent && result.filesWithContent.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4>Files with Content ({result.filesWithContent.length})</h4>
              <div style={{ fontSize: '14px', color: '#656d76' }}>
                {result.filesWithContent.map((file) => (
                  <div key={file.path} style={{ marginBottom: '0.25rem' }}>
                    ✓ {file.path} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
