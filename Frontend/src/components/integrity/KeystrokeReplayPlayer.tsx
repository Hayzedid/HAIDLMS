import React, { useState, useEffect, useRef } from "react";
import {
  clipboardKeystrokeApi,
  KeystrokeEvent,
} from "../../api/clipboard-keystroke.api";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  FastForward,
} from "lucide-react";

interface Props {
  sessionId: string;
}

export const KeystrokeReplayPlayer: React.FC<Props> = ({ sessionId }) => {
  const [events, setEvents] = useState<KeystrokeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [codeBuffer, setCodeBuffer] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadEvents();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [sessionId]);

  useEffect(() => {
    if (isPlaying && currentIndex < events.length) {
      playNextEvent();
    } else if (currentIndex >= events.length) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentIndex, playbackSpeed]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData =
        await clipboardKeystrokeApi.getKeystrokeEvents(sessionId);
      setEvents(eventsData);
    } catch (err: any) {
      setError(err.message || "Failed to load keystroke events");
    } finally {
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

    timeoutRef.current = setTimeout(
      () => {
        setCurrentIndex((prev) => prev + 1);
      },
      Math.min(delay, 1000),
    ); // Cap at 1 second max delay
  };

  const applyKeystroke = (event: KeystrokeEvent) => {
    const { eventType, keyName, cursorPosition } = event;
    const key = keyName;
    const cursorPos = cursorPosition || 0;

    if (eventType === "keydown") {
      if (key === "Backspace") {
        setCodeBuffer((prev) => {
          const newBuffer =
            prev.slice(0, cursorPos - 1) + prev.slice(cursorPos);
          setCursorPosition(Math.max(0, cursorPos - 1));
          return newBuffer;
        });
      } else if (key === "Delete") {
        setCodeBuffer(
          (prev) => prev.slice(0, cursorPos) + prev.slice(cursorPos + 1),
        );
      } else if (key === "Enter") {
        setCodeBuffer((prev) => {
          const newBuffer =
            prev.slice(0, cursorPos) + "\n" + prev.slice(cursorPos);
          setCursorPosition(cursorPos + 1);
          return newBuffer;
        });
      } else if (key === "Tab") {
        setCodeBuffer((prev) => {
          const newBuffer =
            prev.slice(0, cursorPos) + "    " + prev.slice(cursorPos);
          setCursorPosition(cursorPos + 4);
          return newBuffer;
        });
      } else if (key.length === 1) {
        // Regular character
        setCodeBuffer((prev) => {
          const newBuffer =
            prev.slice(0, cursorPos) + key + prev.slice(cursorPos);
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
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleSkipBackward = () => {
    setCurrentIndex(Math.max(0, currentIndex - 10));
  };

  const handleSkipForward = () => {
    setCurrentIndex(Math.min(events.length - 1, currentIndex + 10));
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const calculateProgress = () => {
    if (events.length === 0) return 0;
    return (currentIndex / events.length) * 100;
  };

  const getEventTypeColor = (eventType: string) => {
    return eventType === "paste" ? "text-red-600" : "text-gray-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Code Display */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Typing Session Replay
        </h3>

        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm h-96 overflow-auto relative">
          <pre className="whitespace-pre-wrap">{codeBuffer}</pre>
          {isPlaying && (
            <div
              className="absolute w-0.5 h-5 bg-yellow-400 animate-pulse"
              style={{
                left: `${(cursorPosition % 80) * 9.6 + 16}px`,
                top: `${Math.floor(cursorPosition / 80) * 20 + 16}px`,
              }}
            />
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>
              Event {currentIndex} / {events.length}
            </span>
            <span>
              {formatTimestamp(events[currentIndex]?.timestampMs || Date.now())}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              title="Restart"
            >
              <RotateCcw className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={handleSkipBackward}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              title="Skip backward 10 events"
            >
              <SkipBack className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={handlePlayPause}
              className="p-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white" />
              )}
            </button>
            <button
              onClick={handleSkipForward}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              title="Skip forward 10 events"
            >
              <SkipForward className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Speed Controls */}
          <div className="flex items-center gap-2">
            <FastForward className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600 mr-2">Speed:</span>
            {[0.5, 1, 2, 5, 10].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                  playbackSpeed === speed
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Event Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Event Timeline
        </h3>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {events
            .slice(Math.max(0, currentIndex - 5), currentIndex + 10)
            .map((event, idx) => {
              const actualIdx = Math.max(0, currentIndex - 5) + idx;
              const eventKey = event.id || `${event.timestampMs}-${idx}`;
              return (
                <div
                  key={eventKey}
                  className={`flex items-center justify-between py-2 px-3 rounded text-sm ${
                    actualIdx === currentIndex
                      ? "bg-indigo-100 border-l-4 border-indigo-600"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16">
                      {actualIdx}
                    </span>
                    <span
                      className={`font-mono ${getEventTypeColor(event.eventType)}`}
                    >
                      {event.eventType === "paste" ? "📋 PASTE" : event.keyName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {event.eventType === "paste" && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-semibold">
                        Clipboard
                      </span>
                    )}
                    <span>{formatTimestamp(event.timestampMs)}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">Total Events</p>
          <p className="text-2xl font-bold text-gray-900">{events.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">Paste Events</p>
          <p className="text-2xl font-bold text-red-600">
            {events.filter((e) => e.eventType === "paste").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">Characters Typed</p>
          <p className="text-2xl font-bold text-gray-900">
            {codeBuffer.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600 mb-1">Duration</p>
          <p className="text-2xl font-bold text-gray-900">
            {events.length > 0
              ? `${Math.floor((events[events.length - 1].timestampMs - events[0].timestampMs) / 60000)}m`
              : "0m"}
          </p>
        </div>
      </div>
    </div>
  );
};
