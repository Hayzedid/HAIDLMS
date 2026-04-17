import { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Language } from '../../api/ide.api';

interface CodeEditorProps {
  language: Language;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  theme?: 'vs-dark' | 'light';
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => void;
}

// Language to Monaco language mapping
const LANGUAGE_MAP: Record<Language, string> = {
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  java: 'java',
  cpp: 'cpp',
  go: 'go',
  rust: 'rust',
  ruby: 'ruby',
  php: 'php',
  csharp: 'csharp',
};

// Default code templates
const DEFAULT_TEMPLATES: Record<Language, string> = {
  python: '# Write your Python code here\n\n',
  javascript: '// Write your JavaScript code here\n\n',
  typescript: '// Write your TypeScript code here\n\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your Java code here\n    }\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n    // Write your C++ code here\n    return 0;\n}\n',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your Go code here\n}\n',
  rust: 'fn main() {\n    // Write your Rust code here\n}\n',
  ruby: '# Write your Ruby code here\n\n',
  php: '<?php\n// Write your PHP code here\n',
  csharp: 'using System;\n\nclass Program {\n    static void Main() {\n        // Write your C# code here\n    }\n}\n',
};

export default function CodeEditor({
  language,
  value,
  onChange,
  readOnly = false,
  height = '500px',
  theme = 'vs-dark',
  onMount,
}: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  function handleEditorDidMount(
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) {
    editorRef.current = editor;

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace",
      fontLigatures: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      suggest: {
        snippetsPreventQuickSuggestions: false,
      },
    });

    // Call parent's onMount if provided
    if (onMount) {
      onMount(editor, monaco);
    }
  }

  function handleEditorChange(value: string | undefined) {
    onChange(value || '');
  }

  // Focus editor on mount
  useEffect(() => {
    if (editorRef.current && !readOnly) {
      editorRef.current.focus();
    }
  }, [readOnly]);

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
      <Editor
        height={height}
        language={LANGUAGE_MAP[language]}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme={theme}
        options={{
          readOnly,
          automaticLayout: true,
        }}
      />
    </div>
  );
}

export { LANGUAGE_MAP, DEFAULT_TEMPLATES };
