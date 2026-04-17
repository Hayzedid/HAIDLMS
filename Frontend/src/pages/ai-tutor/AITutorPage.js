import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { AISocraticTutorChat } from '../../components/ai-tutor/AISocraticTutorChat.enhanced';
import { ErrorExplanation } from '../../components/ai-tutor/ErrorExplanation.enhanced';
import { AppLayout } from '../../components/layout';
import { Tabs } from '../../components/ui';
import { MessageSquare, AlertCircle } from 'lucide-react';
export const AITutorPage = () => {
    const [activeTab, setActiveTab] = useState('chat');
    const [errorContext, setErrorContext] = useState({
        errorMessage: '',
        codeContext: '',
        language: 'javascript',
        stackTrace: '',
    });
    const tabs = [
        {
            id: 'chat',
            label: 'Chat with AI Tutor',
            icon: _jsx(MessageSquare, { className: "w-4 h-4" }),
        },
        {
            id: 'error',
            label: 'Error Explanation',
            icon: _jsx(AlertCircle, { className: "w-4 h-4" }),
        },
    ];
    return (_jsxs(AppLayout, { children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "AI Socratic Tutor" }), _jsx("p", { className: "text-gray-600", children: "Learn through guided questions and critical thinking. The AI won't give you direct answers, but will help you discover them yourself!" })] }), _jsx("div", { className: "mb-6", children: _jsx(Tabs, { tabs: tabs, activeTab: activeTab, onChange: (tabId) => setActiveTab(tabId), variant: "underline" }) }), activeTab === 'chat' ? (_jsx("div", { className: "bg-white rounded-lg shadow-lg", style: { height: 'calc(100vh - 300px)' }, children: _jsx(AISocraticTutorChat, { contextType: "general" }) })) : (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Paste Your Error for Socratic Guidance" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Error Message *" }), _jsx("input", { type: "text", value: errorContext.errorMessage, onChange: (e) => setErrorContext(prev => ({ ...prev, errorMessage: e.target.value })), placeholder: "e.g., TypeError: Cannot read property 'length' of undefined", className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Your Code Context *" }), _jsx("textarea", { value: errorContext.codeContext, onChange: (e) => setErrorContext(prev => ({ ...prev, codeContext: e.target.value })), placeholder: "Paste the code where the error occurred...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm", rows: 8 })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Language" }), _jsxs("select", { value: errorContext.language, onChange: (e) => setErrorContext(prev => ({ ...prev, language: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg", children: [_jsx("option", { value: "javascript", children: "JavaScript" }), _jsx("option", { value: "python", children: "Python" }), _jsx("option", { value: "java", children: "Java" }), _jsx("option", { value: "cpp", children: "C++" }), _jsx("option", { value: "csharp", children: "C#" }), _jsx("option", { value: "ruby", children: "Ruby" }), _jsx("option", { value: "go", children: "Go" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Stack Trace (optional)" }), _jsx("textarea", { value: errorContext.stackTrace, onChange: (e) => setErrorContext(prev => ({ ...prev, stackTrace: e.target.value })), placeholder: "Paste stack trace if available...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs", rows: 3 })] })] })] })] }), errorContext.errorMessage && errorContext.codeContext && (_jsx(ErrorExplanation, { errorMessage: errorContext.errorMessage, codeContext: errorContext.codeContext, language: errorContext.language, stackTrace: errorContext.stackTrace }))] })), _jsxs("div", { className: "mt-8 bg-primary-50 border border-primary-200 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-primary-900 mb-2", children: "\uD83D\uDCA1 How the Socratic Method Works" }), _jsxs("ul", { className: "text-sm text-primary-800 space-y-1", children: [_jsxs("li", { children: ["\u2713 ", _jsx("strong", { children: "Ask Questions:" }), " The AI will guide you with questions instead of giving direct answers"] }), _jsxs("li", { children: ["\u2713 ", _jsx("strong", { children: "Think Critically:" }), " You'll develop problem-solving skills by working through challenges yourself"] }), _jsxs("li", { children: ["\u2713 ", _jsx("strong", { children: "Learn Deeply:" }), " Understanding \"why\" is more important than memorizing \"what\""] }), _jsxs("li", { children: ["\u2713 ", _jsx("strong", { children: "Build Confidence:" }), " Solving problems yourself builds lasting confidence"] })] }), _jsx("div", { className: "mt-4 p-3 bg-white border border-primary-300 rounded", children: _jsxs("p", { className: "text-sm text-primary-900", children: [_jsx("strong", { children: "Remember:" }), " The AI tutor will ", _jsx("em", { children: "never" }), " write code for you or give you direct solutions. If you ask for code, you'll get more questions to help you write it yourself!"] }) })] })] }));
};
