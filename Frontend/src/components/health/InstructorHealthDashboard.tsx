import React, { useState, useEffect } from 'react';
import {
  learningHealthApi,
  DashboardSummary,
  AtRiskLearner,
  InstructorNudge,
} from '../../api/learning-health.api';

interface Props {
  courseId: string;
}

export const InstructorHealthDashboard: React.FC<Props> = ({ courseId }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [atRiskLearners, setAtRiskLearners] = useState<AtRiskLearner[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<AtRiskLearner | null>(null);
  const [nudge, setNudge] = useState<InstructorNudge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'critical' | 'high' | 'medium'>('all');

  useEffect(() => {
    loadDashboardData();
  }, [courseId]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [summaryData, learnersData] = await Promise.all([
        learningHealthApi.getDashboardSummary(courseId),
        learningHealthApi.getAtRiskLearners(courseId),
      ]);
      setSummary(summaryData);
      setAtRiskLearners(learnersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNudge = async (learner: AtRiskLearner) => {
    try {
      setSelectedLearner(learner);
      const nudgeData = await learningHealthApi.generateInstructorNudge(
        learner.userId,
        courseId
      );
      setNudge(nudgeData);
    } catch (err: any) {
      setError(err.message || 'Failed to generate nudge');
    }
  };

  const filteredLearners =
    filterRisk === 'all'
      ? atRiskLearners
      : atRiskLearners.filter(l => l.riskLevel === filterRisk);

  const getRiskColor = (riskLevel: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[riskLevel] || colors.low;
  };

  const getRiskIcon = (riskLevel: string) => {
    const icons: Record<string, string> = {
      low: '✅',
      medium: '⚠️',
      high: '🔴',
      critical: '🚨',
    };
    return icons[riskLevel] || '•';
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

  if (!summary) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-gray-600">
        No dashboard data available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Enrolled</p>
              <p className="text-3xl font-bold text-gray-800">{summary.totalEnrolled}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Healthy</p>
              <p className="text-3xl font-bold text-green-600">{summary.healthyCount}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">At Risk</p>
              <p className="text-3xl font-bold text-orange-600">{summary.atRiskCount}</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">At Risk %</p>
              <p className="text-3xl font-bold text-red-600">{summary.atRiskPercentage}%</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Risk Distribution</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {summary.riskDistribution.critical}
            </div>
            <p className="text-sm text-gray-600 mt-1">Critical</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {summary.riskDistribution.high}
            </div>
            <p className="text-sm text-gray-600 mt-1">High</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {summary.riskDistribution.medium}
            </div>
            <p className="text-sm text-gray-600 mt-1">Medium</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {summary.riskDistribution.low}
            </div>
            <p className="text-sm text-gray-600 mt-1">Low</p>
          </div>
        </div>
      </div>

      {/* At-Risk Learners List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">At-Risk Learners</h3>
          <div className="flex space-x-2">
            {(['all', 'critical', 'high', 'medium'] as const).map(risk => (
              <button
                key={risk}
                onClick={() => setFilterRisk(risk)}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                  filterRisk === risk
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {risk === 'all' ? 'All' : risk.charAt(0).toUpperCase() + risk.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredLearners.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              No at-risk learners in this category 🎉
            </p>
          ) : (
            filteredLearners.map(learner => (
              <div
                key={learner.userId}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getRiskIcon(learner.riskLevel)}</span>
                      <div>
                        <h4 className="font-semibold text-gray-800">Student {learner.userId.slice(0, 8)}...</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskColor(learner.riskLevel)}`}>
                            {learner.riskLevel.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600">
                            Health Score: <strong>{learner.healthScore.toFixed(0)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Flags */}
                    {learner.flags.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Concerns:</p>
                        <div className="flex flex-wrap gap-1">
                          {learner.flags.map((flag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs"
                            >
                              {flag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {learner.recommendations.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Recommendations:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {learner.recommendations.map((rec, idx) => (
                            <li key={idx}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => generateNudge(learner)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    Generate Nudge
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Nudge Modal */}
      {nudge && selectedLearner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Instructor Nudge for Student
                </h3>
                <button
                  onClick={() => {
                    setNudge(null);
                    setSelectedLearner(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Priority Badge */}
                <div className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${
                  nudge.priority === 'high'
                    ? 'bg-red-100 text-red-800'
                    : nudge.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  Priority: {nudge.priority.toUpperCase()}
                </div>

                {/* Nudge Message */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{nudge.message}</p>
                </div>

                {/* Component Breakdown */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Component Scores:</h4>
                  <div className="space-y-2">
                    {nudge.components.map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{comp.name}</span>
                        <span className={`font-semibold ${
                          comp.score >= 70 ? 'text-green-600' :
                          comp.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {comp.score.toFixed(0)}% ({comp.status})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      // Here you would send the nudge via email/notification
                      alert('Nudge would be sent to the student');
                      setNudge(null);
                      setSelectedLearner(null);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Send Nudge
                  </button>
                  <button
                    onClick={() => {
                      setNudge(null);
                      setSelectedLearner(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
