import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { certificationApi } from "../../api/certification.api";
import { Award, Share2, Download, ExternalLink } from "lucide-react";

export const CertificationGalleryPage: React.FC = () => {
  const [filterType, setFilterType] = useState<
    "all" | "badges" | "certificates"
  >("all");

  const { data: badges, isLoading } = useQuery({
    queryKey: ["userBadges"],
    queryFn: () => certificationApi.getUserBadges(),
  });

  const shareToLinkedIn = (badgeId: string) => {
    certificationApi.generateLinkedInShareUrl(badgeId);
  };

  const downloadBadge = (badgeId: string) => {
    window.open(`/api/certification/badges/${badgeId}/download`, "_blank");
  };

  const filtered = !badges?.length
    ? []
    : filterType === "all"
      ? badges
      : filterType === "badges"
        ? badges.filter((b) => b.type === "badge")
        : badges.filter((b) => b.type === "certificate");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Certifications & Badges
            </h1>
          </div>
          <p className="text-gray-600">
            Showcase your achievements and credentials
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">
              Total Achievements
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {badges?.length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Badges Earned</h3>
            <p className="text-3xl font-bold text-blue-600">
              {badges?.filter((b) => b.type === "badge").length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Certificates</h3>
            <p className="text-3xl font-bold text-green-600">
              {badges?.filter((b) => b.type === "certificate").length || 0}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6">
          {(["all", "badges", "certificates"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === type
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p>
              No {filterType === "all" ? "achievements" : filterType} yet.
              Complete courses to earn badges!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((badge) => (
              <div
                key={badge.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
              >
                {/* Badge Image */}
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center p-6">
                  <div className="text-center">
                    <Award className="w-16 h-16 text-blue-600 mx-auto mb-2" />
                    <p className="font-bold text-gray-900">{badge.name}</p>
                  </div>
                </div>

                {/* Badge Details */}
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {badge.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <span>
                      Earned: {new Date(badge.issuedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {badge.issuer && (
                    <p className="text-xs font-medium text-gray-700 mb-4">
                      Issuer: {badge.issuer}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadBadge(badge.badgeHash)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                    <button
                      onClick={() => shareToLinkedIn(badge.badgeHash)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                    >
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>

                  {badge.credentialUrl && (
                    <a
                      href={badge.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-center text-xs text-blue-600 hover:underline"
                    >
                      View Credential
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

export default CertificationGalleryPage;
