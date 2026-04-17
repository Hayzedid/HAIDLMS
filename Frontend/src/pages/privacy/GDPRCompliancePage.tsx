import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { privacyComplianceApi } from "../../api/privacy-compliance.api";
import { Download, Trash2, AlertTriangle, CheckCircle } from "lucide-react";

export const GDPRCompliancePage: React.FC = () => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [exportStatus, setExportStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [deleteStatus, setDeleteStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");

  const exportDataMutation = useMutation({
    mutationFn: () => privacyComplianceApi.exportPersonalData(),
    onSuccess: (data) => {
      setExportStatus("success");
      // Trigger download
      const element = document.createElement("a");
      const file = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      element.href = URL.createObjectURL(file);
      element.download = `my-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
    onError: () => setExportStatus("error"),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => privacyComplianceApi.deleteAccount(deletePassword),
    onSuccess: () => {
      setDeleteStatus("success");
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    },
    onError: () => setDeleteStatus("error"),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Privacy & Data Protection
          </h1>
          <p className="text-gray-600">
            Manage your personal data in accordance with GDPR regulations
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-blue-900">GDPR Compliant</p>
            <p className="text-sm text-blue-800 mt-1">
              We respect your privacy and provide tools to control your personal
              data as required by GDPR.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Data Export Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Export Your Data
              </h2>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              Download a complete copy of your personal data in JSON format.
              This includes your profile, courses, progress, certificates, and
              all other information we hold about you.
            </p>

            <div className="space-y-3 mb-6 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>All personal information</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Course enrollments & progress</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Certificates & achievements</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">✓</span>
                <span>Learning history & assessments</span>
              </div>
            </div>

            {exportStatus === "success" && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                ✓ Your data has been exported and downloaded successfully!
              </div>
            )}

            {exportStatus === "error" && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                ✗ Error exporting data. Please try again.
              </div>
            )}

            <button
              onClick={() => {
                setExportStatus("processing");
                exportDataMutation.mutate();
              }}
              disabled={
                exportDataMutation.isPending || exportStatus === "success"
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {exportDataMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download My Data
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mt-3">
              You will receive your data as a JSON file, typically within a few
              minutes.
            </p>
          </div>

          {/* Account Deletion Section */}
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Delete Account
              </h2>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 text-sm">Warning</p>
                <p className="text-red-800 text-xs mt-1">
                  This will permanently delete your account, learning progress,
                  certificates, and any data we hold about you. This cannot be
                  recovered.
                </p>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete My Account
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter your password to confirm:
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Your password..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {deleteStatus === "success" && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                    ✓ Account deletion initiated. Redirecting to login...
                  </div>
                )}

                {deleteStatus === "error" && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                    ✗ Incorrect password. Please try again.
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword("");
                      setDeleteStatus("idle");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setDeleteStatus("processing");
                      deleteAccountMutation.mutate();
                    }}
                    disabled={
                      deleteAccountMutation.isPending || !deletePassword
                    }
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {deleteAccountMutation.isPending
                      ? "Deleting..."
                      : "Confirm Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rights Info */}
        <div className="mt-12 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Your Privacy Rights
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              <strong>Right to Access:</strong> You can request and download all
              personal data we hold about you.
            </li>
            <li>
              <strong>Right to Erasure:</strong> You can request deletion of
              your account and personal data.
            </li>
            <li>
              <strong>Right to Portability:</strong> You can download your data
              in a portable format.
            </li>
            <li>
              <strong>Right to Rectification:</strong> You can correct
              inaccurate personal data in your profile.
            </li>
            <li>
              <strong>Right to Withdraw Consent:</strong> You can change your
              privacy preferences at any time.
            </li>
          </ul>
          <p className="text-xs text-gray-600 mt-4">
            For more information, see our{" "}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default GDPRCompliancePage;
