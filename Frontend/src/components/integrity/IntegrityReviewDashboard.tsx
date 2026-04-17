import React, { useState, useEffect } from 'react';
import {
  clipboardKeystrokeApi,
  IntegrityFlag,
  KeystrokeSession,
  ClipboardAttempt,
} from '../../api/clipboard-keystroke.api';

interface Props {
  assessmentId?: string;
}

export const IntegrityReviewDashboard: React.FC<Props> = ({ assessmentId }) => {
  const [flags, setFlags] = useState<IntegrityFlag[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<IntegrityFlag | null>(null);
  const [sessionData, setSessionData] = useState<KeystrokeSession | null>(null);
  const [clipboardAttempts, setClipboardAttempts] = useState<ClipboardAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [filterReviewed, setFilterReviewed] = useState<'all' | 'reviewed' | 'unreviewed'>('unreviewed');

  // Review form
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('no_action');

  useEffect(() => {
    loadFlags();
  }, [assessmentId, filterSeverity, filterReviewed]);

  const loadFlags = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (assessmentId) params.assessmentId = assessmentId;
      if (filterSeverity !== 'all') params.severity = filterSeverity;
      if (filterReviewed === 'reviewed') params.reviewed = true;
      if (filterReviewed === 'unreviewed') params.reviewed = false;

      const flagsData = await clipboardKeystrokeApi.getIntegrityFlags(params);
      setFlags(flagsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load flags');
    } finally {
      setIsLoading(false);
    }
  };

  const viewFlagDetails = async (flag: IntegrityFlag) => {
    try {
      setSelectedFlag(flag);
      const [session, attempts] = await Promise.all([
        clipboardKeystrokeApi.getKeystrokeSession(flag.sessionId),
        clipboardKeystrokeApi.getSessionAttempts(flag.sessionId),
      ]);
      setSessionData(session);
      setClipboardAttempts(attempts);
    } catch (err: any) {
      setError(err.message || 'Failed to load session details');
    }
  };

  const submitReview = async () => {
    if (!selectedFlag || !reviewNotes.trim()) {
      setError('Please provide review notes');
      return;
    }

    try {
      await clipboardKeystrokeApi.reviewIntegrityFlag(selectedFlag.id, {
        reviewNotes,
        actionTaken,
      });

      // Refresh flags list
      await loadFlags();

      // Close modal
      setSelectedFlag(null);
      setSessionData(null);
      setClipboardAttempts([]);
      setReviewNotes('');
      setActionTaken('no_action');
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[severity] || colors.low;
  };

  const getSeverityIcon = (severity: string) => {
    const icons: Record<string, string> = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🔴',
      critical: '🚨',
    };
    return icons[severity] || 'ℹ️';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Integrity Review Dashboard</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <div className="flex space-x-2">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map(severity => (
                <button
                  key={severity}
                  onClick={() => setFilterSeverity(severity)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                    filterSeverity === severity
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {severity === 'all' ? 'All' : severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Review Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="flex space-x-2">
              {(['all', 'unreviewed', 'reviewed'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterReviewed(status)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                    filterReviewed === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Flags List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Integrity Flags ({flags.length})
        </h3>

        {flags.length === 0 ? (
          <p className="text-center text-gray-600 py-8">No integrity flags found 🎉</p>
        ) : (
          <div className="space-y-3">
            {flags.map(flag => (
              <div
                key={flag.id}
                className={`border rounded-lg p-4 transition ${
                  flag.reviewed
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-orange-200 bg-orange-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getSeverityIcon(flag.severity)}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityBadge(flag.severity)}`}>
                            {flag.severity.toUpperCase()}
                          </span>
                          <span className="text-sm font-semibold text-gray-800">
                            {flag.flagType.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          {flag.reviewed && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                              ✓ Reviewed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1 mt-2">
                      <p>Session: {flag.sessionId.slice(0, 8)}...</p>
                      <p>Flagged: {new Date(flag.createdAt).toLocaleString()}</p>
                      {flag.reviewed && flag.reviewedBy && (
                        <p>Reviewed by: {flag.reviewedBy.slice(0, 8)}... at {new Date(flag.reviewedAt!).toLocaleString()}</p>
                      )}
                    </div>

                    {flag.reviewed && flag.reviewNotes && (
                      <div className="mt-2 p-2 bg-white border border-gray-200 rounded text-sm">
                        <p className="font-semibold text-gray-700">Review Notes:</p>
                        <p className="text-gray-600 mt-1">{flag.reviewNotes}</p>
                        <p className="text-xs text-gray-500 mt-1">Action: {flag.actionTaken}</p>
                      </div>
                    )}
                  </div>

                  {!flag.reviewed && (
                    <button
                      onClick={() => viewFlagDetails(flag)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedFlag && sessionData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Review Integrity Flag</h3>
                <button
                  onClick={() => {
                    setSelectedFlag(null);
                    setSessionData(null);
                    setClipboardAttempts([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Flag Info */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{getSeverityIcon(selectedFlag.severity)}</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityBadge(selectedFlag.severity)}`}>
                      {selectedFlag.severity.toUpperCase()}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {selectedFlag.flagType.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{selectedFlag.description}</p>
                  {selectedFlag.evidence && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer font-semibold">Evidence</summary>
                      <pre className="mt-1 p-2 bg-white rounded text-gray-700 overflow-x-auto">
                        {JSON.stringify(selectedFlag.evidence, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>

                {/* Session Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs text-gray-600">Total Keystrokes</p>
                    <p className="text-lg font-bold text-gray-800">{sessionData.totalKeystrokes}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs text-gray-600">Typing Speed</p>
                    <p className="text-lg font-bold text-gray-800">
                      {sessionData.avgTypingSpeedWPM?.toFixed(0) || 'N/A'} WPM
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs text-gray-600">Paste Attempts</p>
                    <p className="text-lg font-bold text-gray-800">{sessionData.totalPasteAttempts}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-xs text-gray-600">Suspicious Bursts</p>
                    <p className="text-lg font-bold text-gray-800">
                      {sessionData.hasSuspiciousBurst ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                {/* Clipboard Attempts */}
                {clipboardAttempts.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Clipboard Attempts ({clipboardAttempts.length})
                    </h4>
                    <div className="space-y-1 text-sm">
                      {clipboardAttempts.slice(0, 5).map((attempt, idx) => (
                        <div key={idx} className="flex justify-between text-gray-700">
                          <span>{attempt.attemptType.toUpperCase()}</span>
                          <span>{attempt.blocked ? '🚫 Blocked' : '✅ Allowed'}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(attempt.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                      {clipboardAttempts.length > 5 && (
                        <p className="text-xs text-gray-500 text-center mt-2">
                          ...and {clipboardAttempts.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Review Form */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Your Review</h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Action Taken
                      </label>
                      <select
                        value={actionTaken}
                        onChange={(e) => setActionTaken(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="no_action">No Action - False Positive</option>
                        <option value="warning_issued">Warning Issued</option>
                        <option value="grade_penalty">Grade Penalty Applied</option>
                        <option value="academic_integrity_violation">Academic Integrity Violation</option>
                        <option value="requires_further_investigation">Requires Further Investigation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Review Notes *
                      </label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Explain your decision and any actions taken..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows={4}
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={submitReview}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        Submit Review
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFlag(null);
                          setSessionData(null);
                          setClipboardAttempts([]);
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
          </div>
        </div>
      )}
    </div>
  );
};
