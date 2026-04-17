import { useState, useEffect, useRef } from 'react';
import {
  getStudentPendingRequests,
  getStudentOverdueRequests,
  submitVideoExplanation,
  VivaRequest,
} from '../../api/viva.api';

interface Props {
  userId: string;
  onVideoRecorded?: (videoUrl: string) => void;
}

export default function StudentVivaDashboard({ userId, onVideoRecorded }: Props) {
  const [pendingRequests, setPendingRequests] = useState<VivaRequest[]>([]);
  const [overdueRequests, setOverdueRequests] = useState<VivaRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VivaRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [studentNotes, setStudentNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [pending, overdue] = await Promise.all([
        getStudentPendingRequests(),
        getStudentOverdueRequests(),
      ]);

      setPendingRequests(pending);
      setOverdueRequests(overdue);
    } catch (err: any) {
      console.error('[StudentVivaDashboard] Error loading data:', err);
      setError(err.message || 'Failed to load viva requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (video)
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file');
        return;
      }

      // Validate file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        alert('Video file must be less than 500MB');
        return;
      }

      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedRequest) return;

    if (!videoFile && !videoUrl) {
      alert('Please select or upload a video file');
      return;
    }

    setIsSubmitting(true);

    try {
      // In production: Upload video to S3 first
      // const uploadedUrl = await uploadVideoToS3(videoFile);

      // For now, use mock URL or user-provided URL
      const finalVideoUrl = videoUrl || 'https://example.com/videos/mock-url.mp4';

      // Get video duration (would be extracted from actual video in production)
      const videoDuration = videoFile ? Math.floor(videoFile.size / 100000) : 300; // Mock duration

      await submitVideoExplanation(
        selectedRequest.id,
        finalVideoUrl,
        videoDuration,
        studentNotes
      );

      alert('✅ Video explanation submitted successfully!');

      // Reload data
      loadData();
      setSelectedRequest(null);
      setVideoFile(null);
      setVideoUrl('');
      setStudentNotes('');
    } catch (err: any) {
      console.error('[StudentVivaDashboard] Error submitting video:', err);
      alert('Failed to submit video explanation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeRemaining = (dueAt: Date): string => {
    const now = new Date().getTime();
    const due = new Date(dueAt).getTime();
    const diff = due - now;

    if (diff < 0) return 'OVERDUE';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
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

  const allRequests = [...pendingRequests, ...overdueRequests];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>🎥 Code Explanation Requests</h1>
        <p style={{ color: '#64748b' }}>
          Record video explanations of your code to demonstrate understanding
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

      {allRequests.length === 0 ? (
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
          <h2 style={{ marginBottom: '0.5rem' }}>No Pending Requests</h2>
          <p style={{ color: '#64748b' }}>
            You have no code explanation requests at this time.
          </p>
        </div>
      ) : selectedRequest ? (
        /* Upload/Record Interface */
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
              ← Back to Requests
            </button>
          </div>

          <h2 style={{ marginBottom: '1rem' }}>Record Video Explanation</h2>

          {/* Instructions */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              marginBottom: '2rem',
            }}
          >
            <h4 style={{ marginTop: 0 }}>Instructions:</h4>
            <p>{selectedRequest.instructions || 'Explain your code and demonstrate your understanding.'}</p>
            <div style={{ marginTop: '1rem', fontSize: '14px', color: '#64748b' }}>
              <strong>Tips:</strong>
              <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                <li>Show your screen with your code visible</li>
                <li>Walk through your logic step-by-step</li>
                <li>Explain key decisions and trade-offs</li>
                <li>Be prepared to answer why you chose this approach</li>
              </ul>
            </div>
          </div>

          {/* Video Upload/Record Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h4>Upload Video</h4>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '1rem' }}>
              Record using OBS, Loom, or your preferred screen recording tool, then upload here.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginRight: '1rem',
              }}
            >
              📁 Choose Video File
            </button>

            {videoFile && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Selected File:</div>
                <div>{videoFile.name}</div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  Size: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                </div>

                {/* Video Preview */}
                {videoUrl && (
                  <video
                    src={videoUrl}
                    controls
                    style={{
                      width: '100%',
                      maxWidth: '600px',
                      marginTop: '1rem',
                      borderRadius: '8px',
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Student Notes */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Additional Notes (Optional)
            </label>
            <textarea
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
              placeholder="Any additional context or clarifications..."
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              onClick={handleSubmit}
              disabled={!videoFile || isSubmitting}
              style={{
                padding: '1rem 3rem',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: !videoFile || isSubmitting ? '#94a3b8' : '#2da44e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: !videoFile || isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Submitting...' : '✅ Submit Video Explanation'}
            </button>
          </div>
        </div>
      ) : (
        /* Requests List */
        <div>
          {/* Overdue Requests */}
          {overdueRequests.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
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
                    backgroundColor: '#dc2626',
                    color: 'white',
                  }}
                >
                  <h3 style={{ margin: 0 }}>⚠️ Overdue Requests ({overdueRequests.length})</h3>
                </div>

                <div>
                  {overdueRequests.map((request) => (
                    <div
                      key={request.id}
                      style={{
                        padding: '1.5rem',
                        borderBottom: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '16px', color: '#dc2626' }}>
                            OVERDUE - Submit Immediately
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>
                            Due: {new Date(request.dueAt).toLocaleString()}
                          </div>
                          <div style={{ fontSize: '14px' }}>
                            {request.instructions?.substring(0, 100)}...
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedRequest(request)}
                          style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                          }}
                        >
                          Submit Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
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
                    padding: '1.5rem',
                    backgroundColor: '#1e293b',
                    color: 'white',
                  }}
                >
                  <h3 style={{ margin: 0 }}>📋 Pending Requests ({pendingRequests.length})</h3>
                </div>

                <div>
                  {pendingRequests.map((request) => (
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
                            Code Explanation Required
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>
                            Due: {new Date(request.dueAt).toLocaleString()} ({formatTimeRemaining(request.dueAt)})
                          </div>
                          <div style={{ fontSize: '14px', marginBottom: '0.5rem' }}>
                            {request.instructions?.substring(0, 150)}...
                          </div>
                          {request.reason && (
                            <div style={{ fontSize: '13px', color: '#f59e0b', fontStyle: 'italic' }}>
                              Reason: {request.reason}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedRequest(request)}
                          style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#2da44e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          📹 Record Explanation
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
