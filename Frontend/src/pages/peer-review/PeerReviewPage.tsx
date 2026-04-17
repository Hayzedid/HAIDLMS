import React, { useState, useEffect } from 'react';
import { peerReviewApi, CodeReview } from '../../api/peer-review.api';
import { PeerReviewInterface } from '../../components/peer-review/PeerReviewInterface.enhanced';
import { useAuth } from '../../hooks/useAuth';
import { AppLayout } from '../../components/layout';
import { Tabs, Button } from '../../components/ui';
import { Clock, CheckCircle } from 'lucide-react';

export const PeerReviewPage: React.FC = () => {
  const { user } = useAuth(); // Get current user
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [submittedReviews, setSubmittedReviews] = useState<CodeReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted'>('pending');

  useEffect(() => {
    if (user) {
      loadReviews();
    }
  }, [user]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const [pending, assignments] = await Promise.all([
        peerReviewApi.getPendingReviews(user?.id),
        peerReviewApi.getReviewerAssignments(user?.id || '', 'submitted'),
      ]);
      setPendingReviews(pending);
      setSubmittedReviews(assignments);
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartReview = (review: any) => {
    setSelectedReview(review);
  };

  const handleReviewSubmitted = () => {
    setSelectedReview(null);
    loadReviews();
  };

  const tabs = [
    {
      id: 'pending',
      label: 'Pending',
      icon: <Clock className="w-4 h-4" />,
      badge: pendingReviews.length,
    },
    {
      id: 'submitted',
      label: 'Submitted',
      icon: <CheckCircle className="w-4 h-4" />,
      badge: submittedReviews.length,
    },
  ];

  if (selectedReview) {
    return (
      <AppLayout>
        <Button
          onClick={() => setSelectedReview(null)}
          variant="ghost"
          className="mb-4"
        >
          ← Back to Reviews
        </Button>
        <PeerReviewInterface
          reviewId={selectedReview.review_id}
          submissionCode="// Sample code - would load from backend\nfunction example() {\n  return 'Hello World';\n}"
          submissionLanguage="javascript"
          onReviewSubmitted={handleReviewSubmitted}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Peer Code Reviews
        </h1>
        <p className="text-gray-600">
          Review your classmates' code and provide constructive feedback
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as 'pending' | 'submitted')}
          variant="underline"
        />
      </div>

      {/* Content */}
      {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : activeTab === 'pending' ? (
          <div className="space-y-4">
            {pendingReviews.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  All Caught Up!
                </h3>
                <p className="text-gray-600">
                  You don't have any pending reviews at the moment.
                </p>
              </div>
            ) : (
              pendingReviews.map((review) => (
                <div
                  key={review.review_id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {review.rubric_name}
                        </h3>
                        {review.is_overdue && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Submission ID: {review.submission_id.slice(0, 8)}...
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          Due: {new Date(review.due_at).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>
                          {review.min_reviews_required} reviews required
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartReview(review)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      Start Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {submittedReviews.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No Submitted Reviews Yet
                </h3>
                <p className="text-gray-600">
                  Your completed reviews will appear here.
                </p>
              </div>
            ) : (
              submittedReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Review Submitted
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          COMPLETED
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Submission ID: {review.submissionId.slice(0, 8)}...
                      </p>
                      {review.overallScore && (
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Overall Score:</strong> {review.overallScore.toFixed(1)} / 5.0
                        </p>
                      )}
                      <div className="text-sm text-gray-500">
                        Submitted: {review.submittedAt ? new Date(review.submittedAt).toLocaleString() : 'N/A'}
                      </div>
                      {review.isFlaggedForCollusion && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          ⚠️ Flagged for potential collusion (similarity: {(review.collusionSimilarityScore! * 100).toFixed(1)}%)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-primary-50 border border-primary-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-2">
          📚 Peer Review Guidelines
        </h3>
        <ul className="text-sm text-primary-800 space-y-1">
          <li>✓ <strong>Be Constructive:</strong> Provide helpful suggestions, not just criticism</li>
          <li>✓ <strong>Be Specific:</strong> Reference specific lines and explain your reasoning</li>
          <li>✓ <strong>Be Respectful:</strong> Remember there's a person behind the code</li>
          <li>✓ <strong>Follow the Rubric:</strong> Use the provided criteria to guide your review</li>
          <li>✓ <strong>Academic Integrity:</strong> Don't copy code you're reviewing</li>
        </ul>
        <div className="mt-4 p-3 bg-white border border-primary-300 rounded">
          <p className="text-sm text-primary-900">
            <strong>Note:</strong> Your reviews may be cross-checked against your own code for academic integrity.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};
