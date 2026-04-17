import React, { useState, useEffect } from 'react';
import {
  User, Globe, Linkedin, Github, Twitter, MapPin, Link2,
  Save, Eye, Settings, Plus, Trash2, Edit2, X, Check
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';

interface PortfolioSettings {
  isPublic: boolean;
  customUrlSlug: string;
  displayName: string;
  headline: string;
  bio: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  twitterUrl: string;
  personalWebsite: string;
  emailPublic: string;
  themeColor: string;
  showCourses: boolean;
  showBadges: boolean;
  showProjects: boolean;
  showSkills: boolean;
  showActivity: boolean;
}

export const PortfolioEditor: React.FC = () => {
  const [settings, setSettings] = useState<PortfolioSettings>({
    isPublic: true,
    customUrlSlug: '',
    displayName: '',
    headline: '',
    bio: '',
    location: '',
    linkedinUrl: '',
    githubUrl: '',
    twitterUrl: '',
    personalWebsite: '',
    emailPublic: '',
    themeColor: '#6366f1',
    showCourses: true,
    showBadges: true,
    showProjects: true,
    showSkills: true,
    showActivity: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/portfolio/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/portfolio/slug-available/${slug}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSlugAvailable(response.data.data.available);
    } catch (err) {
      setSlugAvailable(null);
    }
  };

  const handleSlugChange = (slug: string) => {
    // Sanitize slug: lowercase, alphanumeric, hyphens only
    const sanitized = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');

    setSettings({ ...settings, customUrlSlug: sanitized });
    checkSlugAvailability(sanitized);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/portfolio/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMessage('Portfolio settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const previewPortfolio = () => {
    if (settings.customUrlSlug) {
      window.open(`/portfolio/${settings.customUrlSlug}`, '_blank');
    } else {
      setError('Please set a custom URL slug first');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Settings className="w-7 h-7" />
              Portfolio Settings
            </h1>
            <p className="text-gray-600 mt-1">
              Customize your public portfolio to showcase your achievements
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={previewPortfolio}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Eye className="w-5 h-5" />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving || slugAvailable === false}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 flex items-center gap-2">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Visibility */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Visibility</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.isPublic}
              onChange={(e) => setSettings({ ...settings, isPublic: e.target.checked })}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
            <div>
              <div className="font-medium text-gray-800">Make portfolio public</div>
              <div className="text-sm text-gray-600">
                Allow anyone with the link to view your portfolio
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-6 h-6" />
          Basic Information
        </h2>

        <div className="space-y-4">
          {/* Custom URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Portfolio URL *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">/portfolio/</span>
              <input
                type="text"
                value={settings.customUrlSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="your-name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {slugAvailable !== null && (
                <span
                  className={`text-sm font-medium ${
                    slugAvailable ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {slugAvailable ? '✓ Available' : '✗ Taken'}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
              placeholder="John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Headline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Professional Headline
            </label>
            <input
              type="text"
              value={settings.headline}
              onChange={(e) => setSettings({ ...settings, headline: e.target.value })}
              placeholder="Full-Stack Developer | React Specialist"
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {settings.headline.length}/500 characters
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={settings.bio}
              onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
              placeholder="Tell visitors about yourself, your experience, and what you're passionate about..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={settings.location}
              onChange={(e) => setSettings({ ...settings, location: e.target.value })}
              placeholder="San Francisco, CA"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Link2 className="w-6 h-6" />
          Social Links
        </h2>

        <div className="space-y-4">
          {/* LinkedIn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Linkedin className="w-4 h-4 inline mr-1" />
              LinkedIn URL
            </label>
            <input
              type="url"
              value={settings.linkedinUrl}
              onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })}
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* GitHub */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Github className="w-4 h-4 inline mr-1" />
              GitHub URL
            </label>
            <input
              type="url"
              value={settings.githubUrl}
              onChange={(e) => setSettings({ ...settings, githubUrl: e.target.value })}
              placeholder="https://github.com/yourusername"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Twitter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Twitter className="w-4 h-4 inline mr-1" />
              Twitter URL
            </label>
            <input
              type="url"
              value={settings.twitterUrl}
              onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
              placeholder="https://twitter.com/yourusername"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Personal Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Globe className="w-4 h-4 inline mr-1" />
              Personal Website
            </label>
            <input
              type="url"
              value={settings.personalWebsite}
              onChange={(e) => setSettings({ ...settings, personalWebsite: e.target.value })}
              placeholder="https://yourwebsite.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Public Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Public Contact Email
            </label>
            <input
              type="email"
              value={settings.emailPublic}
              onChange={(e) => setSettings({ ...settings, emailPublic: e.target.value })}
              placeholder="contact@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Display a different email for visitors to contact you
            </p>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Appearance</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme Color
          </label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={settings.themeColor}
              onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
              className="h-12 w-20 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={settings.themeColor}
              onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
              placeholder="#6366f1"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Content Visibility */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Content Visibility</h2>
        <p className="text-sm text-gray-600 mb-4">
          Choose what sections to display on your public portfolio
        </p>

        <div className="space-y-3">
          {[
            { key: 'showCourses', label: 'Completed Courses' },
            { key: 'showBadges', label: 'Earned Badges' },
            { key: 'showProjects', label: 'Portfolio Projects' },
            { key: 'showSkills', label: 'Skills & Competencies' },
            { key: 'showActivity', label: 'Activity Timeline' },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings[item.key as keyof PortfolioSettings] as boolean}
                onChange={(e) =>
                  setSettings({ ...settings, [item.key]: e.target.checked })
                }
                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end gap-3">
        <button
          onClick={previewPortfolio}
          className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          <Eye className="w-5 h-5" />
          Preview Portfolio
        </button>
        <button
          onClick={handleSave}
          disabled={saving || slugAvailable === false}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};
