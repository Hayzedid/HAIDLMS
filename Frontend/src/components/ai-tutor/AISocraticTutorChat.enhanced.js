import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Lightbulb } from 'lucide-react';
import { aiTutorApi } from '../../api/ai-tutor.api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn, formatRelativeTime } from '../../lib/utils';
const SUGGESTED_QUESTIONS = [
    "How do I approach this problem?",
    "Can you help me understand this concept?",
    "What am I missing here?",
    "How can I debug this error?",
];
export const AISocraticTutorChat = ({ contextType, contextId, studentCodeContext, onClose, }) => {
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    useEffect(() => {
        startSession();
    }, []);
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const startSession = async () => {
        try {
            setIsLoading(true);
            const newSession = await aiTutorApi.startChatSession({
                contextType,
                contextId,
                studentCodeContext,
            });
            setSession(newSession);
            // Add welcome message
            const welcomeMsg = {
                id: 'welcome',
                sessionId: newSession.id,
                role: 'tutor',
                content: "Hi! 👋 I'm your AI Socratic tutor. I'm here to guide you through learning by asking thoughtful questions. I won't give you direct answers, but I'll help you discover them yourself! What would you like to work on today?",
                createdAt: new Date().toISOString(),
            };
            setMessages([welcomeMsg]);
        }
        catch (err) {
            setError(err.message || 'Failed to start chat session');
        }
        finally {
            setIsLoading(false);
        }
    };
    const sendMessage = async (messageText) => {
        const textToSend = messageText || inputMessage.trim();
        if (!textToSend || !session || isLoading)
            return;
        const userMessage = {
            id: `temp-${Date.now()}`,
            sessionId: session.id,
            role: 'student',
            content: textToSend,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);
        setError('');
        try {
            // Simulate typing delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));
            const tutorResponse = await aiTutorApi.sendMessage(session.id, textToSend);
            setMessages(prev => [...prev, tutorResponse]);
        }
        catch (err) {
            setError(err.message || 'Failed to send message');
            if (err.response?.data?.warningMessage) {
                const warningMsg = {
                    id: `warning-${Date.now()}`,
                    sessionId: session.id,
                    role: 'tutor',
                    content: `⚠️ ${err.response.data.warningMessage}`,
                    createdAt: new Date().toISOString(),
                };
                setMessages(prev => [...prev, warningMsg]);
            }
        }
        finally {
            setIsTyping(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    const handleSuggestedQuestion = (question) => {
        sendMessage(question);
    };
    return (_jsxs("div", { className: "flex flex-col h-full bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50", children: [_jsxs("div", { className: "flex items-center gap-3 p-4 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm", children: [_jsx("div", { className: "p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl", children: _jsx(Bot, { className: "w-6 h-6 text-white" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("h2", { className: "text-lg font-bold text-gray-900 flex items-center gap-2", children: ["AI Socratic Tutor", _jsx(Sparkles, { className: "w-4 h-4 text-purple-500" })] }), _jsx("p", { className: "text-xs text-gray-600", children: "Learn through guided questions" })] }), _jsx(Badge, { variant: "primary", size: "sm", dot: true, children: "Online" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar", children: [messages.length === 0 && !isLoading ? (
                    // Welcome screen
                    _jsxs("div", { className: "flex flex-col items-center justify-center h-full text-center px-4", children: [_jsx("div", { className: "p-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl mb-6 shadow-lg animate-bounce-in", children: _jsx(Bot, { className: "w-16 h-16 text-white" }) }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Welcome to Socratic Learning" }), _jsx("p", { className: "text-gray-600 mb-6 max-w-md", children: "I'll help you learn by asking questions that guide you to discover answers yourself" }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl", children: SUGGESTED_QUESTIONS.map((question, i) => (_jsxs("button", { onClick: () => handleSuggestedQuestion(question), className: "p-4 text-left bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-300 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5 group", children: [_jsx(Lightbulb, { className: "w-5 h-5 text-purple-500 mb-2 group-hover:text-purple-600" }), _jsx("p", { className: "text-sm font-medium text-gray-900", children: question })] }, i))) })] })) : (_jsxs(_Fragment, { children: [messages.map((msg, index) => (_jsxs("div", { className: cn('flex gap-3 animate-fade-in-up', msg.role === 'student' ? 'justify-end' : 'justify-start'), children: [msg.role === 'tutor' && (_jsx("div", { className: "flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center", children: _jsx(Bot, { className: "w-5 h-5 text-white" }) })), _jsxs("div", { className: cn('max-w-[75%] rounded-2xl px-4 py-3 shadow-sm', msg.role === 'student'
                                            ? 'bg-primary-600 text-white rounded-tr-sm'
                                            : 'bg-white text-gray-900 rounded-tl-sm border border-gray-200'), children: [_jsx("p", { className: "whitespace-pre-wrap text-sm leading-relaxed", children: msg.content }), _jsx("p", { className: cn('text-xs mt-2 opacity-70', msg.role === 'student' ? 'text-right' : 'text-left'), children: formatRelativeTime(msg.createdAt) })] }), msg.role === 'student' && (_jsx("div", { className: "flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-600", children: _jsx("span", { className: "text-xs font-bold text-primary-600", children: "You" }) }))] }, msg.id))), isTyping && (_jsxs("div", { className: "flex gap-3 animate-fade-in-up", children: [_jsx("div", { className: "flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center", children: _jsx(Bot, { className: "w-5 h-5 text-white" }) }), _jsx("div", { className: "bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-200", children: _jsxs("div", { className: "flex gap-1", children: [_jsx("span", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0ms' } }), _jsx("span", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '150ms' } }), _jsx("span", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '300ms' } })] }) })] }))] })), _jsx("div", { ref: messagesEndRef })] }), error && (_jsx("div", { className: "mx-4 mb-2 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm", children: error })), _jsxs("div", { className: "p-4 bg-white/80 backdrop-blur-md border-t border-gray-200", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("textarea", { ref: inputRef, value: inputMessage, onChange: (e) => setInputMessage(e.target.value), onKeyPress: handleKeyPress, placeholder: "Type your question here...", disabled: isLoading || isTyping, className: "flex-1 resize-none rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none px-4 py-3 text-sm custom-scrollbar disabled:opacity-50 transition-colors", rows: 2 }), _jsx(Button, { onClick: () => sendMessage(), disabled: !inputMessage.trim() || isLoading || isTyping, size: "lg", variant: "primary", className: "self-end", icon: _jsx(Send, { className: "w-5 h-5" }), children: "Send" })] }), _jsx("p", { className: "text-xs text-gray-500 mt-2 text-center", children: "\uD83D\uDCA1 Press Enter to send \u2022 Shift+Enter for new line" })] })] }));
};
