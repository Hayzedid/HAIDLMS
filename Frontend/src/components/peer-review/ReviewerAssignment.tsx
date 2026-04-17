import React, { useState, useEffect } from 'react';
import { peerReviewApi, ReviewRubric } from '../../api/peer-review.api';
import { Users, Shuffle, TrendingUp, Award, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  rubricId: string;
  submissionIds: string[];
  onAssignmentComplete?: () => void;
}

export const ReviewerAssignment: React.FC<Props> = ({
  rubricId,
  submissionIds,
  onAssignmentComplete,
}) => {
  const [rubric, setRubric] = useState<ReviewRubric | null>(null);
  const [algorithm, setAlgorithm] = useState<'round-robin' | 'random' | 'quality-based'>('random');
  const [reviewsPerSubmission, setReviewsPerSubmission] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [highQualityReviewers, setHighQualityReviewers] = useState<any[]>([]);

  useEffect(() => {
    loadRubric();
    loadHighQualityReviewers();
  }, [rubricId]);

  const loadRubric = async () => {
    try {
      const data = await peerReviewApi.getRubric(rubricId);
      setRubric(data);
      setReviewsPerSubmission(data.minReviewsRequired);
    } catch (err: any) {
      setError(err.message || 'Failed to load rubric');
    }
  };

  const loadHighQualityReviewers = async () => {
    try {
      const data = await peerReviewApi.getHighQualityReviewers(10);
      setHighQualityReviewers(data);
    } catch (err: any) {
      // Non-critical error, just log it
      console.error('Failed to load high-quality reviewers:', err);
    }
  };

  const assignReviewers = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await peerReviewApi.assignReviewers(rubricId, {
        submissionIds,
        reviewsPerSubmission,
        algorithm,
      });

      setSuccess(
        `Successfully assigned ${reviewsPerSubmission} reviewers to ${submissionIds.length} submissions using ${algorithm} algorithm!`
      );

      if (onAssignmentComplete) {
        setTimeout(() => {
          onAssignmentComplete();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign reviewers');
    } finally {
      setLoading(false);
    }
  };

  const algorithmDescriptions = {
    'round-robin':
      'Each student reviews the next submission in sequence. Ensures even distribution and prevents students from reviewing the same peers repeatedly.',
    random:
      'Randomly assigns reviewers to submissions. Good for preventing bias and ensuring variety in review perspectives.',
    'quality-based':
      'Prioritizes high-quality reviewers (based on past performance) for each submission. Ensures better feedback quality but may overload top reviewers.',
  };

  const totalReviewsNeeded = submissionIds.length * reviewsPerSubmission;

  if (!rubric) {
    return <div className="text-center py-8">Loading rubric...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Assign Peer Reviewers</h2>
        <p className="text-gray-600">
          Configure and assign reviewers for <strong>{submissionIds.length}</strong> submissions using{' '}
          <strong>{rubric.name}</strong>
        </p>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Assignment Configuration</h3>

        <div className="space-y-6">
          {/* Reviews Per Submission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reviews Per Submission
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="5"
                value={reviewsPerSubmission}
                onChange={(e) => setReviewsPerSubmission(parseInt(e.target.value))}
                className="flex-1"
              />
              <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-lg">
                <span className="text-2xl font-bold text-indigo-700">{reviewsPerSubmission}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Each submission will be reviewed by {reviewsPerSubmission} different{' '}
              {reviewsPerSubmission === 1 ? 'peer' : 'peers'}. Minimum required by rubric:{' '}
              {rubric.minReviewsRequired}
            </p>
            {reviewsPerSubmission < rubric.minReviewsRequired && (
              <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Warning: Below minimum required reviews
              </p>
            )}
          </div>

          {/* Assignment Algorithm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Assignment Algorithm
            </label>
            <div className="space-y-3">
              {(
                [
                  { value: 'round-robin', icon: Users, label: 'Round Robin', color: 'blue' },
                  { value: 'random', icon: Shuffle, label: 'Random', color: 'purple' },
                  { value: 'quality-based', icon: Award, label: 'Quality-Based', color: 'green' },
                ] as const
              ).map(({ value, icon: Icon, label, color }) => (
                <button
                  key={value}
                  onClick={() => setAlgorithm(value)}
                  className={`w-full flex items-start gap-4 p-4 border-2 rounded-lg transition ${
                    algorithm === value
                      ? `border-${color}-600 bg-${color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-6 h-6 text-${color}-600`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-800 mb-1">{label}</h4>
                    <p className="text-sm text-gray-600">{algorithmDescriptions[value]}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {algorithm === value && (
                      <div className={`w-6 h-6 bg-${color}-600 rounded-full flex items-center justify-center`}>
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* High-Quality Reviewers (for quality-based algorithm) */}
          {algorithm === 'quality-based' && highQualityReviewers.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Reviewers Available
              </h4>
              <p className="text-sm text-green-700 mb-3">
                These students will be prioritized in the quality-based assignment:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {highQualityReviewers.slice(0, 6).map((reviewer, idx) => (
                  <div key={reviewer.user_id} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700">{reviewer.user_name || `Reviewer ${reviewer.user_id.slice(-6)}`}</span>
                    <span className="text-green-600 ml-auto">
                      {reviewer.avg_helpfulness_rating?.toFixed(1) || 'N/A'}★
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{submissionIds.length}</p>
              <p className="text-sm text-gray-600">Submissions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{totalReviewsNeeded}</p>
              <p className="text-sm text-gray-600">Total Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {Math.ceil(totalReviewsNeeded / submissionIds.length)}
              </p>
              <p className="text-sm text-gray-600">Reviews/Student</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rubric Settings Preview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Rubric Settings</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Anonymous Reviewers:</span>
            <span className="font-semibold text-gray-900">
              {rubric.anonymizeReviewers ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Anonymous Authors:</span>
            <span className="font-semibold text-gray-900">
              {rubric.anonymizeCodeAuthors ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">MOSS Collusion Check:</span>
            <span className="font-semibold text-gray-900">{rubric.runMossCheck ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Similarity Threshold:</span>
            <span className="font-semibold text-gray-900">{rubric.mossSimilarityThreshold}%</span>
          </div>
        </div>
      </div>

      {/* Assign Button */}
      <button
        onClick={assignReviewers}
        disabled={loading || reviewsPerSubmission < rubric.minReviewsRequired}
        className="w-full py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Assigning Reviewers...</span>
          </>
        ) : (
          <>
            <Users className="w-6 h-6" />
            <span>Assign Reviewers ({algorithm})</span>
          </>
        )}
      </button>

      {reviewsPerSubmission < rubric.minReviewsRequired && (
        <p className="text-center text-sm text-amber-600">
          Please set reviews per submission to at least {rubric.minReviewsRequired} (rubric minimum)
        </p>
      )}
    </div>
  );
};
