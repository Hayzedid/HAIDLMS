import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { clipboardKeystrokeApi, } from "../../api/clipboard-keystroke.api";
import { Play, Pause, RotateCcw, SkipBack, SkipForward, FastForward, } from "lucide-react";
export const KeystrokeReplayPlayer = ({ sessionId }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [codeBuffer, setCodeBuffer] = useState("");
    const [cursorPosition, setCursorPosition] = useState(0);
    const timeoutRef = useRef();
    useEffect(() => {
        loadEvents();
        return () => {
            if (timeoutRef.current)
                clearTimeout(timeoutRef.current);
        };
    }, [sessionId]);
    useEffect(() => {
        if (isPlaying && currentIndex < events.length) {
            playNextEvent();
        }
        else if (currentIndex >= events.length) {
            setIsPlaying(false);
        }
    }, [isPlaying, currentIndex, playbackSpeed]);
    const loadEvents = async () => {
        try {
            setLoading(true);
            const eventsData = await clipboardKeystrokeApi.getKeystrokeEvents(sessionId);
            setEvents(eventsData);
        }
        catch (err) {
            setError(err.message || "Failed to load keystroke events");
        }
        finally {
            setLoading(false);
        }
    };
    const playNextEvent = () => {
        if (currentIndex >= events.length) {
            setIsPlaying(false);
            return;
        }
        const event = events[currentIndex];
        const nextEvent = events[currentIndex + 1];
        // Apply the keystroke to the buffer
        applyKeystroke(event);
        // Calculate delay until next event
        const delay = nextEvent
            ? Math.max(0, (nextEvent.timestampMs - event.timestampMs) / playbackSpeed)
            : 500;
        timeoutRef.current = setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
        }, Math.min(delay, 1000)); // Cap at 1 second max delay
    };
    const applyKeystroke = (event) => {
        const { eventType, keyName, cursorPosition } = event;
        const key = keyName;
        const cursorPos = cursorPosition || 0;
        if (eventType === "keydown") {
            if (key === "Backspace") {
                setCodeBuffer((prev) => {
                    const newBuffer = prev.slice(0, cursorPos - 1) + prev.slice(cursorPos);
                    setCursorPosition(Math.max(0, cursorPos - 1));
                    return newBuffer;
                });
            }
            else if (key === "Delete") {
                setCodeBuffer((prev) => prev.slice(0, cursorPos) + prev.slice(cursorPos + 1));
            }
            else if (key === "Enter") {
                setCodeBuffer((prev) => {
                    const newBuffer = prev.slice(0, cursorPos) + "\n" + prev.slice(cursorPos);
                    setCursorPosition(cursorPos + 1);
                    return newBuffer;
                });
            }
            else if (key === "Tab") {
                setCodeBuffer((prev) => {
                    const newBuffer = prev.slice(0, cursorPos) + "    " + prev.slice(cursorPos);
                    setCursorPosition(cursorPos + 4);
                    return newBuffer;
                });
            }
            else if (key.length === 1) {
                // Regular character
                setCodeBuffer((prev) => {
                    const newBuffer = prev.slice(0, cursorPos) + key + prev.slice(cursorPos);
                    setCursorPosition(cursorPos + 1);
                    return newBuffer;
                });
            }
        }
    };
    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };
    const handleRestart = () => {
        setIsPlaying(false);
        setCurrentIndex(0);
        setCodeBuffer("");
        setCursorPosition(0);
        if (timeoutRef.current)
            clearTimeout(timeoutRef.current);
    };
    const handleSkipBackward = () => {
        setCurrentIndex(Math.max(0, currentIndex - 10));
    };
    const handleSkipForward = () => {
        setCurrentIndex(Math.min(events.length - 1, currentIndex + 10));
    };
    const handleSpeedChange = (speed) => {
        setPlaybackSpeed(speed);
    };
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    };
    const calculateProgress = () => {
        if (events.length === 0)
            return 0;
        return (currentIndex / events.length) * 100;
    };
    const getEventTypeColor = (eventType) => {
        return eventType === "paste" ? "text-red-600" : "text-gray-600";
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" }) }));
    }
    if (error) {
        return (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 text-red-700", children: error }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Typing Session Replay" }), _jsxs("div", { className: "bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm h-96 overflow-auto relative", children: [_jsx("pre", { className: "whitespace-pre-wrap", children: codeBuffer }), isPlaying && (_jsx("div", { className: "absolute w-0.5 h-5 bg-yellow-400 animate-pulse", style: {
                                    left: `${(cursorPosition % 80) * 9.6 + 16}px`,
                                    top: `${Math.floor(cursorPosition / 80) * 20 + 16}px`,
                                } }))] }), _jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: "flex items-center justify-between text-sm text-gray-600 mb-2", children: [_jsxs("span", { children: ["Event ", currentIndex, " / ", events.length] }), _jsx("span", { children: formatTimestamp(events[currentIndex]?.timestampMs || Date.now()) })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-indigo-600 h-2 rounded-full transition-all duration-300", style: { width: `${calculateProgress()}%` } }) })] })] }), _jsx("div", { className: "bg-white rounded-lg shadow-md p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: handleRestart, className: "p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition", title: "Restart", children: _jsx(RotateCcw, { className: "w-5 h-5 text-gray-700" }) }), _jsx("button", { onClick: handleSkipBackward, className: "p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition", title: "Skip backward 10 events", children: _jsx(SkipBack, { className: "w-5 h-5 text-gray-700" }) }), _jsx("button", { onClick: handlePlayPause, className: "p-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition", title: isPlaying ? "Pause" : "Play", children: isPlaying ? (_jsx(Pause, { className: "w-6 h-6 text-white" })) : (_jsx(Play, { className: "w-6 h-6 text-white" })) }), _jsx("button", { onClick: handleSkipForward, className: "p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition", title: "Skip forward 10 events", children: _jsx(SkipForward, { className: "w-5 h-5 text-gray-700" }) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FastForward, { className: "w-5 h-5 text-gray-600" }), _jsx("span", { className: "text-sm text-gray-600 mr-2", children: "Speed:" }), [0.5, 1, 2, 5, 10].map((speed) => (_jsxs("button", { onClick: () => handleSpeedChange(speed), className: `px-3 py-1 rounded-lg text-sm font-semibold transition ${playbackSpeed === speed
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`, children: [speed, "x"] }, speed)))] })] }) }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Event Timeline" }), _jsx("div", { className: "max-h-64 overflow-y-auto space-y-1", children: events
                            .slice(Math.max(0, currentIndex - 5), currentIndex + 10)
                            .map((event, idx) => {
                            const actualIdx = Math.max(0, currentIndex - 5) + idx;
                            const eventKey = event.id || `${event.timestampMs}-${idx}`;
                            return (_jsxs("div", { className: `flex items-center justify-between py-2 px-3 rounded text-sm ${actualIdx === currentIndex
                                    ? "bg-indigo-100 border-l-4 border-indigo-600"
                                    : "bg-gray-50"}`, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-xs text-gray-500 w-16", children: actualIdx }), _jsx("span", { className: `font-mono ${getEventTypeColor(event.eventType)}`, children: event.eventType === "paste" ? "📋 PASTE" : event.keyName })] }), _jsxs("div", { className: "flex items-center gap-3 text-xs text-gray-500", children: [event.eventType === "paste" && (_jsx("span", { className: "px-2 py-0.5 bg-red-100 text-red-700 rounded font-semibold", children: "Clipboard" })), _jsx("span", { children: formatTimestamp(event.timestampMs) })] })] }, eventKey));
                        }) })] }), _jsxs("div", { className: "grid grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-4", children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Total Events" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: events.length })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-4", children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Paste Events" }), _jsx("p", { className: "text-2xl font-bold text-red-600", children: events.filter((e) => e.eventType === "paste").length })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-4", children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Characters Typed" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: codeBuffer.length })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-4", children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Duration" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: events.length > 0
                                    ? `${Math.floor((events[events.length - 1].timestampMs - events[0].timestampMs) / 60000)}m`
                                    : "0m" })] })] })] }));
};
