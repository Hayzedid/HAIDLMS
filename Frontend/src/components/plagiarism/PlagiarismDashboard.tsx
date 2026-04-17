import { useState, useEffect } from 'react';
import {
  getFlaggedSubmissions,
  getMatches,
  updateReview,
  triggerMossCheck,
  getMossReportUrl,
  getAssessmentStats,
  CodeSubmission,
  PlagiarismMatch,
  PlagiarismStats,
} from '../../api/plagiarism.api';
import CodeComparison from './CodeComparison';

interface Props {
  assessmentId?: string;
  instructorId: string;
  showStats?: boolean;
}

export default function PlagiarismDashboard({
  assessmentId,
  instructorId,
  showStats = true,
}: Props) {
  const [submissions, setSubmissions] = useState<CodeSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<CodeSubmission | null>(null);
  const [matches, setMatches] = useState<PlagiarismMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<PlagiarismMatch | null>(null);
  const [stats, setStats] = useState<PlagiarismStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<CodeSubmission['plagiarismStatus']>('clean');
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [mossChecking, setMossChecking] = useState(false);

  useEffect(() => {
    loadData();
  }, [assessmentId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load flagged submissions
      const flaggedSubs = await getFlaggedSubmissions(100);
      setSubmissions(flaggedSubs);

      // Load assessment stats if assessmentId provided
      if (assessmentId && showStats) {
        const assessmentStats = await getAssessmentStats(assessmentId);
        setStats(assessmentStats);
      }
    } catch (err: any) {
      console.error('[PlagiarismDashboard] Error loading data:', err);
      setError(err.message || 'Failed to load plagiarism data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSubmission = async (submission: CodeSubmission) => {
    setSelectedSubmission(submission);
    setSelectedMatch(null);
    setReviewNotes(submission.reviewNotes || '');
    setReviewStatus(submission.plagiarismStatus);

    // Load matches for this submission
    try {
      const submissionMatches = await getMatches(submission.id);
      setMatches(submissionMatches);

      // Auto-select first match if available
      if (submissionMatches.length > 0) {
        setSelectedMatch(submissionMatches[0]);
      }
    } catch (err) {
      console.error('[PlagiarismDashboard] Error loading matches:', err);
    }
  };

  const handleSaveReview = async () => {
    if (!selectedSubmission) return;

    setIsSavingReview(true);

    try {
      await updateReview(selectedSubmission.id, {
        reviewedBy: instructorId,
        reviewNotes,
        plagiarismStatus: reviewStatus,
      });

      // Update local state
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === selectedSubmission.id
            ? {
                ...sub,
                reviewedBy: instructorId,
                reviewNotes,
                plagiarismStatus: reviewStatus,
                reviewedAt: new Date().toISOString(),
              }
            : sub
        )
      );

      alert('Review saved successfully');
    } catch (err) {
      console.error('[PlagiarismDashboard] Error saving review:', err);
      alert('Failed to save review');
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleTriggerMoss = async () => {
    if (!assessmentId) {
      alert('Assessment ID is required to trigger MOSS check');
      return;
    }

    const problemId = prompt('Enter Problem ID:');
    if (!problemId) return;

    setMossChecking(true);

    try {
      await triggerMossCheck(assessmentId, problemId);
      alert('MOSS check initiated. This may take several minutes. Refresh to see results.');
    } catch (err) {
      console.error('[PlagiarismDashboard] Error triggering MOSS:', err);
      alert('Failed to trigger MOSS check');
    } finally {
      setMossChecking(false);
    }
  };

  const handleViewMossReport = async () => {
    if (!selectedSubmission) return;

    try {
      const reportUrl = await getMossReportUrl(selectedSubmission.id);
      window.open(reportUrl, '_blank');
    } catch (err) {
      alert('MOSS report not available for this submission');
    }
  };

  const getSeverityBadge = (status: CodeSubmission['plagiarismStatus']) => {
    const colors: Record<CodeSubmission['plagiarismStatus'], string> = {
      pending: '#94a3b8',
      clean: '#10b981',
      suspicious: '#fbbf24',
      plagiarized: '#dc2626',
      under_review: '#3b82f6',
    };

    return (
      <span
        style={{
          padding: '0.25rem 0.75rem',
          backgroundColor: colors[status] + '20',
          color: colors[status],
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
        }}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🔍</div>
        <div style={{ fontSize: '18px', color: '#64748b' }}>Loading plagiarism data...</div>
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
        <h1 style={{ marginBottom: '0.5rem' }}>Plagiarism Detection Dashboard</h1>
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>
          Review flagged submissions and manage plagiarism cases
        </p>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={loadData}
            style={{
              padding: '0.75rem 1.5rem',
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

          {assessmentId && (
            <button
              onClick={handleTriggerMoss}
              disabled={mossChecking}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: mossChecking ? '#94a3b8' : '#2da44e',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: mossChecking ? 'not-allowed' : 'pointer',
                fontWeight: '500',
              }}
            >
              {mossChecking ? '⏳ Running MOSS...' : '🔬 Run MOSS Check'}
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      {showStats && stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>
              {stats.total_submissions}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '0.5rem' }}>
              Total Submissions
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626' }}>
              {stats.confirmed_plagiarism}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '0.5rem' }}>
              Confirmed Plagiarism
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fbbf24' }}>
              {stats.suspicious_submissions}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '0.5rem' }}>
              Suspicious
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
              {stats.plagiarism_rate}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '0.5rem' }}>
              Plagiarism Rate
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Submissions List */}
        <div>
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
                padding: '1rem 1.5rem',
                backgroundColor: '#1e293b',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              Flagged Submissions ({submissions.length})
            </div>

            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {submissions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  No flagged submissions found
                </div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => handleSelectSubmission(sub)}
                    style={{
                      padding: '1rem 1.5rem',
                      borderBottom: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      backgroundColor:
                        selectedSubmission?.id === sub.id ? '#f0f9ff' : 'white',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <strong style={{ fontSize: '14px' }}>{sub.fileName || 'Untitled'}</strong>
                      {getSeverityBadge(sub.plagiarismStatus)}
                    </div>

                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.25rem' }}>
                      User ID: {sub.userId.substring(0, 8)}...
                    </div>

                    {sub.similarityScore !== undefined && (
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 'bold',
                          color:
                            sub.similarityScore >= 0.9
                              ? '#dc2626'
                              : sub.similarityScore >= 0.75
                              ? '#f59e0b'
                              : '#fbbf24',
                        }}
                      >
                        Similarity: {(sub.similarityScore * 100).toFixed(0)}%
                      </div>
                    )}

                    {sub.reviewedBy && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#10b981',
                          marginTop: '0.25rem',
                        }}
                      >
                        ✓ Reviewed
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div>
          {!selectedSubmission ? (
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '3rem',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '1rem' }}>👈</div>
              <div style={{ fontSize: '18px', color: '#64748b' }}>
                Select a submission to view details
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Submission Info */}
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  padding: '1.5rem',
                }}
              >
                <h3 style={{ marginTop: 0 }}>Submission Details</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.25rem' }}>
                      Status
                    </div>
                    {getSeverityBadge(selectedSubmission.plagiarismStatus)}
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.25rem' }}>
                      Similarity Score
                    </div>
                    <div style={{ fontWeight: 'bold' }}>
                      {selectedSubmission.similarityScore
                        ? (selectedSubmission.similarityScore * 100).toFixed(1) + '%'
                        : 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.25rem' }}>
                      Language
                    </div>
                    <div>{selectedSubmission.language}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.25rem' }}>
                      Submitted At
                    </div>
                    <div>{new Date(selectedSubmission.submittedAt).toLocaleString()}</div>
                  </div>
                </div>

                {selectedSubmission.mossReportUrl && (
                  <button
                    onClick={handleViewMossReport}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    View MOSS Report
                  </button>
                )}
              </div>

              {/* Matches */}
              {matches.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    padding: '1.5rem',
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>Similar Submissions ({matches.length})</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {matches.map((match) => (
                      <div
                        key={match.id}
                        onClick={() => setSelectedMatch(match)}
                        style={{
                          padding: '1rem',
                          backgroundColor:
                            selectedMatch?.id === match.id ? '#f0f9ff' : '#f8fafc',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border:
                            selectedMatch?.id === match.id
                              ? '2px solid #3b82f6'
                              : '1px solid #e2e8f0',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                              User {match.user2_id.substring(0, 8)}...
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                              {match.matching_lines} of {match.total_lines} lines matched
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: '24px',
                              fontWeight: 'bold',
                              color:
                                match.similarity_score >= 0.9
                                  ? '#dc2626'
                                  : match.similarity_score >= 0.75
                                  ? '#f59e0b'
                                  : '#fbbf24',
                            }}
                          >
                            {(match.similarity_score * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Comparison */}
              {selectedMatch && (
                <CodeComparison
                  code1={selectedMatch.code1}
                  code2={selectedMatch.code2}
                  fileName1={`User ${selectedMatch.user1_id.substring(0, 8)}`}
                  fileName2={`User ${selectedMatch.user2_id.substring(0, 8)}`}
                  language={selectedSubmission.language}
                  similarityScore={selectedMatch.similarity_score}
                  matchingLines={selectedMatch.matching_lines}
                  totalLines={selectedMatch.total_lines}
                />
              )}

              {/* Review Panel */}
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  padding: '1.5rem',
                }}
              >
                <h3 style={{ marginTop: 0 }}>Instructor Review</h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Status
                  </label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                    }}
                  >
                    <option value="clean">Clean</option>
                    <option value="suspicious">Suspicious</option>
                    <option value="plagiarized">Plagiarized</option>
                    <option value="under_review">Under Review</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Review Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                    placeholder="Enter your review notes here..."
                  />
                </div>

                <button
                  onClick={handleSaveReview}
                  disabled={isSavingReview}
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: isSavingReview ? '#94a3b8' : '#2da44e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isSavingReview ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    width: '100%',
                  }}
                >
                  {isSavingReview ? 'Saving...' : 'Save Review'}
                </button>

                {selectedSubmission.reviewedBy && (
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '6px',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      Last reviewed by: {selectedSubmission.reviewedBy.substring(0, 8)}...
                    </div>
                    {selectedSubmission.reviewedAt && (
                      <div style={{ color: '#64748b' }}>
                        {new Date(selectedSubmission.reviewedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
