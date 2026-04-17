import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ideApi } from "../../api/ide.api";
import { Play, RotateCcw, Download } from "lucide-react";
export const IDEEditorPage = () => {
    const [language, setLanguage] = useState("javascript");
    const [code, setCode] = useState('// Write your code here\nconsole.log("Hello, World!");');
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
            setOutput(result?.output?.stdout ||
                result?.output?.stderr ||
                "Code executed successfully");
        },
    });
    const submitMutation = useMutation({
        mutationFn: () => ideApi.submitCode({
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
            setOutput(result?.results
                ?.map((r) => `${r.name}: ${r.passed ? "PASSED" : "FAILED"}`)
                .join("\n") || "Tests completed");
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
    const getFileExtension = (lang) => {
        const extensions = {
            javascript: "js",
            python: "py",
            java: "java",
            cpp: "cpp",
        };
        return extensions[lang] || "txt";
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-900 text-gray-100", children: _jsxs("div", { className: "flex h-screen flex-col", children: [_jsx("div", { className: "border-b border-gray-700 bg-gray-800 px-6 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Code IDE" }), _jsxs("select", { value: language, onChange: (e) => setLanguage(e.target.value), className: "rounded bg-gray-700 px-3 py-2 text-white", children: [_jsx("option", { value: "javascript", children: "JavaScript" }), _jsx("option", { value: "python", children: "Python" }), _jsx("option", { value: "java", children: "Java" }), _jsx("option", { value: "cpp", children: "C++" })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => downloadCode(), className: "flex items-center gap-2 rounded bg-gray-700 px-4 py-2 hover:bg-gray-600", children: [_jsx(Download, { className: "w-4 h-4" }), " Download"] }), _jsxs("button", { onClick: () => setCode(""), className: "flex items-center gap-2 rounded bg-gray-700 px-4 py-2 hover:bg-gray-600", children: [_jsx(RotateCcw, { className: "w-4 h-4" }), " Clear"] })] })] }) }), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx("div", { className: "flex-1 border-r border-gray-700", children: _jsx("textarea", { value: code, onChange: (e) => setCode(e.target.value), className: "h-full w-full resize-none bg-gray-800 p-4 font-mono text-sm text-white focus:outline-none", placeholder: "Write your code here..." }) }), _jsxs("div", { className: "w-1/3 border-l border-gray-700 bg-gray-950", children: [_jsx("div", { className: "flex h-12 items-center border-b border-gray-700 px-4", children: _jsx("h3", { className: "font-semibold", children: "Output" }) }), _jsx("div", { className: "overflow-auto p-4", children: _jsx("pre", { className: "whitespace-pre-wrap break-words font-mono text-sm text-green-400", children: output || "(execution output appears here)" }) })] })] }), _jsx("div", { className: "border-t border-gray-700 bg-gray-800 px-6 py-4", children: _jsxs("div", { className: "flex gap-3", children: [_jsxs("button", { onClick: () => executeMutation.mutate(), disabled: executeMutation.isPending, className: "flex items-center gap-2 rounded bg-blue-600 px-6 py-2 font-semibold hover:bg-blue-700 disabled:opacity-50", children: [_jsx(Play, { className: "w-4 h-4" }), executeMutation.isPending ? "Running..." : "Execute"] }), _jsx("button", { onClick: () => testMutation.mutate(), disabled: testMutation.isPending, className: "flex items-center gap-2 rounded bg-green-600 px-6 py-2 font-semibold hover:bg-green-700 disabled:opacity-50", children: testMutation.isPending ? "Testing..." : "Run Tests" }), _jsx("button", { onClick: () => submitMutation.mutate(), disabled: submitMutation.isPending, className: "flex items-center gap-2 rounded bg-purple-600 px-6 py-2 font-semibold hover:bg-purple-700 disabled:opacity-50", children: submitMutation.isPending ? "Submitting..." : "Submit Solution" }), _jsx("input", { type: "text", value: fileName, onChange: (e) => setFileName(e.target.value), placeholder: "File name", className: "rounded bg-gray-700 px-4 py-2 text-white focus:outline-none" })] }) })] }) }));
};
export default IDEEditorPage;
