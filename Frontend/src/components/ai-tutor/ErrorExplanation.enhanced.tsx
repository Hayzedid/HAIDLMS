import React, { useState } from 'react';
import { AlertCircle, HelpCircle, Lightbulb, BookOpen, Loader2, Code } from 'lucide-react';
import { aiTutorApi, ErrorExplanation as ErrorExplanationType } from '../../api/ai-tutor.api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

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
    } catch (err: any) {
      setError(err.message || 'Failed to explain error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!explanation && !isLoading) {
    return (
      <Card variant="elevated" className="border-l-4 border-l-purple-500">
        <CardContent className="text-center py-8">
          <div className="inline-flex p-4 bg-purple-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Get Socratic Guidance for Your Error
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            I'll analyze your error and help you understand what went wrong through guided questions
          </p>
          <Button onClick={explainError} size="lg" variant="primary">
            Analyze Error
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
            <div className="text-center">
              <p className="font-semibold text-gray-900 mb-1">Analyzing your error...</p>
              <p className="text-sm text-gray-600">This may take a moment</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="bordered" className="border-danger-300 bg-danger-50">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-danger-700">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Error Type Badge */}
      <div className="flex items-center justify-between">
        <Badge variant="danger" size="lg">
          {explanation!.errorType}
        </Badge>
        <Button variant="ghost" size="sm" onClick={explainError}>
          Re-analyze
        </Button>
      </div>

      {/* Explanation */}
      <Card variant="elevated" className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle>What's Happening?</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{explanation!.explanation}</p>
        </CardContent>
      </Card>

      {/* Guiding Questions */}
      {explanation!.guidingQuestions && explanation!.guidingQuestions.length > 0 && (
        <Card variant="elevated" className="border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <HelpCircle className="w-5 h-5 text-purple-600" />
              </div>
              <CardTitle>Questions to Guide You</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {explanation!.guidingQuestions.map((question, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                  <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-gray-800 font-medium">{question}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hints */}
      {explanation!.hints && explanation!.hints.length > 0 && (
        <Card variant="elevated" className="border-l-4 border-l-yellow-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
              </div>
              <CardTitle>Hints to Consider</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {explanation!.hints.map((hint, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-700">
                  <span className="text-yellow-600 mt-0.5">💡</span>
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Resources */}
      {explanation!.resourceLinks && explanation!.resourceLinks.length > 0 && (
        <Card variant="elevated" className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <CardTitle>Helpful Resources</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {explanation!.resourceLinks.map((resource, index) => (
                <a
                  key={index}
                  href={resource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 font-medium group-hover:text-green-800">
                      {resource}
                    </span>
                    <svg
                      className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Code Context */}
      <Card variant="elevated" className="border-l-4 border-l-gray-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Code className="w-5 h-5 text-gray-600" />
            </div>
            <CardTitle>Your Code</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm font-mono custom-scrollbar">
            <code>{codeContext}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-900">
          <strong>Remember:</strong> The goal is for you to understand the problem and solve it yourself.
          Use these questions and hints to guide your thinking. If you're still stuck, try explaining
          what you understand so far to your AI tutor!
        </p>
      </div>
    </div>
  );
};
