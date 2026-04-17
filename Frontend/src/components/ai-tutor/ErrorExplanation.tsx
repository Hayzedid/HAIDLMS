import React, { useState } from 'react';
import { aiTutorApi, ErrorExplanation as ErrorExplanationType } from '../../api/ai-tutor.api';

interface Props {
  errorMessage: string;
  codeContext: string;
  language: string;
  stackTrace?: string;
}

export const ErrorExplanation: React.FC<Props> = ({
  errorMessage,
  codeContext,
  language,
  stackTrace,
}) => {
  const [explanation, setExplanation] = useState<ErrorExplanationType | null>(null);
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
    } catch (err: any) {
      setError(err.message || 'Failed to get explanation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <span className="text-2xl mr-2">🔍</span>
          Error Explanation (Socratic Method)
        </h3>
        {!explanation && (
          <button
            onClick={explainError}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition"
          >
            {isLoading ? 'Analyzing...' : 'Get AI Help'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {explanation && (
        <div className="space-y-4">
          {/* Explanation */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Understanding the Error:</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{explanation.explanation}</p>
          </div>

          {/* Guiding Questions */}
          {explanation.guidingQuestions && explanation.guidingQuestions.length > 0 && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">🤔 Questions to Guide You:</h4>
              <ul className="list-disc list-inside space-y-1">
                {explanation.guidingQuestions.map((question, idx) => (
                  <li key={idx} className="text-gray-700">{question}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Hints */}
          {explanation.hints && explanation.hints.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">💡 Hints (Think About These):</h4>
              <ul className="list-disc list-inside space-y-1">
                {explanation.hints.map((hint, idx) => (
                  <li key={idx} className="text-gray-700">{hint}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Resources */}
          {explanation.resourceLinks && explanation.resourceLinks.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">📚 Helpful Resources:</h4>
              <ul className="list-disc list-inside space-y-1">
                {explanation.resourceLinks.map((link, idx) => (
                  <li key={idx}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-sm text-gray-600 italic">
            💭 Remember: I won't give you the solution directly. Work through these questions and hints to understand and fix the error yourself!
          </div>
        </div>
      )}
    </div>
  );
};
