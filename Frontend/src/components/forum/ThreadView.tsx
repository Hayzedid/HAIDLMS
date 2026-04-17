import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ThumbsUp, ThumbsDown, MessageSquare, Award, CheckCircle, Pin, Lock,
  Flag, Edit2, Trash2, Reply, Eye
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';

interface Thread {
  id: string;
  title: string;
  content: string;
  author_id: string;
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
  upvote_count: number;
  downvote_count: number;
  score: number;
  created_at: string;
}

interface Reply {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  author_reputation: number;
  is_accepted_answer: boolean;
  is_instructor_reply: boolean;
  upvote_count: number;
  downvote_count: number;
  created_at: string;
  updated_at: string;
}

export const ThreadView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentUserId = localStorage.getItem('userId'); // Assuming stored on login

  useEffect(() => {
    loadThread();
  }, [id]);

  const loadThread = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const response = await axios.get(`${API_URL}/api/forum/threads/${id}`, config);

      setThread(response.data.data.thread);
      setReplies(response.data.data.replies);
      setUserVote(response.data.data.userVote);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load thread');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (entityType: 'thread' | 'reply', entityId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.post(
        `${API_URL}/api/forum/${entityType}/${entityId}/vote`,
        { voteType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Reload to update counts
      await loadThread();
    } catch (err: any) {
      console.error('Vote failed:', err);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      await axios.post(
        `${API_URL}/api/forum/threads/${id}/replies`,
        { content: replyContent, isAnswer: thread?.is_question },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReplyContent('');
      await loadThread();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (replyId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.post(
        `${API_URL}/api/forum/threads/${id}/accept-answer/${replyId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await loadThread();
    } catch (err: any) {
      console.error('Failed to accept answer:', err);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error || 'Thread not found'}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Thread */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Thread Header */}
        <div className="bg-gray-50 border-b px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {thread.is_pinned && <Pin className="w-4 h-4 text-amber-500" />}
                {thread.is_locked && <Lock className="w-4 h-4 text-gray-500" />}
                <span className="text-sm text-gray-600">{thread.category_name}</span>
              </div>

              <h1 className="text-2xl font-bold text-gray-800 mb-2">{thread.title}</h1>

              {thread.tags && thread.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {thread.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {thread.is_question && (
              <span
                className={`px-3 py-1 text-sm font-medium rounded ${
                  thread.has_accepted_answer
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {thread.has_accepted_answer ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Answered
                  </span>
                ) : (
                  'Question'
                )}
              </span>
            )}
          </div>
        </div>

        {/* Thread Content */}
        <div className="p-6">
          <div className="flex gap-6">
            {/* Voting */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => handleVote('thread', thread.id, 'upvote')}
                className={`p-2 rounded-lg transition ${
                  userVote === 'upvote'
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ThumbsUp className="w-6 h-6" />
              </button>

              <span className="text-xl font-bold text-gray-800">{thread.score}</span>

              <button
                onClick={() => handleVote('thread', thread.id, 'downvote')}
                className={`p-2 rounded-lg transition ${
                  userVote === 'downvote'
                    ? 'bg-red-100 text-red-600'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ThumbsDown className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="prose max-w-none mb-6">
                <p className="whitespace-pre-wrap">{thread.content}</p>
              </div>

              {/* Author Info */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-3">
                  {thread.author_avatar ? (
                    <img
                      src={thread.author_avatar}
                      alt={thread.author_name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold">
                        {thread.author_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-800">{thread.author_name}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(thread.created_at)}
                      {thread.author_reputation > 0 && (
                        <span className="ml-2 text-amber-600">
                          <Award className="w-3 h-3 inline mr-1" />
                          {thread.author_reputation}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {thread.view_count} views
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {thread.reply_count} replies
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          {thread.reply_count} {thread.reply_count === 1 ? 'Reply' : 'Replies'}
        </h2>

        <div className="space-y-6">
          {replies.map((reply) => (
            <div key={reply.id} className="flex gap-6 pb-6 border-b last:border-0">
              {/* Voting */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleVote('reply', reply.id, 'upvote')}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                >
                  <ThumbsUp className="w-5 h-5" />
                </button>

                <span className="text-lg font-semibold text-gray-800">
                  {reply.upvote_count - reply.downvote_count}
                </span>

                <button
                  onClick={() => handleVote('reply', reply.id, 'downvote')}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                >
                  <ThumbsDown className="w-5 h-5" />
                </button>

                {thread.is_question &&
                  !thread.has_accepted_answer &&
                  thread.author_id === currentUserId && (
                    <button
                      onClick={() => handleAcceptAnswer(reply.id)}
                      className="mt-2 p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition"
                      title="Accept as answer"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
              </div>

              {/* Content */}
              <div className="flex-1">
                {reply.is_accepted_answer && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Accepted Answer</span>
                  </div>
                )}

                {reply.is_instructor_reply && (
                  <div className="mb-3 inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded">
                    <Award className="w-4 h-4" />
                    Instructor
                  </div>
                )}

                <div className="prose max-w-none mb-4">
                  <p className="whitespace-pre-wrap">{reply.content}</p>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-3">
                  {reply.author_avatar ? (
                    <img
                      src={reply.author_avatar}
                      alt={reply.author_name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 text-sm font-semibold">
                        {reply.author_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-semibold text-gray-800">{reply.author_name}</span>
                    {reply.author_reputation > 0 && (
                      <span className="ml-2 text-amber-600">
                        <Award className="w-3 h-3 inline mr-1" />
                        {reply.author_reputation}
                      </span>
                    )}
                    <span className="ml-2 text-gray-500">{formatDate(reply.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply Form */}
      {!thread.is_locked && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Answer</h3>

          <form onSubmit={handleReply}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="submit"
                disabled={submitting || !replyContent.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Reply className="w-5 h-5" />
                {submitting ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </form>
        </div>
      )}

      {thread.is_locked && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          <span>This thread is locked. No new replies can be added.</span>
        </div>
      )}
    </div>
  );
};
