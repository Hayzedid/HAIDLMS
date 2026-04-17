import { useState, useEffect, useRef } from 'react';
import {
  recordReview,
  SpacedRepetitionSchedule,
} from '../../api/spaced-repetition.api';

interface Props {
  schedule: SpacedRepetitionSchedule;
  contentTitle?: string;
  contentDescription?: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function ReviewSession({
  schedule,
  contentTitle = 'Review Content',
  contentDescription,
  onComplete,
  onCancel,
}: Props) {
  const [quality, setQuality] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const startTimeRef = useRef(Date.now());

  const qualityOptions = [
    { value: 5, label: 'Perfect', emoji: '🌟', description: 'Instantly recalled' },
    { value: 4, label: 'Good', emoji: '✅', description: 'Recalled with slight hesitation' },
    { value: 3, label: 'Fair', emoji: '🤔', description: 'Recalled with difficulty' },
    { value: 2, label: 'Hard', emoji: '😕', description: 'Incorrect, but seems familiar' },
    { value: 1, label: 'Very Hard', emoji: '😰', description: 'Incorrect, barely remembered' },
    { value: 0, label: 'Forgot', emoji: '❌', description: 'Complete blackout' },
  ];

  const handleSubmit = async () => {
    if (quality === null) {
      alert('Please select how well you remembered this content');
      return;
    }

    setIsSubmitting(true);

    try {
      const timeSpentSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

      await recordReview(schedule.id, quality, timeSpentSeconds);

      alert(
        `✅ Review recorded! Next review in ${calculateNextInterval(quality, schedule)} days.`
      );

      onComplete();
    } catch (error) {
      console.error('[ReviewSession] Error recording review:', error);
      alert('Failed to record review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateNextInterval = (
    quality: number,
    schedule: SpacedRepetitionSchedule
  ): number => {
    // Simplified SM-2 calculation for display
    if (quality < 3) {
      return 1; // Reset
    }

    const { repetitionNumber, easinessFactor, intervalDays } = schedule;

    if (repetitionNumber + 1 === 1) {
      return 1;
    } else if (repetitionNumber + 1 === 2) {
      return 6;
    } else {
      return Math.round(intervalDays * easinessFactor);
    }
  };

  const getQualityColor = (value: number): string => {
    const colors = [
      '#dc2626', // 0 - Red
      '#f59e0b', // 1 - Orange
      '#fbbf24', // 2 - Yellow
      '#10b981', // 3 - Light Green
      '#059669', // 4 - Green
      '#16a34a', // 5 - Dark Green
    ];
    return colors[value] || '#64748b';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '2rem',
            backgroundColor: '#1e293b',
            color: 'white',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>📚 Review Session</h2>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
                Test your memory and strengthen your retention
              </p>
            </div>
            <button
              onClick={onCancel}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: 'white',
                border: '1px solid white',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              ✕ Cancel
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            gap: '2rem',
            fontSize: '14px',
          }}
        >
          <div>
            <span style={{ color: '#64748b' }}>Repetition: </span>
            <strong>#{schedule.repetitionNumber + 1}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Easiness Factor: </span>
            <strong>{schedule.easinessFactor.toFixed(2)}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Previous Reviews: </span>
            <strong>{schedule.reviewCount}</strong>
          </div>
        </div>

        {/* Content Section */}
        <div style={{ padding: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>{contentTitle}</h3>

          {contentDescription && (
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              {contentDescription}
            </p>
          )}

          {/* Show/Hide Content Button */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <button
              onClick={() => setShowContent(!showContent)}
              style={{
                padding: '1rem 2rem',
                fontSize: '16px',
                backgroundColor: showContent ? '#10b981' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              {showContent ? '✓ Content Reviewed' : '👁️ Show Content'}
            </button>
          </div>

          {/* Content Preview (placeholder) */}
          {showContent && (
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '2rem',
                border: '2px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '1rem' }}>
                Content ID: {schedule.contentId}
              </div>
              <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
                <strong>Note:</strong> In a production implementation, this would display the actual
                lesson content, module summary, or course key concepts based on the content type
                and ID.
              </div>
            </div>
          )}

          {/* Quality Selection */}
          <div>
            <h4 style={{ marginBottom: '1rem' }}>
              How well did you remember this content?
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {qualityOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => setQuality(option.value)}
                  style={{
                    padding: '1.25rem',
                    border: `2px solid ${
                      quality === option.value
                        ? getQualityColor(option.value)
                        : '#e2e8f0'
                    }`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor:
                      quality === option.value
                        ? getQualityColor(option.value) + '10'
                        : 'white',
                  }}
                  onMouseEnter={(e) => {
                    if (quality !== option.value) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (quality !== option.value) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '32px' }}>{option.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 'bold',
                          fontSize: '16px',
                          marginBottom: '0.25rem',
                          color:
                            quality === option.value
                              ? getQualityColor(option.value)
                              : '#1e293b',
                        }}
                      >
                        {option.label}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        {option.description}
                      </div>
                    </div>
                    {quality === option.value && (
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: getQualityColor(option.value),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '16px',
                          fontWeight: 'bold',
                        }}
                      >
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Review Preview */}
          {quality !== null && (
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
              }}
            >
              <strong>ℹ️ Next Review:</strong> In{' '}
              {calculateNextInterval(quality, schedule)} day(s)
              {quality < 3 && (
                <span style={{ color: '#dc2626', marginLeft: '0.5rem' }}>
                  (Schedule will be reset)
                </span>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleSubmit}
              disabled={quality === null || isSubmitting}
              style={{
                flex: 1,
                padding: '1rem',
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor:
                  quality === null || isSubmitting ? '#94a3b8' : '#2da44e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: quality === null || isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Recording Review...' : '✓ Submit Review'}
            </button>

            <button
              onClick={onCancel}
              style={{
                padding: '1rem 2rem',
                fontSize: '16px',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            fontSize: '13px',
            color: '#64748b',
          }}
        >
          <strong>💡 Tip:</strong> Be honest with your self-assessment. The algorithm adapts to
          your responses to optimize your learning schedule.
        </div>
      </div>
    </div>
  );
}
