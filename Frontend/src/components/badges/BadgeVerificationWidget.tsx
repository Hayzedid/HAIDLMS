import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, Search, AlertTriangle } from 'lucide-react';
import axios from 'axios';

interface Props {
  initialBadgeHash?: string;
}

const API_URL = import.meta.env.VITE_CERTIFICATION_SERVICE_URL || 'http://localhost:4005';

export const BadgeVerificationWidget: React.FC<Props> = ({ initialBadgeHash }) => {
  const [badgeHash, setBadgeHash] = useState(initialBadgeHash || '');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verifyBadge = async () => {
    if (!badgeHash.trim()) {
      setError('Please enter a badge hash or verification URL');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setVerificationResult(null);

      // Extract hash from URL if full URL provided
      const hash = badgeHash.includes('/') ? badgeHash.split('/').pop() : badgeHash;

      const response = await axios.get(`${API_URL}/api/badges/verify/${hash}`);

      setVerificationResult(response.data.data);
    } catch (err: any) {
      if (err.response?.data) {
        setVerificationResult(err.response.data.data);
      } else {
        setError('Failed to verify badge. Please check the badge hash and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      verifyBadge();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify Badge</h2>
          <p className="text-gray-600">
            Enter a badge hash or verification URL to verify its authenticity
          </p>
        </div>

        {/* Input */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={badgeHash}
              onChange={(e) => setBadgeHash(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Badge hash or verification URL"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={verifyBadge}
              disabled={loading || !badgeHash.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Verify
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <div className="space-y-4">
            {/* Status Banner */}
            <div
              className={`p-6 rounded-lg border-2 ${
                verificationResult.isValid
                  ? 'bg-green-50 border-green-500'
                  : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="flex items-center gap-3">
                {verificationResult.isValid ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="text-xl font-bold text-green-800">Badge Verified ✓</h3>
                      <p className="text-green-700 text-sm mt-1">
                        This badge is authentic and has been cryptographically verified.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <h3 className="text-xl font-bold text-red-800">Verification Failed</h3>
                      <p className="text-red-700 text-sm mt-1">
                        {verificationResult.error || 'This badge could not be verified.'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Badge Details (if valid) */}
            {verificationResult.isValid && verificationResult.badge && (
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                {/* Badge Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                      {verificationResult.badge.badgeClass?.image_url ? (
                        <img
                          src={verificationResult.badge.badgeClass.image_url}
                          alt="Badge"
                          className="w-16 h-16"
                        />
                      ) : (
                        <Shield className="w-12 h-12 text-indigo-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold">
                        {verificationResult.badge.badgeClass?.name || 'Badge'}
                      </h4>
                      <p className="text-indigo-100 mt-1">
                        {verificationResult.badge.badgeClass?.description || 'Achievement badge'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Badge Information */}
                <div className="p-6 space-y-4">
                  {/* Recipient */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-600 mb-1">Awarded To</h5>
                    <p className="text-lg font-medium text-gray-900">
                      {verificationResult.badge.recipient?.name || 'Badge Holder'}
                    </p>
                  </div>

                  {/* Issue Date */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-600 mb-1">Issued On</h5>
                    <p className="text-lg font-medium text-gray-900">
                      {new Date(verificationResult.badge.issued_on).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Achievement Score */}
                  {verificationResult.badge.achievement_score && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-600 mb-1">Achievement Score</h5>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-green-500 h-3 rounded-full"
                            style={{ width: `${verificationResult.badge.achievement_score}%` }}
                          />
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {verificationResult.badge.achievement_score}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Issuer */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-600 mb-1">Issued By</h5>
                    <p className="text-lg font-medium text-gray-900">
                      {verificationResult.badge.badgeClass?.issuer_name || 'TechLearn LMS'}
                    </p>
                  </div>

                  {/* Verification Details */}
                  <div className="pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-600 mb-2">Verification Details</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Algorithm:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {verificationResult.badge.signature_algorithm || 'RSA-SHA256'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Verified:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(verificationResult.verifiedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Open Badges 2.0 Compliance */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-blue-900 mb-1">Open Badges 2.0 Compliant</h5>
                        <p className="text-sm text-blue-800">
                          This badge follows the Open Badges 2.0 standard and can be imported into any
                          compatible badge wallet or backpack.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!verificationResult && !error && !loading && (
          <div className="text-center text-sm text-gray-500 mt-6">
            <p>All badges are secured with RSA-SHA256 cryptographic signatures</p>
            <p className="mt-1">Open Badges 2.0 compliant</p>
          </div>
        )}
      </div>
    </div>
  );
};
