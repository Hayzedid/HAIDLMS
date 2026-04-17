import { useState, useEffect } from 'react';
import {
  getInstructorPendingReviews,
  getAssessmentVivaRequests,
  getAssessmentStatistics,
  reviewVideoExplanation,
  waiveVivaRequest,
  VivaRequest,
  VivaStatistics,
} from '../../api/viva.api';

interface Props {
  instructorId: string;
  assessmentId?: string;
}

export default function InstructorVivaDashboard({ instructorId, assessmentId }: Props) {
  const [pendingReviews, setPendingReviews] = useState<VivaRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VivaRequest | null>(null);
  const [statistics, setStatistics] = useState<VivaStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review form state
  const [explanationScore, setExplanationScore] = useState<number>(0);
  const [comprehensionLevel, setComprehensionLevel] = useState<'poor' | 'fair' | 'good' | 'excellent'>('fair');
  const [reviewNotes, setReviewNotes] = useState('');
  const [authenticityVerified, setAuthenticityVerified] = useState(false);
  const [requiresResubmit, setRequiresResubmit] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('submitted');

  useEffect(() => {
    loadData();
  }, [instructorId, assessmentId, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (assessmentId) {
        // Load assessment-specific data
        const [requests, stats] = await Promise.all([
          getAssessmentVivaRequests(assessmentId, statusFilter),
          getAssessmentStatistics(assessmentId),
        ]);

        setPendingReviews(requests);
        setStatistics(stats);
      } else {
        // Load instructor's pending reviews
        const requests = await getInstructorPendingReviews(50);
        setPendingReviews(requests.filter((r) => r.status === 'submitted'));
      }
    } catch (err: any) {
      console.error('[InstructorVivaDashboard] Error loading data:', err);
      setError(err.message || 'Failed to load viva requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRequest = (request: VivaRequest) => {
    setSelectedRequest(request);
    setExplanationScore(request.explanationScore || 0);
    setComprehensionLevel(request.comprehensionLevel || 'fair');
    setReviewNotes(request.reviewNotes || '');
    setAuthenticityVerified(request.authenticityVerified || false);
    setRequiresResubmit(request.requiresResubmit || false);
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest) return;

    if (explanationScore < 0 || explanationScore > 100) {
      alert('Score must be between 0 and 100');
      return;
    }

    if (!reviewNotes.trim()) {
      alert('Please provide review notes');
      return;
    }

    setIsSubmitting(true);

    try {
      await reviewVideoExplanation(selectedRequest.id, {
        explanationScore,
        comprehensionLevel,
        reviewNotes,
        authenticityVerified,
        requiresResubmit,
      });

      alert('✅ Review submitted successfully!');

      // Reload data
      loadData();
      setSelectedRequest(null);
      resetForm();
    } catch (err: any) {
      console.error('[InstructorVivaDashboard] Error submitting review:', err);
      alert('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWaive = async () => {
    if (!selectedRequest) return;

    const reason = prompt('Enter reason for waiving this requirement:');
    if (!reason) return;

    setIsSubmitting(true);

    try {
      await waiveVivaRequest(selectedRequest.id, reason);

      alert('✅ Requirement waived successfully!');

      // Reload data
      loadData();
      setSelectedRequest(null);
      resetForm();
    } catch (err: any) {
      console.error('[InstructorVivaDashboard] Error waiving request:', err);
      alert('Failed to waive requirement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setExplanationScore(0);
    setComprehensionLevel('fair');
    setReviewNotes('');
    setAuthenticityVerified(false);
    setRequiresResubmit(false);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  };

  const getComprehensionColor = (level: string): string => {
    switch (level) {
      case 'excellent': return '#22c55e';
      case 'good': return '#84cc16';
      case 'fair': return '#eab308';
      case 'poor': return '#ef4444';
      default: return '#64748b';
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🎥</div>
        <div style={{ fontSize: '18px', color: '#64748b' }}>Loading viva requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '2rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
        }}
      >
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>🎥 Code Explanation Reviews</h1>
        <p style={{ color: '#64748b' }}>
          Review student video explanations and verify code authorship
        </p>
        <button
          onClick={loadData}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ marginBottom: '1.5rem' }}>📊 Assessment Statistics</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>
                Total Requests
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>
                {statistics.totalRequests}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>
                Submitted
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                {statistics.totalSubmitted}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>
                Graded
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#22c55e' }}>
                {statistics.totalGraded}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>
                Expired
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
                {statistics.totalExpired}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>
                Avg Submission Time
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>
                {Math.round(statistics.avgSubmissionHours)}h
              </div>
            </div>

            <div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>
                Avg Score
              </div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: getScoreColor(statistics.avgExplanationScore),
                }}
              >
                {Math.round(statistics.avgExplanationScore)}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '0.5rem' }}>
                Authenticity Verified
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#22c55e' }}>
                {statistics.authenticityVerifiedCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      {assessmentId && (
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ marginRight: '1rem', fontWeight: '500' }}>Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="graded">Graded</option>
            <option value="expired">Expired</option>
            <option value="waived">Waived</option>
          </select>
        </div>
      )}

      {pendingReviews.length === 0 ? (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '4rem',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ marginBottom: '0.5rem' }}>No Pending Reviews</h2>
          <p style={{ color: '#64748b' }}>
            All video explanations have been reviewed.
          </p>
        </div>
      ) : selectedRequest ? (
        /* Review Interface */
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => setSelectedRequest(null)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              ← Back to List
            </button>
          </div>

          <h2 style={{ marginBottom: '1rem' }}>Review Video Explanation</h2>

          {/* Request Info */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '2rem',
            }}
          >
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Student ID:</strong> {selectedRequest.userId}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Submission ID:</strong> {selectedRequest.submissionId}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Selection Type:</strong> {selectedRequest.selectionType}
            </div>
            {selectedRequest.reason && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Reason:</strong> {selectedRequest.reason}
              </div>
            )}
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Submitted:</strong> {selectedRequest.submittedAt ? new Date(selectedRequest.submittedAt).toLocaleString() : 'N/A'}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Duration:</strong> {selectedRequest.videoDurationSeconds ? Math.floor(selectedRequest.videoDurationSeconds / 60) : 0} minutes
            </div>
            {selectedRequest.isLate && (
              <div style={{ color: '#ef4444', fontWeight: 'bold' }}>
                ⚠️ LATE SUBMISSION
              </div>
            )}
          </div>

          {/* Student Notes */}
          {selectedRequest.studentNotes && (
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                marginBottom: '2rem',
              }}
            >
              <h4 style={{ marginTop: 0 }}>Student Notes:</h4>
              <p style={{ margin: 0 }}>{selectedRequest.studentNotes}</p>
            </div>
          )}

          {/* Video Player */}
          <div style={{ marginBottom: '2rem' }}>
            <h4>Video Explanation</h4>
            {selectedRequest.videoUrl ? (
              <video
                src={selectedRequest.videoUrl}
                controls
                style={{
                  width: '100%',
                  maxWidth: '800px',
                  borderRadius: '8px',
                  backgroundColor: '#000',
                }}
              />
            ) : (
              <div
                style={{
                  padding: '3rem',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                No video URL available
              </div>
            )}
          </div>

          {/* Transcript */}
          {selectedRequest.videoTranscript && (
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: '#fefce8',
                border: '1px solid #fef08a',
                borderRadius: '8px',
                marginBottom: '2rem',
              }}
            >
              <h4 style={{ marginTop: 0 }}>Auto-Generated Transcript:</h4>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                {selectedRequest.videoTranscript}
              </p>
            </div>
          )}

          {/* Review Form */}
          <div
            style={{
              padding: '2rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '2rem',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Submit Review</h3>

            {/* Explanation Score */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Explanation Score (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={explanationScore}
                onChange={(e) => setExplanationScore(parseInt(e.target.value) || 0)}
                style={{
                  width: '150px',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                }}
              />
              <div
                style={{
                  marginTop: '0.5rem',
                  fontSize: '14px',
                  color: getScoreColor(explanationScore),
                  fontWeight: 'bold',
                }}
              >
                {explanationScore >= 80 && '✅ Excellent'}
                {explanationScore >= 60 && explanationScore < 80 && '⚠️ Good'}
                {explanationScore < 60 && '❌ Needs Improvement'}
              </div>
            </div>

            {/* Comprehension Level */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Comprehension Level
              </label>
              <select
                value={comprehensionLevel}
                onChange={(e) => setComprehensionLevel(e.target.value as any)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '16px',
                  width: '200px',
                }}
              >
                <option value="poor">Poor</option>
                <option value="fair">Fair</option>
                <option value="good">Good</option>
                <option value="excellent">Excellent</option>
              </select>
            </div>

            {/* Review Notes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Review Notes *
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                placeholder="Provide detailed feedback on the student's explanation..."
              />
            </div>

            {/* Authenticity Verified */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={authenticityVerified}
                  onChange={(e) => setAuthenticityVerified(e.target.checked)}
                  style={{ marginRight: '0.75rem', width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 'bold' }}>
                  Authenticity Verified - Student demonstrated genuine understanding
                </span>
              </label>
            </div>

            {/* Requires Resubmit */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={requiresResubmit}
                  onChange={(e) => setRequiresResubmit(e.target.checked)}
                  style={{ marginRight: '0.75rem', width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 'bold', color: '#ef4444' }}>
                  Requires Resubmission - Explanation was insufficient
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleSubmitReview}
              disabled={isSubmitting || !reviewNotes.trim()}
              style={{
                padding: '1rem 2rem',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: isSubmitting || !reviewNotes.trim() ? '#94a3b8' : '#2da44e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isSubmitting || !reviewNotes.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Submitting...' : '✅ Submit Review'}
            </button>

            <button
              onClick={handleWaive}
              disabled={isSubmitting}
              style={{
                padding: '1rem 2rem',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: isSubmitting ? '#94a3b8' : '#eab308',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              Waive Requirement
            </button>
          </div>
        </div>
      ) : (
        /* Requests List */
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#1e293b',
              color: 'white',
            }}
          >
            <h3 style={{ margin: 0 }}>
              📋 Submissions Needing Review ({pendingReviews.length})
            </h3>
          </div>

          <div>
            {pendingReviews.map((request) => (
              <div
                key={request.id}
                style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '16px' }}>
                      {request.userId}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>
                      Submitted: {request.submittedAt ? new Date(request.submittedAt).toLocaleString() : 'N/A'}
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '0.5rem' }}>
                      Duration: {request.videoDurationSeconds ? Math.floor(request.videoDurationSeconds / 60) : 0} minutes
                    </div>
                    {request.selectionType === 'flagged' && (
                      <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: 'bold' }}>
                        🚩 Flagged for Plagiarism
                      </div>
                    )}
                    {request.isLate && (
                      <div style={{ fontSize: '13px', color: '#f59e0b', fontStyle: 'italic' }}>
                        ⚠️ Late Submission
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleSelectRequest(request)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🎥 Review Video
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
