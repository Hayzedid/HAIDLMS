import React, { useState, useEffect } from 'react';
import {
  learningHealthApi,
  CompositeHealthScore,
} from '../../api/learning-health.api';

interface Props {
  userId: string;
  courseId: string;
}

export const StudentHealthDashboard: React.FC<Props> = ({ userId, courseId }) => {
  const [healthData, setHealthData] = useState<CompositeHealthScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHealthData();
  }, [userId, courseId]);

  const loadHealthData = async () => {
    try {
      setIsLoading(true);
      const data = await learningHealthApi.getUserHealthScore(userId, courseId);
      setHealthData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load health data');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getRiskBadge = (riskLevel: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[riskLevel] || colors.low;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-gray-600">
        No health data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Your Learning Health Score
          </h2>
          <div className={`text-7xl font-bold mb-4 bg-gradient-to-r ${getScoreGradient(healthData.overallScore)} bg-clip-text text-transparent`}>
            {healthData.overallScore.toFixed(0)}
          </div>
          <div className="flex items-center justify-center space-x-4">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getRiskBadge(healthData.riskLevel)}`}>
              Risk Level: {healthData.riskLevel.toUpperCase()}
            </span>
            {healthData.interventionRecommended && (
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                📚 Support Available
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: {new Date(healthData.lastCalculated).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Component Breakdown */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Health Components</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthData.components.map((component) => (
            <div
              key={component.name}
              className={`p-4 rounded-lg border-2 ${
                component.status === 'healthy'
                  ? 'border-green-200 bg-green-50'
                  : component.status === 'warning'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">{component.name}</h4>
                <span className={`text-2xl font-bold ${getScoreColor(component.score)}`}>
                  {component.score.toFixed(0)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full ${
                    component.status === 'healthy'
                      ? 'bg-green-600'
                      : component.status === 'warning'
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${component.score}%` }}
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>Weight: {(component.weight * 100).toFixed(0)}%</p>
                <p className="mt-1 text-xs">
                  Status:{' '}
                  <span
                    className={
                      component.status === 'healthy'
                        ? 'text-green-700 font-semibold'
                        : component.status === 'warning'
                        ? 'text-yellow-700 font-semibold'
                        : 'text-red-700 font-semibold'
                    }
                  >
                    {component.status.toUpperCase()}
                  </span>
                </p>
              </div>

              {/* Component Details */}
              {component.details && Object.keys(component.details).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <details className="text-xs text-gray-600">
                    <summary className="cursor-pointer font-semibold hover:text-gray-800">
                      View Details
                    </summary>
                    <div className="mt-2 space-y-1">
                      {Object.entries(component.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {healthData.interventionRecommended && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📚 Recommended Actions
          </h3>
          <p className="text-blue-800 mb-4">
            Based on your health score, we recommend focusing on the following areas:
          </p>
          <ul className="space-y-2">
            {healthData.components
              .filter(c => c.status !== 'healthy')
              .map((component, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span className="text-blue-900">
                    <strong>{component.name}:</strong> Consider reviewing this area to improve your score.
                  </span>
                </li>
              ))}
          </ul>
          <div className="mt-4 p-3 bg-white rounded border border-blue-300">
            <p className="text-sm text-blue-900">
              💡 <strong>Tip:</strong> Contact your instructor if you need additional support or guidance.
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          ℹ️ About Your Health Score
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Your Learning Health Score is a composite metric that combines multiple aspects of your learning journey:
        </p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li><strong>Video Accountability:</strong> How engaged you are with video content</li>
          <li><strong>Spaced Repetition:</strong> Your consistency with review sessions</li>
          <li><strong>IDE Integrity:</strong> Your coding practices and academic integrity</li>
          <li><strong>Assessment Performance:</strong> Your quiz and test scores</li>
          <li><strong>Peer Review:</strong> Your participation in peer code reviews</li>
        </ul>
        <p className="text-sm text-gray-600 mt-3">
          A healthy score indicates you're on track for success in this course!
        </p>
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadHealthData}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        🔄 Refresh Health Score
      </button>
    </div>
  );
};
