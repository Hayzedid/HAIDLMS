import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Briefcase, DollarSign, Clock, Award, Star, Users
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';

interface Props {
  courseId: string;
}

interface OutcomeStats {
  total_outcomes: number;
  hired_count: number;
  promoted_count: number;
  salary_increase_count: number;
  avg_time_to_outcome: number;
  median_salary_range: string;
  top_companies: string[];
  top_job_titles: string[];
}

interface RecentOutcome {
  id: string;
  outcome_type: string;
  outcome_date: string;
  new_job_title: string;
  new_company: string;
  time_to_outcome_days: number;
  testimonial_text?: string;
  full_name: string;
  avatar_url?: string;
}

export const CourseOutcomeStats: React.FC<Props> = ({ courseId }) => {
  const [stats, setStats] = useState<OutcomeStats | null>(null);
  const [recentOutcomes, setRecentOutcomes] = useState<RecentOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, [courseId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/career-outcomes/course/${courseId}/stats`
      );

      setStats(response.data.data.stats);
      setRecentOutcomes(response.data.data.recentOutcomes || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load outcome stats');
    } finally {
      setLoading(false);
    }
  };

  const getOutcomeTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      hired: 'Got Hired',
      promoted: 'Promoted',
      role_change: 'Changed Role',
      salary_increase: 'Salary Increase',
      started_business: 'Started Business',
    };
    return labels[type] || type;
  };

  const getOutcomeColor = (type: string): string => {
    const colors: Record<string, string> = {
      hired: 'bg-green-100 text-green-700',
      promoted: 'bg-blue-100 text-blue-700',
      role_change: 'bg-purple-100 text-purple-700',
      salary_increase: 'bg-amber-100 text-amber-700',
      started_business: 'bg-indigo-100 text-indigo-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !stats || stats.total_outcomes === 0) {
    return null; // Don't show section if no outcomes yet
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Career Outcomes</h2>
            <p className="text-green-100">
              Real results from students who completed this course
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Total Outcomes</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.total_outcomes}</div>
          <div className="text-xs text-gray-500 mt-1">Verified successes</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <Briefcase className="w-5 h-5" />
            <span className="text-sm font-medium">Got Hired</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.hired_count}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((stats.hired_count / stats.total_outcomes) * 100).toFixed(0)}% of outcomes
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Promoted</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.promoted_count}</div>
          <div className="text-xs text-gray-500 mt-1">
            {((stats.promoted_count / stats.total_outcomes) * 100).toFixed(0)}% of outcomes
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Avg Time</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {Math.round(stats.avg_time_to_outcome)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Days to outcome</div>
        </div>
      </div>

      {/* Salary & Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.median_salary_range && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 text-amber-600 mb-4">
              <DollarSign className="w-6 h-6" />
              <h3 className="text-lg font-semibold text-gray-800">Median Salary Range</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.median_salary_range}</div>
            <p className="text-sm text-gray-600 mt-2">
              Based on {stats.salary_increase_count} reported salary outcomes
            </p>
          </div>
        )}

        {stats.top_companies && stats.top_companies.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 text-indigo-600 mb-4">
              <Award className="w-6 h-6" />
              <h3 className="text-lg font-semibold text-gray-800">Top Companies</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.top_companies.slice(0, 10).map((company, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Job Titles */}
      {stats.top_job_titles && stats.top_job_titles.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 text-purple-600 mb-4">
            <Briefcase className="w-6 h-6" />
            <h3 className="text-lg font-semibold text-gray-800">Common Job Titles</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.top_job_titles.slice(0, 12).map((title, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium"
              >
                {title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Success Stories */}
      {recentOutcomes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Recent Success Stories
          </h3>

          <div className="space-y-4">
            {recentOutcomes.map((outcome) => (
              <div
                key={outcome.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {outcome.avatar_url ? (
                      <img
                        src={outcome.avatar_url}
                        alt={outcome.full_name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold text-lg">
                          {outcome.full_name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">{outcome.full_name}</h4>
                        <p className="text-sm text-gray-600">
                          {outcome.new_job_title}
                          {outcome.new_company && ` at ${outcome.new_company}`}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(
                          outcome.outcome_type
                        )}`}
                      >
                        {getOutcomeTypeLabel(outcome.outcome_type)}
                      </span>
                    </div>

                    {outcome.testimonial_text && (
                      <p className="text-sm text-gray-700 italic mb-2">
                        "{outcome.testimonial_text}"
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        {new Date(outcome.outcome_date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {outcome.time_to_outcome_days !== null && (
                        <span>
                          <Clock className="w-3 h-3 inline mr-1" />
                          {outcome.time_to_outcome_days} days after completion
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
