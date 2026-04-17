import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, ThumbsUp, Eye, Clock, Award, Pin, Lock, CheckCircle, Plus
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';

interface Props {
  categoryId?: string;
  courseId?: string;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_avatar: string;
  author_reputation: number;
  category_name: string;
  is_question: boolean;
  has_accepted_answer: boolean;
  is_pinned: boolean;
  is_locked: boolean;
  tags: string[];
  view_count: number;
  reply_count: number;
  score: number;
  bounty_points: number;
  last_activity_at: string;
  created_at: string;
}

export const ThreadList: React.FC<Props> = ({ categoryId, courseId }) => {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [sortBy, setSortBy] = useState<string>('recent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });

  useEffect(() => {
    loadThreads();
  }, [categoryId, sortBy, pagination.offset]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const params: any = {
        sortBy,
        limit: pagination.limit,
        offset: pagination.offset,
      };

      if (categoryId) params.categoryId = categoryId;

      const response = await axios.get(`${API_URL}/api/forum/threads`, { params });

      setThreads(response.data.data);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load threads');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const sortOptions = [
    { value: 'recent', label: 'Recent Activity' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'unanswered', label: 'Unanswered' },
    { value: 'bounty', label: 'Bounty' },
  ];

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">Discussions</h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => navigate('/forum/new-thread')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          New Thread
        </button>
      </div>

      {/* Thread List */}
      {threads.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No discussions yet</h3>
          <p className="text-gray-500 mb-4">Be the first to start a conversation!</p>
          <button
            onClick={() => navigate('/forum/new-thread')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            Start Discussion
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => navigate(`/forum/thread/${thread.id}`)}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 p-4"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {thread.author_avatar ? (
                    <img
                      src={thread.author_avatar}
                      alt={thread.author_name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold text-lg">
                        {thread.author_name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title Row */}
                  <div className="flex items-start gap-2 mb-2">
                    {thread.is_pinned && (
                      <Pin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-1" />
                    )}
                    {thread.is_locked && (
                      <Lock className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-800 hover:text-indigo-600 flex-1">
                      {thread.title}
                    </h3>
                    {thread.is_question && (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          thread.has_accepted_answer
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {thread.has_accepted_answer ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Answered
                          </span>
                        ) : (
                          'Question'
                        )}
                      </span>
                    )}
                    {thread.bounty_points > 0 && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        +{thread.bounty_points}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {thread.tags && thread.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {thread.tags.slice(0, 5).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{thread.author_name}</span>
                    {thread.author_reputation > 0 && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Award className="w-3 h-3" />
                        {thread.author_reputation}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTimeAgo(thread.last_activity_at)}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2 text-sm">
                  <div className="flex items-center gap-3 text-gray-600">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {thread.reply_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {thread.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {thread.score}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() =>
              setPagination({
                ...pagination,
                offset: Math.max(0, pagination.offset - pagination.limit),
              })
            }
            disabled={pagination.offset === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            {Math.floor(pagination.offset / pagination.limit) + 1} of{' '}
            {Math.ceil(pagination.total / pagination.limit)}
          </span>

          <button
            onClick={() =>
              setPagination({
                ...pagination,
                offset: pagination.offset + pagination.limit,
              })
            }
            disabled={pagination.offset + pagination.limit >= pagination.total}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
