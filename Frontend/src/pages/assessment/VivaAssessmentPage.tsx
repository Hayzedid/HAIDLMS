import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { vivaApi } from "../../api/viva.api";
import { Mic, Volume2, FileText, Award } from "lucide-react";

interface VivaAssessment {
  id: string;
  title: string;
  course: string;
  instructor: string;
  duration: number;
  status: "pending" | "in-progress" | "completed";
  score?: number;
  feedback?: string;
  questions: string[];
  scheduledDate?: string;
}

export const VivaAssessmentPage: React.FC = () => {
  const [selectedAssessment, setSelectedAssessment] =
    useState<VivaAssessment | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const { data: vivaData, isLoading } = useQuery({
    queryKey: ["viva-assessments"],
    queryFn: vivaApi.getAssessments,
  });

  const handleStartViva = (assessment: VivaAssessment) => {
    setSelectedAssessment(assessment);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      "in-progress": "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (selectedAssessment) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 max-w-4xl w-full">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => setSelectedAssessment(null)}
              className="text-gray-400 hover:text-white mb-4"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-white">
              {selectedAssessment.title}
            </h1>
            <p className="text-gray-400">
              with {selectedAssessment.instructor}
            </p>
          </div>

          {/* Timer */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6 text-center">
            <p className="text-gray-300 text-sm mb-2">Time Remaining</p>
            <p className="text-3xl font-bold text-blue-400">
              {selectedAssessment.duration}:00
            </p>
          </div>

          {/* Current Question */}
          <div className="bg-gray-700 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">
                Question 1 of {selectedAssessment.questions.length}
              </h2>
            </div>
            <p className="text-lg text-gray-200">
              {selectedAssessment.questions[0]}
            </p>
          </div>

          {/* Recording Status */}
          <div
            className={`rounded-lg p-4 mb-6 ${isRecording ? "bg-red-900" : "bg-gray-700"}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-gray-500"}`}
              ></div>
              <span className="text-white font-medium">
                {isRecording ? "Recording in progress..." : "Ready to record"}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`flex-1 py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isRecording ? (
                <>
                  <Volume2 className="w-5 h-5" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Start Recording
                </>
              )}
            </button>
            <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition">
              Skip Question
            </button>
            <button
              onClick={() => setSelectedAssessment(null)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Viva Assessments
          </h1>
          <p className="text-gray-600">
            Voice-based oral examinations and assessments
          </p>
        </div>

        {/* Assessments */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !vivaData?.length ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
            <Mic className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p>No viva assessments available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vivaData.map((assessment: any) => (
              <div
                key={assessment.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {assessment.title}
                    </h3>
                    <p className="text-gray-600">Course: {assessment.course}</p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assessment.status)}`}
                  >
                    {assessment.status.replace("-", " ").toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Instructor</p>
                    <p className="font-semibold text-gray-900">
                      {assessment.instructor}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold text-gray-900">
                      {assessment.duration} minutes
                    </p>
                  </div>
                  {assessment.scheduledDate && (
                    <div>
                      <p className="text-sm text-gray-600">Scheduled</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(
                          assessment.scheduledDate,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {assessment.score !== undefined && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">
                        Score: {assessment.score}/100
                      </span>
                    </div>
                    {assessment.feedback && (
                      <p className="text-sm text-gray-700 mt-2">
                        {assessment.feedback}
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => handleStartViva(assessment)}
                  disabled={assessment.status === "completed"}
                  className={`font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition ${
                    assessment.status === "completed"
                      ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  {assessment.status === "completed"
                    ? "Already Completed"
                    : "Start Assessment"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VivaAssessmentPage;
