import React, { useState, useEffect } from 'react';
import { Award, Shield, CheckCircle, Share2, Download, ExternalLink, Copy } from 'lucide-react';
import axios from 'axios';

interface Props {
  userId: string;
}

interface Badge {
  assertionId: string;
  badgeHash: string;
  badgeName: string;
  badgeDescription: string;
  badgeImage: string;
  category: string;
  level: string;
  tags: string[];
  issuedOn: string;
  achievementScore?: number;
  achievementPercentile?: number;
  evidenceUrl?: string;
  verificationUrl: string;
}

const API_URL = import.meta.env.VITE_CERTIFICATION_SERVICE_URL || 'http://localhost:4005';

export const BadgeShowcase: React.FC<Props> = ({ userId }) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadBadges();
  }, [userId]);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/badges/users/${userId}`);
      setBadges(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  const shareToLinkedIn = async (badgeHash: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/badges/${badgeHash}/linkedin-share`);
      const linkedInUrl = response.data.data.linkedInUrl;
      window.open(linkedInUrl, '_blank');

      // Track share
      await axios.post(`${API_URL}/api/badges/${badgeHash}/linkedin-share`, {});
    } catch (err: any) {
      console.error('Failed to share to LinkedIn:', err);
    }
  };

  const copyVerificationLink = (verificationUrl: string) => {
    navigator.clipboard.writeText(verificationUrl);
  };

  const downloadBadge = (badge: Badge) => {
    // Create a link to download badge JSON (Open Badges 2.0)
    window.open(`${API_URL}/api/badges/json/${badge.badgeHash}`, '_blank');
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      completion: Award,
      achievement: Shield,
      skill: CheckCircle,
      recognition: Award,
    };
    const Icon = icons[category] || Award;
    return <Icon className="w-6 h-6" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      completion: 'from-blue-500 to-blue-600',
      achievement: 'from-purple-500 to-purple-600',
      skill: 'from-green-500 to-green-600',
      recognition: 'from-amber-500 to-amber-600',
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  const getLevelBadge = (level: string) => {
    const levels: Record<string, { bg: string; text: string }> = {
      beginner: { bg: 'bg-blue-100', text: 'text-blue-700' },
      intermediate: { bg: 'bg-green-100', text: 'text-green-700' },
      advanced: { bg: 'bg-purple-100', text: 'text-purple-700' },
      expert: { bg: 'bg-red-100', text: 'text-red-700' },
    };
    const style = levels[level] || levels.beginner;
    return (
      <span className={`px-2 py-1 ${style.bg} ${style.text} text-xs rounded-full font-semibold`}>
        {level.toUpperCase()}
      </span>
    );
  };

  const filteredBadges =
    filterCategory === 'all'
      ? badges
      : badges.filter((b) => b.category === filterCategory);

  const categories = ['all', ...Array.from(new Set(badges.map((b) => b.category)))];

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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Verified Badges</h2>
            <p className="text-indigo-100">
              {badges.length} cryptographically verified achievement{badges.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilterCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All Badges' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Badge Grid */}
      {filteredBadges.length === 0 ? (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No badges yet</h3>
          <p className="text-gray-500">Complete courses and achievements to earn badges!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBadges.map((badge) => (
            <div
              key={badge.assertionId}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden"
              onClick={() => setSelectedBadge(badge)}
            >
              {/* Badge Image Header */}
              <div className={`bg-gradient-to-br ${getCategoryColor(badge.category)} p-6 flex items-center justify-center`}>
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                  {badge.badgeImage ? (
                    <img src={badge.badgeImage} alt={badge.badgeName} className="w-20 h-20" />
                  ) : (
                    <div className="text-indigo-600">{getCategoryIcon(badge.category)}</div>
                  )}
                </div>
              </div>

              {/* Badge Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800 flex-1">{badge.badgeName}</h3>
                  {getLevelBadge(badge.level)}
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {badge.badgeDescription}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {badge.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Achievement Score */}
                {badge.achievementScore && (
                  <div className="mb-3 p-2 bg-green-50 rounded border border-green-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700 font-medium">Score:</span>
                      <span className="text-green-900 font-bold">{badge.achievementScore}%</span>
                    </div>
                    {badge.achievementPercentile && (
                      <div className="text-xs text-green-600 mt-1">
                        Top {(100 - badge.achievementPercentile).toFixed(0)}% of learners
                      </div>
                    )}
                  </div>
                )}

                {/* Issue Date */}
                <div className="text-xs text-gray-500">
                  Issued: {new Date(badge.issuedOn).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className={`bg-gradient-to-br ${getCategoryColor(selectedBadge.category)} p-8 text-white`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                  {selectedBadge.badgeImage ? (
                    <img src={selectedBadge.badgeImage} alt={selectedBadge.badgeName} className="w-16 h-16" />
                  ) : (
                    <div className="text-indigo-600">{getCategoryIcon(selectedBadge.category)}</div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="text-white hover:bg-white/20 rounded-lg p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h2 className="text-2xl font-bold mb-2">{selectedBadge.badgeName}</h2>
              <p className="text-white/90">{selectedBadge.badgeDescription}</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Verification */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                  <CheckCircle className="w-5 h-5" />
                  Cryptographically Verified
                </div>
                <p className="text-sm text-green-700 mb-3">
                  This badge is secured with RSA-SHA256 signatures and can be independently verified by anyone.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedBadge.verificationUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm"
                  />
                  <button
                    onClick={() => copyVerificationLink(selectedBadge.verificationUrl)}
                    className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                    title="Copy verification link"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => window.open(selectedBadge.verificationUrl, '_blank')}
                    className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                    title="Verify badge"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Achievement Details */}
              {selectedBadge.achievementScore && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Achievement Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Score</div>
                      <div className="text-2xl font-bold text-gray-900">{selectedBadge.achievementScore}%</div>
                    </div>
                    {selectedBadge.achievementPercentile && (
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">Ranking</div>
                        <div className="text-2xl font-bold text-gray-900">
                          Top {(100 - selectedBadge.achievementPercentile).toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Evidence */}
              {selectedBadge.evidenceUrl && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Evidence</h3>
                  <a
                    href={selectedBadge.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    View Supporting Work
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Share Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Share Your Badge</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => shareToLinkedIn(selectedBadge.badgeHash)}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition"
                  >
                    <Share2 className="w-6 h-6 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">LinkedIn</span>
                  </button>
                  <button
                    onClick={() => copyVerificationLink(selectedBadge.verificationUrl)}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition"
                  >
                    <Copy className="w-6 h-6 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">Copy Link</span>
                  </button>
                  <button
                    onClick={() => downloadBadge(selectedBadge)}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition"
                  >
                    <Download className="w-6 h-6 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">Download</span>
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedBadge.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Level:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedBadge.level}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Issued:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(selectedBadge.issuedOn).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Badge ID:</span>
                    <span className="ml-2 font-mono text-xs text-gray-600">
                      {selectedBadge.badgeHash.slice(0, 16)}...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
