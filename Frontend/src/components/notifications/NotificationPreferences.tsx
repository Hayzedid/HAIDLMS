import { useState, useEffect } from 'react';
import { notificationApi, NotificationPreferences } from '../../api/notification.api';

export default function NotificationPreferencesPanel() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await notificationApi.getPreferences();
      setPreferences(response.data.data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      await notificationApi.updatePreferences(preferences);
      alert('Preferences saved successfully!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleChange = (key: keyof NotificationPreferences, value: any) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [key]: value,
    });
  };

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>Loading preferences...</div>;
  }

  if (!preferences) {
    return <div style={{ padding: '32px', textAlign: 'center' }}>Failed to load preferences</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>
        Notification Preferences
      </h2>

      {/* Channel Preferences */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
          Notification Channels
        </h3>
        <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
          Choose how you want to receive notifications
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={preferences.emailEnabled}
              onChange={() => handleToggle('emailEnabled')}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>📧 Email</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Receive notifications via email
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={preferences.inAppEnabled}
              onChange={() => handleToggle('inAppEnabled')}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>🔔 In-App</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Show notifications in the app
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={preferences.slackEnabled}
              onChange={() => handleToggle('slackEnabled')}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>💬 Slack</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Send notifications to Slack
              </div>
            </div>
          </label>

          {preferences.slackEnabled && (
            <div style={{ marginLeft: '30px', marginTop: '8px' }}>
              <input
                type="text"
                placeholder="Slack Webhook URL"
                value={preferences.slackWebhookUrl || ''}
                onChange={(e) => handleChange('slackWebhookUrl', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '8px',
                }}
              />
              <input
                type="text"
                placeholder="Slack Channel (optional)"
                value={preferences.slackChannel || ''}
                onChange={(e) => handleChange('slackChannel', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={preferences.pushEnabled}
              onChange={() => handleToggle('pushEnabled')}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>📱 Push Notifications</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Receive browser push notifications
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Email Settings */}
      {preferences.emailEnabled && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
            Email Settings
          </h3>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '12px' }}>
            <input
              type="checkbox"
              checked={preferences.emailDigest}
              onChange={() => handleToggle('emailDigest')}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>Email Digest</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Bundle notifications into a digest instead of individual emails
              </div>
            </div>
          </label>

          {preferences.emailDigest && (
            <div style={{ marginLeft: '30px' }}>
              <label style={{ fontSize: '14px', color: '#374151', display: 'block', marginBottom: '8px' }}>
                Digest Frequency
              </label>
              <select
                value={preferences.digestFrequency}
                onChange={(e) => handleChange('digestFrequency', e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Quiet Hours */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
          Quiet Hours
        </h3>
        <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
          Don't send email, push, or SMS notifications during these hours
        </p>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '14px', color: '#374151', display: 'block', marginBottom: '8px' }}>
              Start Time
            </label>
            <input
              type="time"
              value={preferences.quietHoursStart || ''}
              onChange={(e) => handleChange('quietHoursStart', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '14px', color: '#374151', display: 'block', marginBottom: '8px' }}>
              End Time
            </label>
            <input
              type="time"
              value={preferences.quietHoursEnd || ''}
              onChange={(e) => handleChange('quietHoursEnd', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '14px', color: '#374151', display: 'block', marginBottom: '8px' }}>
              Timezone
            </label>
            <input
              type="text"
              value={preferences.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              placeholder="UTC"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 500,
            color: 'white',
            backgroundColor: saving ? '#9ca3af' : '#3b82f6',
            border: 'none',
            borderRadius: '6px',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
