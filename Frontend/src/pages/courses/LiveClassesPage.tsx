import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { liveClassApi } from "../../api/live-classes.api";
import { Play, Users, Clock, MapPin } from "lucide-react";

// Helper function to format time distance
const formatTimeDistance = (date: string | Date) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = now.getTime() - targetDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

interface LiveClass {
  id: string;
  title: string;
  instructor: { name: string; avatar?: string };
  startTime: string;
  duration: number;
  topic: string;
  participantCount: number;
  maxParticipants: number;
  status: "upcoming" | "live" | "completed";
  zoomUrl?: string;
  recordingUrl?: string;
}

export const LiveClassesPage: React.FC = () => {
  const [filter, setFilter] = useState<"upcoming" | "live" | "completed">(
    "upcoming",
  );

  const {
    data: classes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["live-classes", filter],
    queryFn: () => liveClassApi.getAllClasses(filter),
  });

  const handleJoinClass = async (classId: string) => {
    try {
      const response = await liveClassApi.joinClass(classId);
      window.open(response.zoomUrl, "_blank");
    } catch (err) {
      console.error("Failed to join class:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-red-100 text-red-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Live Classes
          </h1>
          <p className="text-gray-600">
            Join interactive learning sessions with instructors
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-4">
            {(["upcoming", "live", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Classes Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Failed to load classes. Please try again.
          </div>
        ) : !classes?.length ? (
          <div className="bg-gray-100 rounded-lg p-12 text-center text-gray-600">
            No {filter} classes found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((liveClass: LiveClass) => (
              <div
                key={liveClass.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
              >
                {/* Status Badge */}
                <div className="p-4 border-b border-gray-200">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(liveClass.status)}`}
                  >
                    {liveClass.status.toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {liveClass.title}
                  </h3>

                  <div className="space-y-3 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {liveClass.startTime} · {liveClass.duration} mins
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {liveClass.participantCount}/{liveClass.maxParticipants}{" "}
                        participants
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-gray-700 font-medium">
                        {liveClass.instructor.name}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{liveClass.topic}</p>

                  {/* Action Button */}
                  {liveClass.status === "live" && (
                    <button
                      onClick={() => handleJoinClass(liveClass.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      <Play className="w-4 h-4" />
                      Join Now
                    </button>
                  )}
                  {liveClass.status === "upcoming" && (
                    <button
                      onClick={() => handleJoinClass(liveClass.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                      Enroll Now
                    </button>
                  )}
                  {liveClass.status === "completed" &&
                    liveClass.recordingUrl && (
                      <a
                        href={liveClass.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg block text-center transition"
                      >
                        Watch Recording
                      </a>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveClassesPage;
