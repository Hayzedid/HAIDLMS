import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { aiTutorApi } from '../../api/ai-tutor.api';
export const ErrorExplanation = ({ errorMessage, codeContext, language, stackTrace, }) => {
    const [explanation, setExplanation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const explainError = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await aiTutorApi.explainError({
                errorMessage,
                codeContext,
                language,
                stackTrace,
            });
            setExplanation(result);
        }
        catch (err) {
            setError(err.message || 'Failed to get explanation');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-800 flex items-center", children: [_jsx("span", { className: "text-2xl mr-2", children: "\uD83D\uDD0D" }), "Error Explanation (Socratic Method)"] }), !explanation && (_jsx("button", { onClick: explainError, disabled: isLoading, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition", children: isLoading ? 'Analyzing...' : 'Get AI Help' }))] }), error && (_jsx("div", { className: "mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700", children: error })), explanation && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 bg-blue-50 border border-blue-200 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-blue-900 mb-2", children: "Understanding the Error:" }), _jsx("p", { className: "text-gray-700 whitespace-pre-wrap", children: explanation.explanation })] }), explanation.guidingQuestions && explanation.guidingQuestions.length > 0 && (_jsxs("div", { className: "p-4 bg-purple-50 border border-purple-200 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-purple-900 mb-2", children: "\uD83E\uDD14 Questions to Guide You:" }), _jsx("ul", { className: "list-disc list-inside space-y-1", children: explanation.guidingQuestions.map((question, idx) => (_jsx("li", { className: "text-gray-700", children: question }, idx))) })] })), explanation.hints && explanation.hints.length > 0 && (_jsxs("div", { className: "p-4 bg-yellow-50 border border-yellow-200 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-yellow-900 mb-2", children: "\uD83D\uDCA1 Hints (Think About These):" }), _jsx("ul", { className: "list-disc list-inside space-y-1", children: explanation.hints.map((hint, idx) => (_jsx("li", { className: "text-gray-700", children: hint }, idx))) })] })), explanation.resourceLinks && explanation.resourceLinks.length > 0 && (_jsxs("div", { className: "p-4 bg-green-50 border border-green-200 rounded-lg", children: [_jsx("h4", { className: "font-semibold text-green-900 mb-2", children: "\uD83D\uDCDA Helpful Resources:" }), _jsx("ul", { className: "list-disc list-inside space-y-1", children: explanation.resourceLinks.map((link, idx) => (_jsx("li", { children: _jsx("a", { href: link, target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 hover:underline", children: link }) }, idx))) })] })), _jsx("div", { className: "text-sm text-gray-600 italic", children: "\uD83D\uDCAD Remember: I won't give you the solution directly. Work through these questions and hints to understand and fix the error yourself!" })] }))] }));
};
