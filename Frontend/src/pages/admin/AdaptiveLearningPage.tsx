import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adaptiveLearningApi } from "../../api/adaptive-learning.api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Zap, TrendingUp, BookOpen, Target } from "lucide-react";

interface AdaptivePathway {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  progress: number;
  coursesRecommended: string[];
  nextLesson?: string;
}

export const AdaptiveLearningPage: React.FC = () => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "all" | "beginner" | "intermediate" | "advanced"
  >("all");

  const { data: adaptiveData, isLoading } = useQuery({
    queryKey: ["adaptive-learning"],
    queryFn: () =>
      adaptiveLearningApi.getAdaptivePathways().then((res) => res.data),
  });

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-green-100 text-green-800",
      intermediate: "bg-yellow-100 text-yellow-800",
      advanced: "bg-red-100 text-red-800",
    };
    return colors[difficulty] || "bg-gray-100 text-gray-800";
  };

  const filteredPathways =
    adaptiveData?.pathways?.filter(
      (p: AdaptivePathway) =>
        selectedDifficulty === "all" || p.difficulty === selectedDifficulty,
    ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Adaptive Learning Pathways
          </h1>
          <p className="text-gray-600">
            Personalized learning paths adjusted to your pace and style
          </p>
        </div>

        {/* Stats */}
        {adaptiveData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Active Pathways</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {adaptiveData.activePathways || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Avg Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {adaptiveData.avgProgress || 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Learning Streak</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {adaptiveData.learnngStreak || 0} days
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {adaptiveData.completionRate || 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Learning Analytics Chart */}
        {adaptiveData?.analyticsData && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Learning Progress
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={adaptiveData.analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="completed"
                  fill="#3b82f6"
                  name="Completed Lessons"
                />
                <Bar dataKey="average" fill="#10b981" name="Average Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2 flex-wrap">
            {(["all", "beginner", "intermediate", "advanced"] as const).map(
              (diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedDifficulty === diff
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Pathways */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !filteredPathways.length ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
            <p>No pathways available for this difficulty level</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPathways.map((pathway: AdaptivePathway) => (
              <div
                key={pathway.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {pathway.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {pathway.description}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(pathway.difficulty)}`}
                  >
                    {pathway.difficulty}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{pathway.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${pathway.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    ⏱ {pathway.estimatedHours} hours estimated
                  </span>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
                    {pathway.nextLesson ? "Continue" : "Start Learning"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdaptiveLearningPage;
