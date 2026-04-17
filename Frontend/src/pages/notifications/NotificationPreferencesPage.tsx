import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Mail, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import apiClient from "../../api/client";

interface NotificationPreferences {
  email_enabled: boolean;
  email_frequency: string;
  course_announcements: boolean;
  course_updates: boolean;
  new_lesson_available: boolean;
  assignment_deadline: boolean;
  grade_released: boolean;
  forum_reply_to_thread: boolean;
  forum_reply_to_comment: boolean;
  forum_mention: boolean;
  forum_thread_followed: boolean;
  forum_answer_accepted: boolean;
  peer_review_received: boolean;
  peer_review_completed: boolean;
  badge_earned: boolean;
  certificate_issued: boolean;
  portfolio_endorsement: boolean;
  inactivity_reminder: boolean;
  course_recommendation: boolean;
  progress_milestone: boolean;
  leaderboard_ranking: boolean;
  system_announcements: boolean;
  maintenance_alerts: boolean;
}

export const NotificationPreferencesPage: React.FC = () => {
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/notifications/preferences");
      if (response.data.success) {
        setPreferences(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    setSaved(false);

    try {
      const response = await apiClient.put(
        "/notifications/preferences",
        preferences,
      );
      if (response.data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (
    key: keyof NotificationPreferences,
    value: boolean | string,
  ) => {
    if (preferences) {
      setPreferences({ ...preferences, [key]: value });
    }
  };

  const preferenceGroups = [
    {
      title: "Course Notifications",
      icon: "📚",
      preferences: [
        {
          key: "course_announcements",
          label: "Course announcements",
          description: "Important updates from instructors",
        },
        {
          key: "course_updates",
          label: "Course updates",
          description: "Changes to course content or schedule",
        },
        {
          key: "new_lesson_available",
          label: "New lessons",
          description: "When new lessons are published",
        },
        {
          key: "assignment_deadline",
          label: "Assignment deadlines",
          description: "Reminders for upcoming deadlines",
        },
        {
          key: "grade_released",
          label: "Grade released",
          description: "When your assignments are graded",
        },
      ],
    },
    {
      title: "Forum Notifications",
      icon: "💬",
      preferences: [
        {
          key: "forum_reply_to_thread",
          label: "Replies to your threads",
          description: "When someone replies to your discussion",
        },
        {
          key: "forum_reply_to_comment",
          label: "Replies to your comments",
          description: "When someone replies to your comment",
        },
        {
          key: "forum_mention",
          label: "Mentions",
          description: "When someone mentions you in a discussion",
        },
        {
          key: "forum_thread_followed",
          label: "Followed threads",
          description: "Updates to threads you follow",
        },
        {
          key: "forum_answer_accepted",
          label: "Answer accepted",
          description: "When your answer is marked as accepted",
        },
      ],
    },
    {
      title: "Social Notifications",
      icon: "👥",
      preferences: [
        {
          key: "peer_review_received",
          label: "Peer review received",
          description: "When a peer reviews your work",
        },
        {
          key: "peer_review_completed",
          label: "Peer review completed",
          description: "When you complete a peer review",
        },
        {
          key: "badge_earned",
          label: "Badge earned",
          description: "When you earn a new badge",
        },
        {
          key: "certificate_issued",
          label: "Certificate issued",
          description: "When you complete a course and earn a certificate",
        },
        {
          key: "portfolio_endorsement",
          label: "Portfolio endorsement",
          description: "When someone endorses your skills",
        },
      ],
    },
    {
      title: "Engagement Notifications",
      icon: "🎯",
      preferences: [
        {
          key: "inactivity_reminder",
          label: "Inactivity reminders",
          description: "Gentle reminders to continue learning",
        },
        {
          key: "course_recommendation",
          label: "Course recommendations",
          description: "Personalized course suggestions",
        },
        {
          key: "progress_milestone",
          label: "Progress milestones",
          description: "When you reach learning milestones",
        },
        {
          key: "leaderboard_ranking",
          label: "Leaderboard ranking",
          description: "Changes in your leaderboard position",
        },
      ],
    },
    {
      title: "System Notifications",
      icon: "⚙️",
      preferences: [
        {
          key: "system_announcements",
          label: "System announcements",
          description: "Important platform updates",
        },
        {
          key: "maintenance_alerts",
          label: "Maintenance alerts",
          description: "Scheduled maintenance notifications",
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load preferences</p>
          <button
            onClick={fetchPreferences}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/notifications"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-4"
          >
            <ArrowLeft size={20} />
            Back to Notifications
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="text-indigo-600" size={32} />
            Notification Preferences
          </h1>
          <p className="mt-2 text-gray-600">
            Customize how and when you receive notifications
          </p>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">📧</div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Email Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail size={20} className="text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Enable email notifications
                      </p>
                      <p className="text-sm text-gray-600">
                        Receive notifications via email
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.email_enabled}
                      onChange={(e) =>
                        updatePreference("email_enabled", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {preferences.email_enabled && (
                  <div className="ml-11">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email frequency
                    </label>
                    <select
                      value={preferences.email_frequency}
                      onChange={(e) =>
                        updatePreference("email_frequency", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="immediate">
                        Immediate - Send emails as notifications arrive
                      </option>
                      <option value="daily_digest">
                        Daily Digest - One email per day with all notifications
                      </option>
                      <option value="weekly_digest">
                        Weekly Digest - One email per week with all
                        notifications
                      </option>
                      <option value="never">
                        Never - No email notifications
                      </option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Type Groups */}
        {preferenceGroups.map((group) => (
          <div
            key={group.title}
            className="bg-white rounded-lg shadow-sm p-6 mb-6"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="text-3xl">{group.icon}</div>
              <h2 className="text-xl font-semibold text-gray-900">
                {group.title}
              </h2>
            </div>

            <div className="space-y-4">
              {group.preferences.map((pref) => (
                <div
                  key={pref.key}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{pref.label}</p>
                    <p className="text-sm text-gray-600">{pref.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={
                        preferences[
                          pref.key as keyof NotificationPreferences
                        ] as boolean
                      }
                      onChange={(e) =>
                        updatePreference(
                          pref.key as keyof NotificationPreferences,
                          e.target.checked,
                        )
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Save Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              {saved && (
                <p className="text-green-600 font-medium flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 rounded-full">
                    ✓
                  </span>
                  Preferences saved successfully
                </p>
              )}
            </div>
            <button
              onClick={savePreferences}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
