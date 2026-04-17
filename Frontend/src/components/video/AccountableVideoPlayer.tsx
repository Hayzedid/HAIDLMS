import { useState, useEffect, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import axios from 'axios';

interface Checkpoint {
  id: string;
  triggerAtSeconds: number;
  checkpointType: 'quiz' | 'note_required' | 'reflection';
  questionText?: string;
  questionType?: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: Array<{ text: string; is_correct: boolean }>;
  notePrompt?: string;
  minNoteLength?: number;
  allowSkip: boolean;
  maxAttempts: number;
}

interface AccountabilitySettings {
  enableTabTracking: boolean;
  enableIdleDetection: boolean;
  idleThresholdSeconds: number;
  disableSeekOnFirstWatch: boolean;
  allowBackwardSeek: boolean;
  minActiveWatchPercentage: number;
  minQualityScore: number;
  enableCheckpoints: boolean;
}

interface WatchSession {
  id: string;
  isFirstWatch: boolean;
  completedFirstWatch: boolean;
}

interface Props {
  videoUrl: string;
  lessonId: string;
  enrollmentId: string;
  videoDurationSeconds: number;
  onComplete?: () => void;
}

export default function AccountableVideoPlayer({
  videoUrl,
  lessonId,
  enrollmentId,
  videoDurationSeconds,
  onComplete,
}: Props) {
  const playerRef = useRef<ReactPlayer>(null);
  const [session, setSession] = useState<WatchSession | null>(null);
  const [settings, setSettings] = useState<AccountabilitySettings | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);

  // Playback state
  const [playing, setPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [seekEnabled, setSeekEnabled] = useState(true);

  // Accountability tracking
  const [totalWatchTime, setTotalWatchTime] = useState(0);
  const [activeWatchTime, setActiveWatchTime] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [idleEvents, setIdleEvents] = useState(0);
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const [isTabActive, setIsTabActive] = useState(true);
  const [isIdle, setIsIdle] = useState(false);

  // Checkpoint state
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [checkpointAnswer, setCheckpointAnswer] = useState('');
  const [checkpointNote, setCheckpointNote] = useState('');
  const [checkpointAttempts, setCheckpointAttempts] = useState(0);
  const [checkpointFeedback, setCheckpointFeedback] = useState('');

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize watch session
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await axios.post('/api/video-accountability/sessions/start', {
          lessonId,
          enrollmentId,
          videoDurationSeconds,
        });

        setSession(response.data.data.session);
        setSettings(response.data.data.settings);
        setCheckpoints(response.data.data.checkpoints);

        // Disable seek on first watch
        if (response.data.data.session.isFirstWatch && response.data.data.settings.disableSeekOnFirstWatch) {
          setSeekEnabled(false);
        }
      } catch (error) {
        console.error('Failed to start watch session:', error);
      }
    };

    initSession();

    return () => {
      if (session) {
        endSession();
      }
    };
  }, [lessonId, enrollmentId, videoDurationSeconds]);

  // Tab visibility tracking
  useEffect(() => {
    if (!settings?.enableTabTracking) return;

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setIsTabActive(isVisible);

      if (!isVisible) {
        setPlaying(false);
        setTabSwitches((prev) => prev + 1);
        logEvent('tab_blur', currentPosition);
      } else {
        logEvent('tab_focus', currentPosition);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [settings, currentPosition]);

  // Idle detection
  useEffect(() => {
    if (!settings?.enableIdleDetection) return;

    const resetIdleTimer = () => {
      setLastActiveTime(Date.now());

      if (isIdle) {
        setIsIdle(false);
        logEvent('idle_end', currentPosition);
      }

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
        setPlaying(false);
        setIdleEvents((prev) => prev + 1);
        logEvent('idle_start', currentPosition, { duration: settings.idleThresholdSeconds });
      }, settings.idleThresholdSeconds * 1000);
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach((event) => document.addEventListener(event, resetIdleTimer));

    resetIdleTimer();

    return () => {
      events.forEach((event) => document.removeEventListener(event, resetIdleTimer));
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [settings, isIdle, currentPosition]);

  // Periodic update to backend
  useEffect(() => {
    if (!session) return;

    updateIntervalRef.current = setInterval(() => {
      updateSession();
    }, 5000); // Update every 5 seconds

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [session, totalWatchTime, activeWatchTime, tabSwitches, idleEvents, currentPosition]);

  // Check for checkpoints
  useEffect(() => {
    if (!settings?.enableCheckpoints || !session) return;

    const checkForCheckpoint = async () => {
      try {
        const response = await axios.get('/api/video-accountability/checkpoints/next', {
          params: {
            lessonId,
            currentPosition: Math.floor(currentPosition),
            watchSessionId: session.id,
          },
        });

        if (response.data.data) {
          setActiveCheckpoint(response.data.data);
          setPlaying(false);
          setCheckpointAnswer('');
          setCheckpointNote('');
          setCheckpointFeedback('');
          setCheckpointAttempts(0);
        }
      } catch (error) {
        console.error('Failed to check for checkpoint:', error);
      }
    };

    checkForCheckpoint();
  }, [Math.floor(currentPosition), settings, session, lessonId]);

  const logEvent = async (eventType: string, position: number, metadata?: any) => {
    if (!session) return;

    try {
      await axios.post('/api/video-accountability/events', {
        watchSessionId: session.id,
        lessonId,
        eventType,
        videoPosition: Math.floor(position),
        metadata,
      });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  };

  const updateSession = async () => {
    if (!session) return;

    try {
      await axios.patch(`/api/video-accountability/sessions/${session.id}`, {
        totalWatchTimeSeconds: Math.floor(totalWatchTime),
        activeWatchTimeSeconds: Math.floor(activeWatchTime),
        tabSwitches,
        idleEvents,
        furthestPositionSeconds: Math.floor(currentPosition),
        completionPercentage: (currentPosition / videoDurationSeconds) * 100,
      });
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  const endSession = async () => {
    if (!session) return;

    try {
      await updateSession();
      const response = await axios.post(`/api/video-accountability/sessions/${session.id}/end`);

      if (response.data.data.isCompleted) {
        onComplete?.();
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const handleProgress = (state: { playedSeconds: number; played: number }) => {
    setCurrentPosition(state.playedSeconds);

    if (playing && isTabActive && !isIdle) {
      setActiveWatchTime((prev) => prev + 0.5); // Called twice per second
    }

    if (playing) {
      setTotalWatchTime((prev) => prev + 0.5);
    }
  };

  const handleSeek = (seconds: number) => {
    if (!seekEnabled) {
      alert('Seeking is disabled on first watch. Please watch the video completely.');
      return;
    }

    logEvent('seek', currentPosition, { from: currentPosition, to: seconds });
  };

  const handlePlay = () => {
    setPlaying(true);
    logEvent('play', currentPosition);
  };

  const handlePause = () => {
    setPlaying(false);
    logEvent('pause', currentPosition);
  };

  const handleEnded = () => {
    endSession();
  };

  const submitCheckpointResponse = async () => {
    if (!activeCheckpoint || !session) return;

    try {
      const response = await axios.post('/api/video-accountability/checkpoints/respond', {
        checkpointId: activeCheckpoint.id,
        watchSessionId: session.id,
        lessonId,
        responseText: checkpointAnswer,
        selectedOption: checkpointAnswer ? parseInt(checkpointAnswer) : undefined,
        noteText: checkpointNote,
      });

      if (response.data.data.passed) {
        setCheckpointFeedback('✅ Correct! Video will resume.');
        setTimeout(() => {
          setActiveCheckpoint(null);
          setPlaying(true);
        }, 2000);
      } else {
        setCheckpointAttempts((prev) => prev + 1);
        setCheckpointFeedback(
          `❌ Incorrect. ${response.data.data.attemptsRemaining} attempts remaining.`
        );

        if (response.data.data.attemptsRemaining === 0) {
          setCheckpointFeedback(
            `❌ Maximum attempts reached. Correct answer: ${response.data.data.correctAnswer}. Video will resume.`
          );
          setTimeout(() => {
            setActiveCheckpoint(null);
            setPlaying(true);
          }, 5000);
        }
      }
    } catch (error) {
      console.error('Failed to submit checkpoint response:', error);
      setCheckpointFeedback('Error submitting response. Please try again.');
    }
  };

  if (!session || !settings) {
    return <div>Loading video...</div>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Video Player */}
      <div style={{ position: 'relative', paddingTop: '56.25%' }}>
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          playing={playing && isTabActive && !isIdle && !activeCheckpoint}
          controls={seekEnabled}
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
          onProgress={handleProgress}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeek={handleSeek}
          onEnded={handleEnded}
          progressInterval={500}
        />

        {/* Checkpoint Overlay */}
        {activeCheckpoint && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '12px',
                maxWidth: '600px',
                width: '90%',
              }}
            >
              <h3 style={{ marginTop: 0 }}>Comprehension Checkpoint</h3>

              {activeCheckpoint.checkpointType === 'quiz' && (
                <>
                  <p><strong>{activeCheckpoint.questionText}</strong></p>

                  {activeCheckpoint.questionType === 'multiple_choice' && (
                    <div>
                      {activeCheckpoint.options?.map((option, index) => (
                        <label
                          key={index}
                          style={{ display: 'block', margin: '0.5rem 0', cursor: 'pointer' }}
                        >
                          <input
                            type="radio"
                            name="checkpoint-answer"
                            value={index}
                            checked={checkpointAnswer === index.toString()}
                            onChange={(e) => setCheckpointAnswer(e.target.value)}
                            style={{ marginRight: '0.5rem' }}
                          />
                          {option.text}
                        </label>
                      ))}
                    </div>
                  )}

                  {activeCheckpoint.questionType === 'short_answer' && (
                    <input
                      type="text"
                      value={checkpointAnswer}
                      onChange={(e) => setCheckpointAnswer(e.target.value)}
                      placeholder="Type your answer..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        fontSize: '16px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        marginTop: '0.5rem',
                      }}
                    />
                  )}
                </>
              )}

              {activeCheckpoint.checkpointType === 'note_required' && (
                <>
                  <p><strong>{activeCheckpoint.notePrompt || 'Please write a note about what you just learned:'}</strong></p>
                  <textarea
                    value={checkpointNote}
                    onChange={(e) => setCheckpointNote(e.target.value)}
                    placeholder="Type your note here..."
                    rows={5}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '0.5rem' }}>
                    Minimum {activeCheckpoint.minNoteLength || 50} words required
                    (Current: {checkpointNote.split(/\s+/).filter(Boolean).length} words)
                  </div>
                </>
              )}

              {checkpointFeedback && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: checkpointFeedback.startsWith('✅') ? '#d4edda' : '#f8d7da',
                    border: `1px solid ${checkpointFeedback.startsWith('✅') ? '#c3e6cb' : '#f5c6cb'}`,
                    borderRadius: '6px',
                    color: checkpointFeedback.startsWith('✅') ? '#155724' : '#721c24',
                  }}
                >
                  {checkpointFeedback}
                </div>
              )}

              <button
                onClick={submitCheckpointResponse}
                disabled={
                  (activeCheckpoint.checkpointType === 'quiz' && !checkpointAnswer) ||
                  (activeCheckpoint.checkpointType === 'note_required' &&
                    checkpointNote.split(/\s+/).filter(Boolean).length < (activeCheckpoint.minNoteLength || 50))
                }
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '16px',
                  backgroundColor: '#2da44e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  opacity:
                    (activeCheckpoint.checkpointType === 'quiz' && !checkpointAnswer) ||
                    (activeCheckpoint.checkpointType === 'note_required' &&
                      checkpointNote.split(/\s+/).filter(Boolean).length < (activeCheckpoint.minNoteLength || 50))
                      ? 0.5
                      : 1,
                }}
              >
                Submit Answer
              </button>
            </div>
          </div>
        )}

        {/* Tab Away Warning */}
        {!isTabActive && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(255, 0, 0, 0.9)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '8px',
              zIndex: 5,
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            ⚠️ Video paused - please return to this tab
          </div>
        )}

        {/* Idle Warning */}
        {isIdle && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(255, 165, 0, 0.9)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '8px',
              zIndex: 5,
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            ⚠️ Video paused - activity detected as idle
          </div>
        )}
      </div>

      {/* Engagement Stats (for testing/demo) */}
      <div style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
        <div>Active Watch Time: {Math.floor(activeWatchTime)}s / {Math.floor(totalWatchTime)}s</div>
        <div>Tab Switches: {tabSwitches} | Idle Events: {idleEvents}</div>
        <div>Progress: {((currentPosition / videoDurationSeconds) * 100).toFixed(1)}%</div>
        {!seekEnabled && <div style={{ color: 'orange', fontWeight: 'bold' }}>⚠️ Seeking disabled (first watch)</div>}
      </div>
    </div>
  );
}
