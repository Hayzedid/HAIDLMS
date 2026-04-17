import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin.api";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Users, BookOpen, TrendingUp, AlertCircle } from "lucide-react";

export const AdminDashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => adminApi.getDashboardStats(),
  });

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">System overview and key metrics</p>
        </div>

        {/* Key Stats */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-4 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.totalUsers || 0}
                  </p>
                  <p className="text-xs text-green-600">+12% from last month</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-4 rounded-lg">
                  <BookOpen className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Active Courses</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.activeCourses || 0}
                  </p>
                  <p className="text-xs text-green-600">+5 This week</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-4 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Enrollments</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.totalEnrollments || 0}
                  </p>
                  <p className="text-xs text-green-600">+23% from last month</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-4 rounded-lg">
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Flagged Content</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.flaggedContent || 0}
                  </p>
                  <p className="text-xs text-red-600">
                    {dashboardData.pendingReview || 0} pending review
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Growth */}
          {dashboardData?.userGrowthData && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                User Growth
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* User Distribution */}
          {dashboardData?.userDistribution && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                User Distribution
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.userDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.userDistribution.map(
                      (entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Enrollment Stats */}
        {dashboardData?.enrollmentStats && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Course Enrollment Stats
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.enrollmentStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="enrollments" fill="#3b82f6" name="Enrollments" />
                <Bar dataKey="completions" fill="#10b981" name="Completions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Activity */}
        {dashboardData?.recentActivity && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-3">
              {dashboardData.recentActivity
                .slice(0, 5)
                .map((activity: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.timestamp}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        activity.type === "error"
                          ? "bg-red-100 text-red-800"
                          : activity.type === "warning"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {activity.type}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
