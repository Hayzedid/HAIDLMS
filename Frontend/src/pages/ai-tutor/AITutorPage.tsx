import React, { useState } from 'react';
import { AISocraticTutorChat } from '../../components/ai-tutor/AISocraticTutorChat.enhanced';
import { ErrorExplanation } from '../../components/ai-tutor/ErrorExplanation.enhanced';
import { AppLayout } from '../../components/layout';
import { Tabs } from '../../components/ui';
import { MessageSquare, AlertCircle } from 'lucide-react';

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
      id: 'chat',
      label: 'Chat with AI Tutor',
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: 'error',
      label: 'Error Explanation',
      icon: <AlertCircle className="w-4 h-4" />,
    },
  ];

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Socratic Tutor
        </h1>
        <p className="text-gray-600">
          Learn through guided questions and critical thinking. The AI won't give you direct answers, but will help you discover them yourself!
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as 'chat' | 'error')}
          variant="underline"
        />
      </div>

      {/* Content */}
      {activeTab === 'chat' ? (
        <div className="bg-white rounded-lg shadow-lg" style={{ height: 'calc(100vh - 300px)' }}>
          <AISocraticTutorChat
            contextType="general"
          />
        </div>
      ) : (
          <div className="space-y-6">
            {/* Error Input Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Paste Your Error for Socratic Guidance
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Error Message *
                  </label>
                  <input
                    type="text"
                    value={errorContext.errorMessage}
                    onChange={(e) => setErrorContext(prev => ({ ...prev, errorMessage: e.target.value }))}
                    placeholder="e.g., TypeError: Cannot read property 'length' of undefined"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Code Context *
                  </label>
                  <textarea
                    value={errorContext.codeContext}
                    onChange={(e) => setErrorContext(prev => ({ ...prev, codeContext: e.target.value }))}
                    placeholder="Paste the code where the error occurred..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    rows={8}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <select
                      value={errorContext.language}
                      onChange={(e) => setErrorContext(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="csharp">C#</option>
                      <option value="ruby">Ruby</option>
                      <option value="go">Go</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stack Trace (optional)
                    </label>
                    <textarea
                      value={errorContext.stackTrace}
                      onChange={(e) => setErrorContext(prev => ({ ...prev, stackTrace: e.target.value }))}
                      placeholder="Paste stack trace if available..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

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
      <div className="mt-8 bg-primary-50 border border-primary-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-2">
          💡 How the Socratic Method Works
        </h3>
        <ul className="text-sm text-primary-800 space-y-1">
          <li>✓ <strong>Ask Questions:</strong> The AI will guide you with questions instead of giving direct answers</li>
          <li>✓ <strong>Think Critically:</strong> You'll develop problem-solving skills by working through challenges yourself</li>
          <li>✓ <strong>Learn Deeply:</strong> Understanding "why" is more important than memorizing "what"</li>
          <li>✓ <strong>Build Confidence:</strong> Solving problems yourself builds lasting confidence</li>
        </ul>
        <div className="mt-4 p-3 bg-white border border-primary-300 rounded">
          <p className="text-sm text-primary-900">
            <strong>Remember:</strong> The AI tutor will <em>never</em> write code for you or give you direct solutions.
            If you ask for code, you'll get more questions to help you write it yourself!
          </p>
        </div>
      </div>
    </AppLayout>
  );
};
