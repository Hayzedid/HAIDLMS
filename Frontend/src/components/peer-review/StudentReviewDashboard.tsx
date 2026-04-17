import React, { useState, useEffect } from 'react';
import { peerReviewApi, CodeReview, ReviewerStats } from '../../api/peer-review.api';
import { Clock, CheckCircle, AlertCircle, FileText, Star, TrendingUp, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  userId: string;
}

export const StudentReviewDashboard: React.FC<Props> = ({ userId }) => {
  const navigate = useNavigate();
  const [assignedReviews, setAssignedReviews] = useState<CodeReview[]>([]);
  const [submissionsAwaiting, setSubmissionsAwaiting] = useState<any[]>([]);
  const [stats, setStats] = useState<ReviewerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'my-submissions'>('pending');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [pending, completed, awaiting, reviewerStats] = await Promise.all([
        peerReviewApi.getReviewerAssignments(userId, 'pending,in_progress'),
        peerReviewApi.getReviewerAssignments(userId, 'submitted'),
        peerReviewApi.getSubmissionsAwaitingReviews(userId),
        peerReviewApi.getReviewerStats(userId),
      ]);

      setAssignedReviews([...pending, ...completed]);
      setSubmissionsAwaiting(awaiting);
      setStats(reviewerStats);
    } catch (err: any) {
      setError(err.message || 'Failed to load review data');
    } finally {
      setLoading(false);
    }
  };

  const pendingReviews = assignedReviews.filter(
    r => r.status === 'pending' || r.status === 'in_progress'
  );
  const completedReviews = assignedReviews.filter(r => r.status === 'submitted');

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
      submitted: { bg: 'bg-green-100', text: 'text-green-700', label: 'Submitted' },
      disputed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Disputed' },
      resolved: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Resolved' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`px-2 py-1 ${badge.bg} ${badge.text} text-xs rounded-full font-medium`}>
        {badge.label}
      </span>
    );
  };

  const startReview = (reviewId: string) => {
    navigate(`/peer-review/${reviewId}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Peer Review Dashboard</h1>
        <p className="text-indigo-100">Review your peers' code and improve together</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Reviews Completed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalReviewsCompleted}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.completionRate.toFixed(0)}% completion rate
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">On-Time Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.onTimeRate.toFixed(0)}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.onTimeReviews} on-time / {stats.lateReviews} late
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Helpfulness</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.avgHelpfulnessRating.toFixed(1)}
                  <span className="text-lg text-gray-500">/5.0</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Avg {stats.avgCommentCount.toFixed(1)} comments per review
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Quality Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.instructorQualityRating?.toFixed(1) || 'N/A'}
                  {stats.instructorQualityRating && <span className="text-lg text-gray-500">/5.0</span>}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Instructor rating</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 font-medium border-b-2 transition ${
                activeTab === 'pending'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Reviews
              {pendingReviews.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                  {pendingReviews.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-3 font-medium border-b-2 transition ${
                activeTab === 'completed'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Completed Reviews ({completedReviews.length})
            </button>
            <button
              onClick={() => setActiveTab('my-submissions')}
              className={`px-6 py-3 font-medium border-b-2 transition ${
                activeTab === 'my-submissions'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Submissions
              {submissionsAwaiting.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                  {submissionsAwaiting.length} awaiting
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Pending Reviews Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingReviews.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">All caught up!</h3>
                  <p className="text-gray-500">You have no pending reviews at the moment.</p>
                </div>
              ) : (
                pendingReviews.map(review => (
                  <div
                    key={review.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <h4 className="font-semibold text-gray-800">
                            Code Submission #{review.submissionId.slice(-6)}
                          </h4>
                          {getStatusBadge(review.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          Review the submitted code and provide constructive feedback
                        </p>
                        {review.startedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Started: {new Date(review.startedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => startReview(review.id)}
                        className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                      >
                        {review.status === 'in_progress' ? 'Continue' : 'Start Review'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Completed Reviews Tab */}
          {activeTab === 'completed' && (
            <div className="space-y-4">
              {completedReviews.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No completed reviews</h3>
                  <p className="text-gray-500">Your completed reviews will appear here.</p>
                </div>
              ) : (
                completedReviews.map(review => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <h4 className="font-semibold text-gray-800">
                            Code Submission #{review.submissionId.slice(-6)}
                          </h4>
                          {getStatusBadge(review.status)}
                        </div>
                        {review.overallScore && (
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <span>Score: {review.overallScore.toFixed(1)}/100</span>
                            {review.timeSpentSeconds && (
                              <span>Time: {Math.floor(review.timeSpentSeconds / 60)} min</span>
                            )}
                            {review.submittedAt && (
                              <span>Submitted: {new Date(review.submittedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        )}
                        {review.isHelpful !== undefined && (
                          <div className="mt-2">
                            {review.isHelpful ? (
                              <span className="text-sm text-green-600">👍 Marked as helpful</span>
                            ) : (
                              <span className="text-sm text-gray-500">Feedback received</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* My Submissions Tab */}
          {activeTab === 'my-submissions' && (
            <div className="space-y-4">
              {submissionsAwaiting.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No submissions</h3>
                  <p className="text-gray-500">Your submissions awaiting reviews will appear here.</p>
                </div>
              ) : (
                submissionsAwaiting.map(submission => (
                  <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-2">
                          {submission.assessmentName || `Submission #${submission.id.slice(-6)}`}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            Reviews: {submission.reviewsReceived || 0} / {submission.reviewsRequired || 2}
                          </span>
                          <span>
                            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {submission.reviewsReceived < submission.reviewsRequired ? (
                          <div className="mt-2 flex items-center gap-2 text-sm text-yellow-700">
                            <Clock className="w-4 h-4" />
                            <span>Awaiting peer reviews</span>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                            <CheckCircle className="w-4 h-4" />
                            <span>All reviews received</span>
                          </div>
                        )}
                      </div>
                      {submission.reviewsReceived > 0 && (
                        <button
                          onClick={() => navigate(`/submission/${submission.id}/reviews`)}
                          className="ml-4 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                        >
                          View Reviews
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
