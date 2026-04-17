import React, { useState, useEffect } from 'react';
import { Award, Trophy, Medal, TrendingUp } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';

interface Props {
  courseId?: string;
  limit?: number;
}

interface Contributor {
  rank: number;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  total_points: number;
  reputation_level: number;
  reputation_rank: string;
  threads_created: number;
  replies_posted: number;
  best_answers: number;
  helpful_votes_received: number;
}

export const Leaderboard: React.FC<Props> = ({ courseId, limit = 50 }) => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, [courseId]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const params: any = { limit };
      if (courseId) params.courseId = courseId;

      const response = await axios.get(`${API_URL}/api/forum/leaderboard`, { params });
      setContributors(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-gray-500 font-semibold">#{rank}</span>;
  };

  const getRankBadgeColor = (rank: string): string => {
    const colors: Record<string, string> = {
      Novice: 'bg-gray-100 text-gray-700',
      Contributor: 'bg-blue-100 text-blue-700',
      Expert: 'bg-purple-100 text-purple-700',
      Master: 'bg-amber-100 text-amber-700',
    };
    return colors[rank] || 'bg-gray-100 text-gray-700';
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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Leaderboard</h2>
            <p className="text-amber-100">Top contributors in the community</p>
          </div>
          <Trophy className="w-16 h-16 text-white opacity-50" />
        </div>
      </div>

      {/* Leaderboard */}
      {contributors.length === 0 ? (
        <div className="p-12 text-center">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No contributors yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {contributors.map((contributor) => (
            <div
              key={contributor.user_id}
              className={`p-4 hover:bg-gray-50 transition ${
                contributor.rank <= 3 ? 'bg-amber-50/30' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="w-12 flex items-center justify-center">
                  {getRankIcon(contributor.rank)}
                </div>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  {contributor.avatar_url ? (
                    <img
                      src={contributor.avatar_url}
                      alt={contributor.full_name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold text-lg">
                        {contributor.full_name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {contributor.full_name}
                    </h3>
                    {contributor.reputation_rank && (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${getRankBadgeColor(
                          contributor.reputation_rank
                        )}`}
                      >
                        {contributor.reputation_rank}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      {contributor.threads_created} thread{contributor.threads_created !== 1 ? 's' : ''}
                    </span>
                    <span>
                      {contributor.replies_posted} repl{contributor.replies_posted !== 1 ? 'ies' : 'y'}
                    </span>
                    {contributor.best_answers > 0 && (
                      <span className="text-green-600">
                        {contributor.best_answers} best answer{contributor.best_answers !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-amber-600 font-bold text-lg">
                    <Award className="w-5 h-5" />
                    {contributor.total_points}
                  </div>
                  <div className="text-xs text-gray-500">reputation</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="bg-gray-50 px-6 py-4 text-sm text-gray-600">
        <div className="flex items-start gap-2">
          <TrendingUp className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-700 mb-1">How to earn reputation:</p>
            <ul className="space-y-1 text-xs">
              <li>• Create a thread: +5 points</li>
              <li>• Post a reply: +2 points</li>
              <li>• Your answer is accepted: +15 points</li>
              <li>• Receive an upvote: +1 point</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
