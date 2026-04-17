import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ideApi } from "../../api/ide.api";
import { Play, RotateCcw, Download, Upload, Copy } from "lucide-react";

interface CodeFile {
  language: string;
  code: string;
  fileName: string;
}

export const IDEEditorPage: React.FC = () => {
  const [language, setLanguage] = useState<
    "javascript" | "python" | "java" | "cpp"
  >("javascript");
  const [code, setCode] = useState(
    '// Write your code here\nconsole.log("Hello, World!");',
  );
  const [output, setOutput] = useState("");
  const [fileName, setFileName] = useState("solution");

  const { data: templates } = useQuery({
    queryKey: ["templates", language],
    queryFn: () => ideApi.getTemplates(language),
  });

  const executeMutation = useMutation({
    mutationFn: () => ideApi.executeCode({ code, language }),
    onSuccess: (response) => {
      const result = response.data?.data;
      setOutput(
        result?.output?.stdout ||
          result?.output?.stderr ||
          "Code executed successfully",
      );
    },
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      ideApi.submitCode({
        code,
        language,
        fileName,
        lessonId: "sandbox",
        courseId: "sandbox",
      }),
    onSuccess: () => {
      alert("Code submitted successfully!");
      setOutput("Submission recorded");
    },
  });

  const testMutation = useMutation({
    mutationFn: () => ideApi.runTests({ code, language, lessonId: "sandbox" }),
    onSuccess: (response) => {
      const result = response.data?.data;
      setOutput(
        result?.results
          ?.map((r: any) => `${r.name}: ${r.passed ? "PASSED" : "FAILED"}`)
          .join("\n") || "Tests completed",
      );
    },
  });

  const downloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([code], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${fileName}.${getFileExtension(language)}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getFileExtension = (lang: string) => {
    const extensions: Record<string, string> = {
      javascript: "js",
      python: "py",
      java: "java",
      cpp: "cpp",
    };
    return extensions[lang] || "txt";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="flex h-screen flex-col">
        {/* Header */}
        <div className="border-b border-gray-700 bg-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Code IDE</h1>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="rounded bg-gray-700 px-3 py-2 text-white"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => downloadCode()}
                className="flex items-center gap-2 rounded bg-gray-700 px-4 py-2 hover:bg-gray-600"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button
                onClick={() => setCode("")}
                className="flex items-center gap-2 rounded bg-gray-700 px-4 py-2 hover:bg-gray-600"
              >
                <RotateCcw className="w-4 h-4" /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Editor & Output */}
        <div className="flex flex-1 overflow-hidden">
          {/* Code Editor */}
          <div className="flex-1 border-r border-gray-700">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-full w-full resize-none bg-gray-800 p-4 font-mono text-sm text-white focus:outline-none"
              placeholder="Write your code here..."
            />
          </div>

          {/* Output Console */}
          <div className="w-1/3 border-l border-gray-700 bg-gray-950">
            <div className="flex h-12 items-center border-b border-gray-700 px-4">
              <h3 className="font-semibold">Output</h3>
            </div>
            <div className="overflow-auto p-4">
              <pre className="whitespace-pre-wrap break-words font-mono text-sm text-green-400">
                {output || "(execution output appears here)"}
              </pre>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="border-t border-gray-700 bg-gray-800 px-6 py-4">
          <div className="flex gap-3">
            <button
              onClick={() => executeMutation.mutate()}
              disabled={executeMutation.isPending}
              className="flex items-center gap-2 rounded bg-blue-600 px-6 py-2 font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {executeMutation.isPending ? "Running..." : "Execute"}
            </button>
            <button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="flex items-center gap-2 rounded bg-green-600 px-6 py-2 font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {testMutation.isPending ? "Testing..." : "Run Tests"}
            </button>
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="flex items-center gap-2 rounded bg-purple-600 px-6 py-2 font-semibold hover:bg-purple-700 disabled:opacity-50"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Solution"}
            </button>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="File name"
              className="rounded bg-gray-700 px-4 py-2 text-white focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IDEEditorPage;
