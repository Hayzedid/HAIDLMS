import React, { useState } from 'react';
import { MessageCircle, AlertCircle, Bot, Sparkles } from 'lucide-react';
import { AISocraticTutorChat } from '../../components/ai-tutor/AISocraticTutorChat.enhanced';
import { ErrorExplanation } from '../../components/ai-tutor/ErrorExplanation.enhanced';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';

export const AITutorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'error'>('chat');
  const [errorContext, setErrorContext] = useState({
    errorMessage: '',
    codeContext: '',
    language: 'javascript',
    stackTrace: '',
  });

  const tabs = [
    {
      id: 'chat' as const,
      label: 'Chat with Tutor',
      icon: MessageCircle,
      description: 'Get guided help through conversation',
    },
    {
      id: 'error' as const,
      label: 'Error Explanation',
      icon: AlertCircle,
      description: 'Analyze and understand your errors',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-display font-bold text-gray-900">
              AI Socratic Tutor
            </h1>
            <Sparkles className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn through guided questions and critical thinking. The AI won't give you direct answers,
            but will help you discover them yourself!
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-2 shadow-lg inline-flex gap-2 mx-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all-normal',
                    isActive
                      ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-200 scale-105'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isActive && 'animate-pulse-slow')} />
                  <div className="text-left">
                    <div className="text-sm font-bold">{tab.label}</div>
                    <div className={cn('text-xs', isActive ? 'text-purple-100' : 'text-gray-500')}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'chat' ? (
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            style={{ height: 'calc(100vh - 320px)', minHeight: '500px' }}
          >
            <AISocraticTutorChat contextType="general" />
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Error Input Form */}
            <Card variant="elevated" className="backdrop-blur-md bg-white/90">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-purple-600" />
                  Paste Your Error for Socratic Guidance
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Error Message *
                    </label>
                    <input
                      type="text"
                      value={errorContext.errorMessage}
                      onChange={(e) =>
                        setErrorContext((prev) => ({ ...prev, errorMessage: e.target.value }))
                      }
                      placeholder="e.g., TypeError: Cannot read property 'length' of undefined"
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-purple-500 focus:outline-none rounded-xl transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Code Context *
                    </label>
                    <textarea
                      value={errorContext.codeContext}
                      onChange={(e) =>
                        setErrorContext((prev) => ({ ...prev, codeContext: e.target.value }))
                      }
                      placeholder="Paste the code where the error occurred..."
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-purple-500 focus:outline-none rounded-xl font-mono text-sm custom-scrollbar transition-colors"
                      rows={10}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={errorContext.language}
                        onChange={(e) =>
                          setErrorContext((prev) => ({ ...prev, language: e.target.value }))
                        }
                        className="w-full px-4 py-3 border-2 border-gray-200 focus:border-purple-500 focus:outline-none rounded-xl transition-colors"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="csharp">C#</option>
                        <option value="ruby">Ruby</option>
                        <option value="go">Go</option>
                        <option value="rust">Rust</option>
                        <option value="typescript">TypeScript</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Stack Trace (optional)
                      </label>
                      <textarea
                        value={errorContext.stackTrace}
                        onChange={(e) =>
                          setErrorContext((prev) => ({ ...prev, stackTrace: e.target.value }))
                        }
                        placeholder="Paste stack trace if available..."
                        className="w-full px-4 py-3 border-2 border-gray-200 focus:border-purple-500 focus:outline-none rounded-xl font-mono text-xs custom-scrollbar transition-colors"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Explanation Component */}
            {errorContext.errorMessage && errorContext.codeContext && (
              <ErrorExplanation
                errorMessage={errorContext.errorMessage}
                codeContext={errorContext.codeContext}
                language={errorContext.language}
                stackTrace={errorContext.stackTrace}
              />
            )}
          </div>
        )}

        {/* Info Box */}
        <Card variant="elevated" className="mt-8 backdrop-blur-md bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              How the Socratic Method Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Badge variant="primary" size="sm">
                  1
                </Badge>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Ask Questions</p>
                  <p className="text-xs text-blue-700 mt-1">
                    The AI guides you with questions instead of giving direct answers
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="primary" size="sm">
                  2
                </Badge>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Think Critically</p>
                  <p className="text-xs text-blue-700 mt-1">
                    You'll develop problem-solving skills by working through challenges
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="primary" size="sm">
                  3
                </Badge>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Learn Deeply</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Understanding "why" is more important than memorizing "what"
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="primary" size="sm">
                  4
                </Badge>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Build Confidence</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Solving problems yourself builds lasting confidence and skills
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white/60 rounded-xl border border-blue-300">
              <p className="text-sm text-blue-900">
                <strong>Remember:</strong> The AI tutor will <em>never</em> write code for you or give
                you direct solutions. If you ask for code, you'll get more questions to help you write
                it yourself!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
