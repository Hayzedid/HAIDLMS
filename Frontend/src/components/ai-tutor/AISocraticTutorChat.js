import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { aiTutorApi } from '../../api/ai-tutor.api';
export const AISocraticTutorChat = ({ contextType, contextId, studentCodeContext, onClose, }) => {
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);
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
                content: "Hi! I'm your AI tutor. I'm here to guide you through learning by asking questions and helping you think critically. I won't give you direct answers, but I'll help you discover them yourself! What would you like to work on?",
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
    const sendMessage = async () => {
        if (!inputMessage.trim() || !session || isLoading)
            return;
        const userMessage = {
            id: `temp-${Date.now()}`,
            sessionId: session.id,
            role: 'student',
            content: inputMessage,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setError('');
        try {
            const tutorResponse = await aiTutorApi.sendMessage(session.id, inputMessage);
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
            setIsLoading(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    const endSession = async () => {
        if (session) {
            try {
                await aiTutorApi.endChatSession(session.id);
                if (onClose)
                    onClose();
            }
            catch (err) {
                console.error('Failed to end session:', err);
            }
        }
    };
    return (_jsxs("div", { className: "flex flex-col h-full bg-white rounded-lg shadow-lg", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-10 h-10 bg-white rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-2xl", children: "\uD83E\uDD16" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: "AI Socratic Tutor" }), _jsx("p", { className: "text-xs opacity-90", children: "Guiding you through learning" })] })] }), onClose && (_jsx("button", { onClick: endSession, className: "text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) }))] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [messages.map((msg) => (_jsx("div", { className: `flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'student'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-800'}`, children: [_jsx("p", { className: "text-sm whitespace-pre-wrap", children: msg.content }), _jsx("span", { className: "text-xs opacity-70 mt-1 block", children: new Date(msg.createdAt).toLocaleTimeString() })] }) }, msg.id))), isLoading && (_jsx("div", { className: "flex justify-start", children: _jsx("div", { className: "bg-gray-100 rounded-lg px-4 py-2", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0ms' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '150ms' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '300ms' } })] }) }) })), _jsx("div", { ref: messagesEndRef })] }), error && (_jsx("div", { className: "px-4 py-2 bg-red-50 text-red-600 text-sm", children: error })), _jsxs("div", { className: "border-t border-gray-200 p-4", children: [_jsxs("div", { className: "flex space-x-2", children: [_jsx("textarea", { value: inputMessage, onChange: (e) => setInputMessage(e.target.value), onKeyPress: handleKeyPress, placeholder: "Ask a question or describe what you're struggling with...", className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none", rows: 2, disabled: isLoading || !session }), _jsx("button", { onClick: sendMessage, disabled: !inputMessage.trim() || isLoading || !session, className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" }) }) })] }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "\uD83D\uDCA1 Tip: I'll guide you with questions, not direct answers. Press Enter to send, Shift+Enter for new line." })] })] }));
};
