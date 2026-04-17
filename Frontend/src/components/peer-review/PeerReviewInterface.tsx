import React, { useState, useEffect } from 'react';
import {
  peerReviewApi,
  CodeReview,
  RubricCriterion,
  ReviewComment,
} from '../../api/peer-review.api';

interface Props {
  reviewId: string;
  submissionCode: string;
  submissionLanguage: string;
  onReviewSubmitted?: () => void;
}

export const PeerReviewInterface: React.FC<Props> = ({
  reviewId,
  submissionCode,
  submissionLanguage,
  onReviewSubmitted,
}) => {
  const [review, setReview] = useState<CodeReview | null>(null);
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);
  const [scores, setScores] = useState<Record<string, { score: number; feedback: string }>>({});
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [startTime] = useState(Date.now());

  // For adding line comments
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'suggestion' | 'question' | 'praise' | 'issue'>('suggestion');

  const codeLines = submissionCode.split('\n');

  useEffect(() => {
    loadReviewData();
  }, [reviewId]);

  const loadReviewData = async () => {
    try {
      const reviewData = await peerReviewApi.getReview(reviewId);
      setReview(reviewData);

      const rubricCriteria = await peerReviewApi.getRubricCriteria(reviewData.rubricId);
      setCriteria(rubricCriteria);

      const existingComments = await peerReviewApi.getReviewComments(reviewId);
      setComments(existingComments);

      // Start the review
      if (reviewData.status === 'pending') {
        await peerReviewApi.startReview(reviewId);
        setReview({ ...reviewData, status: 'in_progress' });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load review data');
    }
  };

  const handleScoreChange = (criterionId: string, score: number, feedback: string) => {
    setScores(prev => ({
      ...prev,
      [criterionId]: { score, feedback },
    }));
  };

  const addLineComment = async () => {
    if (!newComment.trim() || selectedLine === null) return;

    try {
      const comment = await peerReviewApi.addComment(reviewId, {
        lineNumber: selectedLine + 1, // Convert to 1-indexed
        codeSnippet: codeLines[selectedLine],
        comment: newComment,
        commentType,
      });

      setComments(prev => [...prev, comment]);
      setNewComment('');
      setSelectedLine(null);
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    }
  };

  const submitReview = async () => {
    // Validate all required criteria are scored
    const missingScores = criteria
      .filter(c => c.isRequired && !scores[c.id])
      .map(c => c.name);

    if (missingScores.length > 0) {
      setError(`Please score all required criteria: ${missingScores.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Submit criterion scores
      for (const [criterionId, { score, feedback }] of Object.entries(scores)) {
        await peerReviewApi.submitCriterionScore(reviewId, {
          criterionId,
          score,
          feedback,
        });
      }

      // Submit overall review
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      await peerReviewApi.submitReview(reviewId, {
        overallFeedback,
        timeSpentSeconds: timeSpent,
      });

      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!review) {
    return <div className="text-center py-8">Loading review...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Code Review</h2>
        <p className="text-gray-600">
          Review the code carefully and provide constructive feedback using the rubric below.
        </p>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Code View */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Submitted Code</h3>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            {codeLines.map((line, idx) => (
              <div
                key={idx}
                className={`flex hover:bg-gray-800 ${selectedLine === idx ? 'bg-blue-900' : ''}`}
                onClick={() => setSelectedLine(idx)}
              >
                <span className="text-gray-500 select-none w-12 text-right pr-4">{idx + 1}</span>
                <span className="flex-1">{line || ' '}</span>
                {comments.filter(c => c.lineNumber === idx + 1).length > 0 && (
                  <span className="text-yellow-400 ml-2">💬</span>
                )}
              </div>
            ))}
          </div>

          {/* Add Comment */}
          {selectedLine !== null && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold mb-2">Add Comment to Line {selectedLine + 1}</h4>
              <select
                value={commentType}
                onChange={(e) => setCommentType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
              >
                <option value="suggestion">💡 Suggestion</option>
                <option value="question">❓ Question</option>
                <option value="praise">👍 Praise</option>
                <option value="issue">⚠️ Issue</option>
              </select>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write your comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => setSelectedLine(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={addLineComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Comment
                </button>
              </div>
            </div>
          )}

          {/* Existing Comments */}
          {comments.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold">Your Comments ({comments.length})</h4>
              {comments.map(comment => (
                <div key={comment.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-gray-600">Line {comment.lineNumber}</span>
                    <span className="text-xs px-2 py-1 bg-white rounded">
                      {comment.commentType}
                    </span>
                  </div>
                  <p className="mt-1 text-gray-700">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Rubric & Scores */}
        <div className="space-y-6">
          {/* Criteria Scoring */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Evaluation Criteria</h3>
            <div className="space-y-6">
              {criteria.map(criterion => (
                <div key={criterion.id} className="pb-6 border-b border-gray-200 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{criterion.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{criterion.description}</p>
                      {criterion.examples && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          Examples: {criterion.examples}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">Weight: {criterion.weight}x</span>
                  </div>

                  {/* Score Selector */}
                  <div className="mt-3">
                    <div className="flex space-x-2 mb-2">
                      {Array.from({ length: criterion.maxScore }, (_, i) => i + 1).map(score => (
                        <button
                          key={score}
                          onClick={() => handleScoreChange(criterion.id, score, scores[criterion.id]?.feedback || '')}
                          className={`flex-1 py-2 px-3 rounded-lg font-semibold transition ${
                            scores[criterion.id]?.score === score
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {score}
                          {criterion.scoreLabels?.[score] && (
                            <span className="block text-xs font-normal mt-1">
                              {criterion.scoreLabels[score]}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={scores[criterion.id]?.feedback || ''}
                      onChange={(e) => handleScoreChange(criterion.id, scores[criterion.id]?.score || 0, e.target.value)}
                      placeholder="Explain your score..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Feedback */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Overall Feedback</h3>
            <textarea
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              placeholder="Provide overall feedback on the submission..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={6}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={submitReview}
            disabled={isSubmitting}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 transition"
          >
            {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};
