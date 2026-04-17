import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseApi } from '../../api/course.api';
import ReactPlayer from 'react-player';
import { IDEInterface } from '../../components/ide';
export default function LessonViewer() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [videoProgress, setVideoProgress] = useState(0);
    const playerRef = useRef(null);
    const startTimeRef = useRef(Date.now());
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
            const response = await courseApi.getCourse(courseId);
            setCourse(response.data.data);
            // Load next lesson or first lesson
            const nextResponse = await courseApi.getNextLesson(courseId);
            if (nextResponse.data.data) {
                loadLesson(nextResponse.data.data.id);
            }
            else if (response.data.data.modules && response.data.data.modules.length > 0) {
                const firstModule = response.data.data.modules[0];
                if (firstModule.lessons && firstModule.lessons.length > 0) {
                    loadLesson(firstModule.lessons[0].id);
                }
            }
        }
        catch (error) {
            console.error('Failed to load course:', error);
            navigate('/dashboard');
        }
        finally {
            setLoading(false);
        }
    };
    const loadLesson = async (lessonId) => {
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
        }
        catch (error) {
            console.error('Failed to load lesson:', error);
        }
    };
    const saveProgress = async (completionPercent, timeSpent, lastPosition) => {
        if (!currentLesson)
            return;
        try {
            await courseApi.completeLesson(currentLesson.id, {
                completionPercent: Math.min(completionPercent, 100),
                timeSpentSeconds: timeSpent,
                lastPositionSeconds: lastPosition,
            });
        }
        catch (error) {
            console.error('Failed to save progress:', error);
        }
    };
    const markComplete = async () => {
        if (!currentLesson)
            return;
        const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
        try {
            await courseApi.completeLesson(currentLesson.id, {
                completionPercent: 100,
                timeSpentSeconds: timeSpent,
            });
            alert('Lesson marked as complete!');
            // Load next lesson
            const nextResponse = await courseApi.getNextLesson(courseId);
            if (nextResponse.data.data) {
                loadLesson(nextResponse.data.data.id);
            }
            else {
                alert('Congratulations! You completed the course!');
                navigate(`/courses/${courseId}`);
            }
        }
        catch (error) {
            console.error('Failed to mark complete:', error);
        }
    };
    const handleSubmissionComplete = async (result) => {
        // Auto-mark lesson as complete if submission passed
        if (result.passed && currentLesson) {
            const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
            try {
                await courseApi.completeLesson(currentLesson.id, {
                    completionPercent: 100,
                    timeSpentSeconds: timeSpent,
                });
            }
            catch (error) {
                console.error('Failed to mark complete:', error);
            }
        }
    };
    const handleProgress = (state) => {
        setVideoProgress(state.played);
        // Auto-save progress every 30 seconds
        if (Math.floor(state.playedSeconds) % 30 === 0) {
            const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
            saveProgress(state.played * 100, timeSpent, state.playedSeconds);
        }
    };
    if (loading) {
        return _jsx("div", { style: { padding: '2rem', textAlign: 'center' }, children: "Loading course..." });
    }
    if (!course || !currentLesson) {
        return _jsx("div", { style: { padding: '2rem', textAlign: 'center' }, children: "No content available" });
    }
    return (_jsxs("div", { style: { display: 'flex', height: '100vh' }, children: [_jsxs("div", { style: {
                    width: '300px',
                    borderRight: '1px solid #ddd',
                    overflowY: 'auto',
                    padding: '1rem',
                    backgroundColor: '#f9f9f9',
                }, children: [_jsx("h3", { style: { marginBottom: '1rem' }, children: course.title }), course.modules?.map((module, idx) => (_jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsxs("div", { style: { fontWeight: 500, marginBottom: '0.5rem' }, children: [idx + 1, ". ", module.title] }), module.lessons?.map((lesson) => (_jsx("div", { onClick: () => loadLesson(lesson.id), style: {
                                    padding: '0.5rem',
                                    marginLeft: '1rem',
                                    cursor: 'pointer',
                                    backgroundColor: currentLesson.id === lesson.id ? '#e3f2fd' : 'transparent',
                                    borderRadius: '4px',
                                    marginBottom: '0.25rem',
                                }, children: lesson.title }, lesson.id)))] }, module.id)))] }), _jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column' }, children: [_jsxs("div", { style: {
                            padding: '1rem 2rem',
                            borderBottom: '1px solid #ddd',
                            backgroundColor: '#fff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }, children: [_jsx("h2", { style: { margin: 0 }, children: currentLesson.title }), _jsx("button", { onClick: markComplete, style: {
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                }, children: "Mark as Complete" })] }), _jsxs("div", { style: {
                            flex: 1,
                            overflowY: currentLesson.lessonType === 'code' ? 'hidden' : 'auto',
                            padding: currentLesson.lessonType === 'code' ? '1rem 2rem' : '2rem',
                            display: 'flex',
                            flexDirection: 'column',
                        }, children: [currentLesson.lessonType === 'video' && currentLesson.videoUrl && (_jsx("div", { style: { marginBottom: '2rem', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden' }, children: _jsx(ReactPlayer, { ref: playerRef, url: currentLesson.videoUrl, width: "100%", height: "500px", controls: true, playing: false, onProgress: handleProgress, config: {
                                        youtube: {
                                            playerVars: { start: progress?.lastPositionSeconds || 0 }
                                        }
                                    } }) })), currentLesson.lessonType === 'audio' && currentLesson.audioUrl && (_jsx("div", { style: { marginBottom: '2rem' }, children: _jsx("audio", { controls: true, style: { width: '100%' }, children: _jsx("source", { src: currentLesson.audioUrl }) }) })), currentLesson.description && (_jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("h3", { children: "Description" }), _jsx("p", { children: currentLesson.description })] })), currentLesson.contentMarkdown && (_jsx("div", { style: { marginBottom: '2rem' }, children: _jsx("div", { style: { whiteSpace: 'pre-wrap', lineHeight: '1.6' }, children: currentLesson.contentMarkdown }) })), currentLesson.lessonType === 'code' && (_jsxs("div", { style: { marginBottom: '2rem' }, children: [_jsx("h3", { style: { marginBottom: '1rem' }, children: "Code Exercise" }), _jsx(IDEInterface, { lessonId: currentLesson.id, courseId: courseId, initialLanguage: currentLesson.programmingLanguage || 'python', initialCode: currentLesson.codeTemplate, onSubmissionComplete: handleSubmissionComplete })] })), progress && (_jsxs("div", { style: {
                                    marginTop: '2rem',
                                    padding: '1rem',
                                    backgroundColor: '#f9f9f9',
                                    borderRadius: '4px',
                                }, children: [_jsx("h4", { children: "Your Progress" }), _jsxs("div", { style: { marginBottom: '0.5rem' }, children: ["Completion: ", progress.completionPercent.toFixed(0), "%"] }), _jsx("div", { style: {
                                            height: '8px',
                                            backgroundColor: '#e0e0e0',
                                            borderRadius: '4px',
                                            overflow: 'hidden',
                                        }, children: _jsx("div", { style: {
                                                height: '100%',
                                                width: `${progress.completionPercent}%`,
                                                backgroundColor: '#10b981',
                                            } }) }), _jsxs("div", { style: { marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }, children: ["Time spent: ", Math.floor(progress.timeSpentSeconds / 60), " minutes"] })] }))] })] })] }));
}
