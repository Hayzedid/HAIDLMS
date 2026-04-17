import React, { useState, useEffect } from 'react';
import { peerReviewApi, ReviewDispute, CodeReview } from '../../api/peer-review.api';
import { AlertTriangle, CheckCircle, XCircle, Clock, FileText, MessageSquare } from 'lucide-react';

interface Props {
  userRole: 'student' | 'instructor';
  userId: string;
}

export const DisputeManagement: React.FC<Props> = ({ userRole, userId }) => {
  const [disputes, setDisputes] = useState<ReviewDispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<ReviewDispute | null>(null);
  const [review, setReview] = useState<CodeReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Resolution form (instructor only)
  const [resolution, setResolution] = useState('');
  const [resolutionAction, setResolutionAction] = useState<
    'no_change' | 'score_adjusted' | 'review_removed' | 're_review_assigned'
  >('no_change');
  const [newScore, setNewScore] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadDisputes();
  }, []);

  useEffect(() => {
    if (selectedDispute) {
      loadReviewDetails(selectedDispute.reviewId);
    }
  }, [selectedDispute]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await peerReviewApi.getDisputes(
        userRole === 'instructor' ? undefined : 'open,under_review'
      );

      // Filter by user if student
      const filteredDisputes =
        userRole === 'student' ? data.filter(d => d.authorId === userId) : data;

      setDisputes(filteredDisputes);
    } catch (err: any) {
      setError(err.message || 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const loadReviewDetails = async (reviewId: string) => {
    try {
      const reviewData = await peerReviewApi.getReview(reviewId);
      setReview(reviewData);
    } catch (err: any) {
      console.error('Failed to load review:', err);
    }
  };

  const resolveDispute = async () => {
    if (!selectedDispute) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await peerReviewApi.resolveDispute(selectedDispute.id, {
        resolvedBy: userId,
        resolution,
        resolutionAction,
        newScore,
      });

      setSuccess('Dispute resolved successfully!');
      setSelectedDispute(null);
      setResolution('');
      setNewScore(undefined);
      await loadDisputes();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve dispute');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      open: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Open' },
      under_review: { bg: 'bg-blue-100', text: 'text-blue-700', icon: FileText, label: 'Under Review' },
      resolved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Resolved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Rejected' },
    };
    const badge = badges[status as keyof typeof badges] || badges.open;
    const Icon = badge.icon;
    return (
      <span className={`px-3 py-1 ${badge.bg} ${badge.text} text-sm rounded-full font-medium flex items-center gap-1`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  if (loading && disputes.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
              Review Disputes
            </h2>
            <p className="text-gray-600 mt-1">
              {userRole === 'instructor'
                ? 'Review and resolve student disputes'
                : 'View your dispute submissions and resolutions'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{disputes.length}</p>
            <p className="text-sm text-gray-600">Total Disputes</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}
      </div>

      {disputes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No disputes</h3>
          <p className="text-gray-500">
            {userRole === 'instructor'
              ? 'No peer review disputes to resolve.'
              : 'You have no active disputes.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Disputes List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Disputes ({disputes.length})</h3>
            <div className="space-y-3">
              {disputes.map(dispute => (
                <button
                  key={dispute.id}
                  onClick={() => setSelectedDispute(dispute)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    selectedDispute?.id === dispute.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-gray-800">
                      Review #{dispute.reviewId.slice(-6)}
                    </span>
                    {getStatusBadge(dispute.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{dispute.reason}</p>
                  <p className="text-xs text-gray-500">
                    Opened: {new Date(dispute.openedAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Dispute Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedDispute ? (
              <>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold">Dispute Details</h3>
                    {getStatusBadge(selectedDispute.status)}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Reason</h4>
                      <p className="text-gray-900">{selectedDispute.reason}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                      <p className="text-gray-600">{selectedDispute.description}</p>
                    </div>

                    {selectedDispute.requestedOutcome && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Requested Outcome</h4>
                        <p className="text-gray-600">{selectedDispute.requestedOutcome}</p>
                      </div>
                    )}

                    {review && (
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Review Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Overall Score:</span>
                            <span className="ml-2 font-semibold">
                              {review.overallScore?.toFixed(1) || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Time Spent:</span>
                            <span className="ml-2 font-semibold">
                              {review.timeSpentSeconds
                                ? `${Math.floor(review.timeSpentSeconds / 60)} min`
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedDispute.status === 'resolved' && (
                      <div className="pt-4 border-t bg-green-50 -m-6 p-6 mt-4">
                        <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Resolution
                        </h4>
                        <p className="text-green-700 mb-2">{selectedDispute.resolution}</p>
                        <div className="text-sm text-green-600">
                          <p>Action: {selectedDispute.resolutionAction?.replace(/_/g, ' ')}</p>
                          <p>
                            Resolved by {selectedDispute.resolvedBy} on{' '}
                            {selectedDispute.resolvedAt
                              ? new Date(selectedDispute.resolvedAt).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedDispute.status === 'rejected' && (
                      <div className="pt-4 border-t bg-red-50 -m-6 p-6 mt-4">
                        <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                          <XCircle className="w-5 h-5" />
                          Dispute Rejected
                        </h4>
                        <p className="text-red-700">{selectedDispute.resolution}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resolution Form (Instructor Only) */}
                {userRole === 'instructor' &&
                  (selectedDispute.status === 'open' || selectedDispute.status === 'under_review') && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        Resolve Dispute
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resolution Action *
                          </label>
                          <select
                            value={resolutionAction}
                            onChange={(e) => setResolutionAction(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="no_change">No Change - Original review stands</option>
                            <option value="score_adjusted">Score Adjusted</option>
                            <option value="review_removed">Review Removed</option>
                            <option value="re_review_assigned">Re-review Assigned</option>
                          </select>
                        </div>

                        {resolutionAction === 'score_adjusted' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              New Score *
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={newScore || ''}
                              onChange={(e) => setNewScore(parseFloat(e.target.value))}
                              placeholder="Enter new score (0-100)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resolution Notes *
                          </label>
                          <textarea
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            placeholder="Explain your decision and reasoning..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            rows={4}
                          />
                        </div>

                        <button
                          onClick={resolveDispute}
                          disabled={!resolution || loading || (resolutionAction === 'score_adjusted' && !newScore)}
                          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 transition"
                        >
                          {loading ? 'Resolving...' : 'Resolve Dispute'}
                        </button>
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a dispute</h3>
                <p className="text-gray-500">Choose a dispute from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
