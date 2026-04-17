import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Lightbulb } from 'lucide-react';
import { aiTutorApi, ChatSession, ChatMessage } from '../../api/ai-tutor.api';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Badge } from '../ui/Badge';
import { cn, formatRelativeTime } from '../../lib/utils';

interface Props {
  contextType: 'lesson' | 'assessment' | 'ide' | 'general';
  contextId?: string;
  studentCodeContext?: string;
  onClose?: () => void;
}

const SUGGESTED_QUESTIONS = [
  "How do I approach this problem?",
  "Can you help me understand this concept?",
  "What am I missing here?",
  "How can I debug this error?",
];

export const AISocraticTutorChat: React.FC<Props> = ({
  contextType,
  contextId,
  studentCodeContext,
  onClose,
}) => {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        sessionId: newSession.id,
        role: 'tutor',
        content: "Hi! 👋 I'm your AI Socratic tutor. I'm here to guide you through learning by asking thoughtful questions. I won't give you direct answers, but I'll help you discover them yourself! What would you like to work on today?",
        createdAt: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
    } catch (err: any) {
      setError(err.message || 'Failed to start chat session');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim();
    if (!textToSend || !session || isLoading) return;

    const userMessage: ChatMessage = {
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
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      if (err.response?.data?.warningMessage) {
        const warningMsg: ChatMessage = {
          id: `warning-${Date.now()}`,
          sessionId: session.id,
          role: 'tutor',
          content: `⚠️ ${err.response.data.warningMessage}`,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, warningMsg]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            AI Socratic Tutor
            <Sparkles className="w-4 h-4 text-purple-500" />
          </h2>
          <p className="text-xs text-gray-600">Learn through guided questions</p>
        </div>
        <Badge variant="primary" size="sm" dot>
          Online
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && !isLoading ? (
          // Welcome screen
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="p-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl mb-6 shadow-lg animate-bounce-in">
              <Bot className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Socratic Learning
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              I'll help you learn by asking questions that guide you to discover answers yourself
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {SUGGESTED_QUESTIONS.map((question, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="p-4 text-left bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-purple-300 rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5 group"
                >
                  <Lightbulb className="w-5 h-5 text-purple-500 mb-2 group-hover:text-purple-600" />
                  <p className="text-sm font-medium text-gray-900">{question}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 animate-fade-in-up',
                  msg.role === 'student' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'tutor' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-3 shadow-sm',
                    msg.role === 'student'
                      ? 'bg-primary-600 text-white rounded-tr-sm'
                      : 'bg-white text-gray-900 rounded-tl-sm border border-gray-200'
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.content}
                  </p>
                  <p
                    className={cn(
                      'text-xs mt-2 opacity-70',
                      msg.role === 'student' ? 'text-right' : 'text-left'
                    )}
                  >
                    {formatRelativeTime(msg.createdAt)}
                  </p>
                </div>
                {msg.role === 'student' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center border-2 border-primary-600">
                    <span className="text-xs font-bold text-primary-600">You</span>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 animate-fade-in-up">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-200">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your question here..."
            disabled={isLoading || isTyping}
            className="flex-1 resize-none rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:outline-none px-4 py-3 text-sm custom-scrollbar disabled:opacity-50 transition-colors"
            rows={2}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isLoading || isTyping}
            size="lg"
            variant="primary"
            className="self-end"
            icon={<Send className="w-5 h-5" />}
          >
            Send
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
