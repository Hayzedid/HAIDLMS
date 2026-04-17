import React, { useState } from "react";
import {
  User,
  Lock,
  Bell,
  Shield,
  Globe,
  CreditCard,
  Eye,
  EyeOff,
  Save,
  Upload,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { AppLayout } from "../../components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Textarea,
  Select,
  Tabs,
  Avatar,
  Alert,
} from "../../components/ui";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    "profile" | "account" | "notifications" | "privacy" | "billing"
  >("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    bio: "",
    location: "",
    website: "",
    github: "",
    linkedin: "",
    twitter: "",
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailCourseUpdates: true,
    emailNewContent: true,
    emailPromotions: false,
    pushCourseReminders: true,
    pushAchievements: true,
    pushMessages: true,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showEmail: false,
    showProgress: true,
    showAchievements: true,
  });

  const handleSaveProfile = () => {
    // API call to save profile
    console.log("Saving profile:", profileData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleChangePassword = () => {
    // API call to change password
    console.log("Changing password");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveNotifications = () => {
    // API call to save notification preferences
    console.log("Saving notifications:", notifications);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSavePrivacy = () => {
    // API call to save privacy settings
    console.log("Saving privacy:", privacy);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "account", label: "Account", icon: <Lock className="w-4 h-4" /> },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="w-4 h-4" />,
    },
    { id: "privacy", label: "Privacy", icon: <Shield className="w-4 h-4" /> },
    {
      id: "billing",
      label: "Billing",
      icon: <CreditCard className="w-4 h-4" />,
    },
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {saveSuccess && (
        <Alert
          variant="success"
          className="mb-6"
          onClose={() => setSaveSuccess(false)}
        >
          Settings saved successfully!
        </Alert>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as any)}
          variant="pills"
        />
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Profile Picture
              </label>
              <div className="flex items-center gap-6">
                <Avatar
                  name={`${profileData.firstName} ${profileData.lastName}`}
                  size="2xl"
                />
                <div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Upload className="w-4 h-4" />}
                  >
                    Upload New Photo
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* First Name */}
            <Input
              label="First Name"
              value={profileData.firstName}
              onChange={(e) =>
                setProfileData({ ...profileData, firstName: e.target.value })
              }
              placeholder="John"
              fullWidth
            />

            {/* Last Name */}
            <Input
              label="Last Name"
              value={profileData.lastName}
              onChange={(e) =>
                setProfileData({ ...profileData, lastName: e.target.value })
              }
              placeholder="Doe"
              fullWidth
            />

            {/* Email (read-only in profile) */}
            <Input
              label="Email"
              value={profileData.email}
              disabled
              hint="To change your email, go to Account settings"
              fullWidth
            />

            {/* Bio */}
            <Textarea
              label="Bio"
              value={profileData.bio}
              onChange={(e) =>
                setProfileData({ ...profileData, bio: e.target.value })
              }
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={500}
              showCharCount
              fullWidth
            />

            {/* Location */}
            <Input
              label="Location"
              value={profileData.location}
              onChange={(e) =>
                setProfileData({ ...profileData, location: e.target.value })
              }
              placeholder="San Francisco, CA"
              fullWidth
            />

            {/* Website */}
            <Input
              label="Website"
              value={profileData.website}
              onChange={(e) =>
                setProfileData({ ...profileData, website: e.target.value })
              }
              placeholder="https://yourwebsite.com"
              fullWidth
            />

            {/* Social Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="GitHub Username"
                value={profileData.github}
                onChange={(e) =>
                  setProfileData({ ...profileData, github: e.target.value })
                }
                placeholder="username"
                fullWidth
              />
              <Input
                label="LinkedIn Username"
                value={profileData.linkedin}
                onChange={(e) =>
                  setProfileData({ ...profileData, linkedin: e.target.value })
                }
                placeholder="username"
                fullWidth
              />
              <Input
                label="Twitter Handle"
                value={profileData.twitter}
                onChange={(e) =>
                  setProfileData({ ...profileData, twitter: e.target.value })
                }
                placeholder="@username"
                fullWidth
              />
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                icon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Tab */}
      {activeTab === "account" && (
        <div className="space-y-6">
          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Email Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
                type="email"
                fullWidth
              />
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  We'll send a verification email to your new address
                </p>
                <Button variant="secondary">Change Email</Button>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Current Password"
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                rightIcon={
                  <button
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="focus:outline-none"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                fullWidth
              />

              <Input
                label="New Password"
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                hint="Must be at least 8 characters"
                rightIcon={
                  <button
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="focus:outline-none"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                fullWidth
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                error={
                  passwordData.confirmPassword &&
                  passwordData.newPassword !== passwordData.confirmPassword
                    ? "Passwords do not match"
                    : undefined
                }
                fullWidth
              />

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button
                  variant="primary"
                  onClick={handleChangePassword}
                  disabled={
                    !passwordData.currentPassword ||
                    !passwordData.newPassword ||
                    passwordData.newPassword !== passwordData.confirmPassword
                  }
                >
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card>
            <CardHeader>
              <CardTitle>Delete Account</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="danger">
                <strong>Warning:</strong> Deleting your account is permanent and
                cannot be undone. All your data, including courses, progress,
                and achievements will be permanently deleted.
              </Alert>
              <div className="flex justify-end mt-4">
                <Button variant="danger">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Notifications */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                Email Notifications
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">Course Updates</p>
                    <p className="text-sm text-gray-600">
                      Get notified about new lessons and course updates
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.emailCourseUpdates}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        emailCourseUpdates: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">New Content</p>
                    <p className="text-sm text-gray-600">
                      Be the first to know about new courses
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.emailNewContent}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        emailNewContent: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">Promotions</p>
                    <p className="text-sm text-gray-600">
                      Receive special offers and discounts
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.emailPromotions}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        emailPromotions: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                  />
                </label>
              </div>
            </div>

            {/* Push Notifications */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                Push Notifications
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">
                      Course Reminders
                    </p>
                    <p className="text-sm text-gray-600">
                      Daily reminders to keep your learning streak
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.pushCourseReminders}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        pushCourseReminders: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">Achievements</p>
                    <p className="text-sm text-gray-600">
                      Get notified when you earn new achievements
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.pushAchievements}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        pushAchievements: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">Messages</p>
                    <p className="text-sm text-gray-600">
                      Notifications for new messages and mentions
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.pushMessages}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        pushMessages: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={handleSaveNotifications}
                icon={<Save className="w-4 h-4" />}
              >
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Tab */}
      {activeTab === "privacy" && (
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Visibility
              </label>
              <Select
                options={[
                  {
                    value: "public",
                    label: "Public - Anyone can view your profile",
                  },
                  {
                    value: "members",
                    label: "Members Only - Only registered users",
                  },
                  {
                    value: "private",
                    label: "Private - Only you can see your profile",
                  },
                ]}
                value={privacy.profileVisibility}
                onChange={(e) =>
                  setPrivacy({ ...privacy, profileVisibility: e.target.value })
                }
                fullWidth
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">
                    Show Email Address
                  </p>
                  <p className="text-sm text-gray-600">
                    Display your email on your public profile
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.showEmail}
                  onChange={(e) =>
                    setPrivacy({ ...privacy, showEmail: e.target.checked })
                  }
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">
                    Show Learning Progress
                  </p>
                  <p className="text-sm text-gray-600">
                    Display your course progress and completion status
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.showProgress}
                  onChange={(e) =>
                    setPrivacy({ ...privacy, showProgress: e.target.checked })
                  }
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">Show Achievements</p>
                  <p className="text-sm text-gray-600">
                    Display your earned achievements and badges
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.showAchievements}
                  onChange={(e) =>
                    setPrivacy({
                      ...privacy,
                      showAchievements: e.target.checked,
                    })
                  }
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                />
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={handleSavePrivacy}
                icon={<Save className="w-4 h-4" />}
              >
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Pro Plan
                    </h3>
                    <p className="text-gray-600">Full access to all features</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary-600">$29</p>
                    <p className="text-sm text-gray-600">per month</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
                  <span>Next billing date: May 15, 2024</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
                  <span>Payment method: •••• 4242</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary">Change Plan</Button>
                <Button variant="danger">Cancel Subscription</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                <div className="flex items-center gap-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Visa ending in 4242
                    </p>
                    <p className="text-sm text-gray-600">Expires 12/2025</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
              <Button
                variant="secondary"
                icon={<CreditCard className="w-4 h-4" />}
              >
                Add Payment Method
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: "2024-04-15", amount: "$29.00", status: "paid" },
                  { date: "2024-03-15", amount: "$29.00", status: "paid" },
                  { date: "2024-02-15", amount: "$29.00", status: "paid" },
                ].map((invoice, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {invoice.amount}
                      </p>
                      <p className="text-sm text-gray-600">{invoice.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-success-600 font-medium capitalize">
                        {invoice.status}
                      </span>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
