import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseApi, Course, Module, Lesson, LessonProgress } from '../../api/course.api';
import { SubmissionResult } from '../../api/ide.api';
import ReactPlayer from 'react-player';
import { IDEInterface } from '../../components/ide';

export default function LessonViewer() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course & { modules?: Module[] } | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const playerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  useEffect(() => {
    return () => {
      // Save progress when component unmounts
      if (currentLesson) {
        const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
        saveProgress(videoProgress * 100, timeSpent);
      }
    };
  }, [currentLesson, videoProgress]);

  const loadCourse = async () => {
    try {
      const response = await courseApi.getCourse(courseId!);
      setCourse(response.data.data);

      // Load next lesson or first lesson
      const nextResponse = await courseApi.getNextLesson(courseId!);
      if (nextResponse.data.data) {
        loadLesson(nextResponse.data.data.id);
      } else if (response.data.data.modules && response.data.data.modules.length > 0) {
        const firstModule = response.data.data.modules[0];
        if (firstModule.lessons && firstModule.lessons.length > 0) {
          loadLesson(firstModule.lessons[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load course:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadLesson = async (lessonId: string) => {
    try {
      const [lessonResponse, progressResponse] = await Promise.all([
        courseApi.getLesson(lessonId),
        courseApi.getLessonProgress(lessonId),
      ]);

      setCurrentLesson(lessonResponse.data.data);
      setProgress(progressResponse.data.data);
      startTimeRef.current = Date.now();

      // Resume video from last position
      if (progressResponse.data.data.lastPositionSeconds) {
        setVideoProgress(progressResponse.data.data.lastPositionSeconds / (lessonResponse.data.data.durationMinutes || 1) / 60);
      }
    } catch (error) {
      console.error('Failed to load lesson:', error);
    }
  };

  const saveProgress = async (completionPercent: number, timeSpent: number, lastPosition?: number) => {
    if (!currentLesson) return;

    try {
      await courseApi.completeLesson(currentLesson.id, {
        completionPercent: Math.min(completionPercent, 100),
        timeSpentSeconds: timeSpent,
        lastPositionSeconds: lastPosition,
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const markComplete = async () => {
    if (!currentLesson) return;

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    try {
      await courseApi.completeLesson(currentLesson.id, {
        completionPercent: 100,
        timeSpentSeconds: timeSpent,
      });
      alert('Lesson marked as complete!');

      // Load next lesson
      const nextResponse = await courseApi.getNextLesson(courseId!);
      if (nextResponse.data.data) {
        loadLesson(nextResponse.data.data.id);
      } else {
        alert('Congratulations! You completed the course!');
        navigate(`/courses/${courseId}`);
      }
    } catch (error) {
      console.error('Failed to mark complete:', error);
    }
  };

  const handleSubmissionComplete = async (result: SubmissionResult) => {
    // Auto-mark lesson as complete if submission passed
    if (result.passed && currentLesson) {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      try {
        await courseApi.completeLesson(currentLesson.id, {
          completionPercent: 100,
          timeSpentSeconds: timeSpent,
        });
      } catch (error) {
        console.error('Failed to mark complete:', error);
      }
    }
  };

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setVideoProgress(state.played);

    // Auto-save progress every 30 seconds
    if (Math.floor(state.playedSeconds) % 30 === 0) {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      saveProgress(state.played * 100, timeSpent, state.playedSeconds);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading course...</div>;
  }

  if (!course || !currentLesson) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>No content available</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar - Course Modules */}
      <div style={{
        width: '300px',
        borderRight: '1px solid #ddd',
        overflowY: 'auto',
        padding: '1rem',
        backgroundColor: '#f9f9f9',
      }}>
        <h3 style={{ marginBottom: '1rem' }}>{course.title}</h3>
        {course.modules?.map((module, idx) => (
          <div key={module.id} style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
              {idx + 1}. {module.title}
            </div>
            {module.lessons?.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => loadLesson(lesson.id)}
                style={{
                  padding: '0.5rem',
                  marginLeft: '1rem',
                  cursor: 'pointer',
                  backgroundColor: currentLesson.id === lesson.id ? '#e3f2fd' : 'transparent',
                  borderRadius: '4px',
                  marginBottom: '0.25rem',
                }}
              >
                {lesson.title}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Lesson Title */}
        <div style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid #ddd',
          backgroundColor: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ margin: 0 }}>{currentLesson.title}</h2>
          <button
            onClick={markComplete}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Mark as Complete
          </button>
        </div>

        {/* Lesson Content */}
        <div style={{
          flex: 1,
          overflowY: currentLesson.lessonType === 'code' ? 'hidden' : 'auto',
          padding: currentLesson.lessonType === 'code' ? '1rem 2rem' : '2rem',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {currentLesson.lessonType === 'video' && currentLesson.videoUrl && (
            <div style={{ marginBottom: '2rem', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }}>
              <ReactPlayer
                ref={playerRef}
                url={currentLesson.videoUrl}
                width="100%"
                height="500px"
                controls
                playing={false}
                onProgress={handleProgress}
                config={{
                  youtube: {
                    playerVars: { start: progress?.lastPositionSeconds || 0 }
                  }
                }}
              />
            </div>
          )}

          {currentLesson.lessonType === 'audio' && currentLesson.audioUrl && (
            <div style={{ marginBottom: '2rem' }}>
              <audio controls style={{ width: '100%' }}>
                <source src={currentLesson.audioUrl} />
              </audio>
            </div>
          )}

          {currentLesson.description && (
            <div style={{ marginBottom: '2rem' }}>
              <h3>Description</h3>
              <p>{currentLesson.description}</p>
            </div>
          )}

          {currentLesson.contentMarkdown && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {currentLesson.contentMarkdown}
              </div>
            </div>
          )}

          {currentLesson.lessonType === 'code' && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Code Exercise</h3>
              <IDEInterface
                lessonId={currentLesson.id}
                courseId={courseId!}
                initialLanguage={currentLesson.programmingLanguage as any || 'python'}
                initialCode={currentLesson.codeTemplate}
                onSubmissionComplete={handleSubmissionComplete}
              />
            </div>
          )}

          {progress && (
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: '#f9f9f9',
              borderRadius: '4px',
            }}>
              <h4>Your Progress</h4>
              <div style={{ marginBottom: '0.5rem' }}>
                Completion: {progress.completionPercent.toFixed(0)}%
              </div>
              <div style={{
                height: '8px',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress.completionPercent}%`,
                  backgroundColor: '#10b981',
                }}></div>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                Time spent: {Math.floor(progress.timeSpentSeconds / 60)} minutes
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
