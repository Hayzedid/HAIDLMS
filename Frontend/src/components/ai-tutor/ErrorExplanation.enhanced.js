import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { AlertCircle, HelpCircle, Lightbulb, BookOpen, Loader2, Code } from 'lucide-react';
import { aiTutorApi } from '../../api/ai-tutor.api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
export const ErrorExplanation = ({ errorMessage, codeContext, language, stackTrace, }) => {
    const [explanation, setExplanation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const explainError = async () => {
        try {
            setIsLoading(true);
            setError('');
            const result = await aiTutorApi.explainError({
                errorMessage,
                codeContext,
                language,
                stackTrace,
            });
            setExplanation(result);
        }
        catch (err) {
            setError(err.message || 'Failed to explain error');
        }
        finally {
            setIsLoading(false);
        }
    };
    if (!explanation && !isLoading) {
        return (_jsx(Card, { variant: "elevated", className: "border-l-4 border-l-purple-500", children: _jsxs(CardContent, { className: "text-center py-8", children: [_jsx("div", { className: "inline-flex p-4 bg-purple-100 rounded-full mb-4", children: _jsx(AlertCircle, { className: "w-8 h-8 text-purple-600" }) }), _jsx("h3", { className: "text-lg font-bold text-gray-900 mb-2", children: "Get Socratic Guidance for Your Error" }), _jsx("p", { className: "text-gray-600 mb-6 max-w-md mx-auto", children: "I'll analyze your error and help you understand what went wrong through guided questions" }), _jsx(Button, { onClick: explainError, size: "lg", variant: "primary", children: "Analyze Error" })] }) }));
    }
    if (isLoading) {
        return (_jsx(Card, { variant: "elevated", children: _jsx(CardContent, { className: "py-12", children: _jsxs("div", { className: "flex flex-col items-center justify-center gap-4", children: [_jsx(Loader2, { className: "w-12 h-12 animate-spin text-purple-600" }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "font-semibold text-gray-900 mb-1", children: "Analyzing your error..." }), _jsx("p", { className: "text-sm text-gray-600", children: "This may take a moment" })] })] }) }) }));
    }
    if (error) {
        return (_jsx(Card, { variant: "bordered", className: "border-danger-300 bg-danger-50", children: _jsx(CardContent, { className: "py-6", children: _jsxs("div", { className: "flex items-center gap-3 text-danger-700", children: [_jsx(AlertCircle, { className: "w-6 h-6 flex-shrink-0" }), _jsx("p", { className: "font-medium", children: error })] }) }) }));
    }
    return (_jsxs("div", { className: "space-y-6 animate-fade-in-up", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Badge, { variant: "danger", size: "lg", children: explanation.errorType }), _jsx(Button, { variant: "ghost", size: "sm", onClick: explainError, children: "Re-analyze" })] }), _jsxs(Card, { variant: "elevated", className: "border-l-4 border-l-blue-500", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-2 bg-blue-100 rounded-lg", children: _jsx(AlertCircle, { className: "w-5 h-5 text-blue-600" }) }), _jsx(CardTitle, { children: "What's Happening?" })] }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-gray-700 leading-relaxed", children: explanation.explanation }) })] }), explanation.guidingQuestions && explanation.guidingQuestions.length > 0 && (_jsxs(Card, { variant: "elevated", className: "border-l-4 border-l-purple-500", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-2 bg-purple-100 rounded-lg", children: _jsx(HelpCircle, { className: "w-5 h-5 text-purple-600" }) }), _jsx(CardTitle, { children: "Questions to Guide You" })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: explanation.guidingQuestions.map((question, index) => (_jsxs("div", { className: "flex items-start gap-3 p-4 bg-purple-50 rounded-xl", children: [_jsx("div", { className: "flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold", children: index + 1 }), _jsx("p", { className: "text-gray-800 font-medium", children: question })] }, index))) }) })] })), explanation.hints && explanation.hints.length > 0 && (_jsxs(Card, { variant: "elevated", className: "border-l-4 border-l-yellow-500", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-2 bg-yellow-100 rounded-lg", children: _jsx(Lightbulb, { className: "w-5 h-5 text-yellow-600" }) }), _jsx(CardTitle, { children: "Hints to Consider" })] }) }), _jsx(CardContent, { children: _jsx("ul", { className: "space-y-2", children: explanation.hints.map((hint, index) => (_jsxs("li", { className: "flex items-start gap-3 text-gray-700", children: [_jsx("span", { className: "text-yellow-600 mt-0.5", children: "\uD83D\uDCA1" }), _jsx("span", { children: hint })] }, index))) }) })] })), explanation.resourceLinks && explanation.resourceLinks.length > 0 && (_jsxs(Card, { variant: "elevated", className: "border-l-4 border-l-green-500", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-2 bg-green-100 rounded-lg", children: _jsx(BookOpen, { className: "w-5 h-5 text-green-600" }) }), _jsx(CardTitle, { children: "Helpful Resources" })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-2", children: explanation.resourceLinks.map((resource, index) => (_jsx("a", { href: resource, target: "_blank", rel: "noopener noreferrer", className: "block p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-green-700 font-medium group-hover:text-green-800", children: resource }), _jsx("svg", { className: "w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) })] }) }, index))) }) })] })), _jsxs(Card, { variant: "elevated", className: "border-l-4 border-l-gray-500", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-2 bg-gray-100 rounded-lg", children: _jsx(Code, { className: "w-5 h-5 text-gray-600" }) }), _jsx(CardTitle, { children: "Your Code" })] }) }), _jsx(CardContent, { children: _jsx("pre", { className: "bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm font-mono custom-scrollbar", children: _jsx("code", { children: codeContext }) }) })] }), _jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-xl p-4", children: _jsxs("p", { className: "text-sm text-blue-900", children: [_jsx("strong", { children: "Remember:" }), " The goal is for you to understand the problem and solve it yourself. Use these questions and hints to guide your thinking. If you're still stuck, try explaining what you understand so far to your AI tutor!"] }) })] }));
};
