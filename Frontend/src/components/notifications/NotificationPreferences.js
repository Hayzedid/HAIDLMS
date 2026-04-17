import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { notificationApi } from '../../api/notification.api';
export default function NotificationPreferencesPanel() {
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        loadPreferences();
    }, []);
    const loadPreferences = async () => {
        try {
            const response = await notificationApi.getPreferences();
            setPreferences(response.data.data);
        }
        catch (error) {
            console.error('Failed to load preferences:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSave = async () => {
        if (!preferences)
            return;
        setSaving(true);
        try {
            await notificationApi.updatePreferences(preferences);
            alert('Preferences saved successfully!');
        }
        catch (error) {
            console.error('Failed to save preferences:', error);
            alert('Failed to save preferences');
        }
        finally {
            setSaving(false);
        }
    };
    const handleToggle = (key) => {
        if (!preferences)
            return;
        setPreferences({
            ...preferences,
            [key]: !preferences[key],
        });
    };
    const handleChange = (key, value) => {
        if (!preferences)
            return;
        setPreferences({
            ...preferences,
            [key]: value,
        });
    };
    if (loading) {
        return _jsx("div", { style: { padding: '32px', textAlign: 'center' }, children: "Loading preferences..." });
    }
    if (!preferences) {
        return _jsx("div", { style: { padding: '32px', textAlign: 'center' }, children: "Failed to load preferences" });
    }
    return (_jsxs("div", { style: { maxWidth: '800px', margin: '0 auto', padding: '24px' }, children: [_jsx("h2", { style: { marginBottom: '24px', fontSize: '24px', fontWeight: 600 }, children: "Notification Preferences" }), _jsxs("div", { style: { marginBottom: '32px' }, children: [_jsx("h3", { style: { marginBottom: '16px', fontSize: '18px', fontWeight: 600 }, children: "Notification Channels" }), _jsx("p", { style: { marginBottom: '16px', fontSize: '14px', color: '#6b7280' }, children: "Choose how you want to receive notifications" }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' }, children: [_jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: preferences.emailEnabled, onChange: () => handleToggle('emailEnabled'), style: { width: '18px', height: '18px', cursor: 'pointer' } }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '14px', fontWeight: 500 }, children: "\uD83D\uDCE7 Email" }), _jsx("div", { style: { fontSize: '12px', color: '#6b7280' }, children: "Receive notifications via email" })] })] }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: preferences.inAppEnabled, onChange: () => handleToggle('inAppEnabled'), style: { width: '18px', height: '18px', cursor: 'pointer' } }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '14px', fontWeight: 500 }, children: "\uD83D\uDD14 In-App" }), _jsx("div", { style: { fontSize: '12px', color: '#6b7280' }, children: "Show notifications in the app" })] })] }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: preferences.slackEnabled, onChange: () => handleToggle('slackEnabled'), style: { width: '18px', height: '18px', cursor: 'pointer' } }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '14px', fontWeight: 500 }, children: "\uD83D\uDCAC Slack" }), _jsx("div", { style: { fontSize: '12px', color: '#6b7280' }, children: "Send notifications to Slack" })] })] }), preferences.slackEnabled && (_jsxs("div", { style: { marginLeft: '30px', marginTop: '8px' }, children: [_jsx("input", { type: "text", placeholder: "Slack Webhook URL", value: preferences.slackWebhookUrl || '', onChange: (e) => handleChange('slackWebhookUrl', e.target.value), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            marginBottom: '8px',
                                        } }), _jsx("input", { type: "text", placeholder: "Slack Channel (optional)", value: preferences.slackChannel || '', onChange: (e) => handleChange('slackChannel', e.target.value), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                        } })] })), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: preferences.pushEnabled, onChange: () => handleToggle('pushEnabled'), style: { width: '18px', height: '18px', cursor: 'pointer' } }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '14px', fontWeight: 500 }, children: "\uD83D\uDCF1 Push Notifications" }), _jsx("div", { style: { fontSize: '12px', color: '#6b7280' }, children: "Receive browser push notifications" })] })] })] })] }), preferences.emailEnabled && (_jsxs("div", { style: { marginBottom: '32px' }, children: [_jsx("h3", { style: { marginBottom: '16px', fontSize: '18px', fontWeight: 600 }, children: "Email Settings" }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '12px' }, children: [_jsx("input", { type: "checkbox", checked: preferences.emailDigest, onChange: () => handleToggle('emailDigest'), style: { width: '18px', height: '18px', cursor: 'pointer' } }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: '14px', fontWeight: 500 }, children: "Email Digest" }), _jsx("div", { style: { fontSize: '12px', color: '#6b7280' }, children: "Bundle notifications into a digest instead of individual emails" })] })] }), preferences.emailDigest && (_jsxs("div", { style: { marginLeft: '30px' }, children: [_jsx("label", { style: { fontSize: '14px', color: '#374151', display: 'block', marginBottom: '8px' }, children: "Digest Frequency" }), _jsxs("select", { value: preferences.digestFrequency, onChange: (e) => handleChange('digestFrequency', e.target.value), style: {
                                    padding: '8px 12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                }, children: [_jsx("option", { value: "daily", children: "Daily" }), _jsx("option", { value: "weekly", children: "Weekly" })] })] }))] })), _jsxs("div", { style: { marginBottom: '32px' }, children: [_jsx("h3", { style: { marginBottom: '16px', fontSize: '18px', fontWeight: 600 }, children: "Quiet Hours" }), _jsx("p", { style: { marginBottom: '16px', fontSize: '14px', color: '#6b7280' }, children: "Don't send email, push, or SMS notifications during these hours" }), _jsxs("div", { style: { display: 'flex', gap: '16px', alignItems: 'center' }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: { fontSize: '14px', color: '#374151', display: 'block', marginBottom: '8px' }, children: "Start Time" }), _jsx("input", { type: "time", value: preferences.quietHoursStart || '', onChange: (e) => handleChange('quietHoursStart', e.target.value), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                        } })] }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: { fontSize: '14px', color: '#374151', display: 'block', marginBottom: '8px' }, children: "End Time" }), _jsx("input", { type: "time", value: preferences.quietHoursEnd || '', onChange: (e) => handleChange('quietHoursEnd', e.target.value), style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                        } })] }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("label", { style: { fontSize: '14px', color: '#374151', display: 'block', marginBottom: '8px' }, children: "Timezone" }), _jsx("input", { type: "text", value: preferences.timezone, onChange: (e) => handleChange('timezone', e.target.value), placeholder: "UTC", style: {
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                        } })] })] })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '12px' }, children: [_jsx("button", { onClick: () => window.location.reload(), style: {
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#374151',
                            backgroundColor: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: 'pointer',
                        }, children: "Cancel" }), _jsx("button", { onClick: handleSave, disabled: saving, style: {
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'white',
                            backgroundColor: saving ? '#9ca3af' : '#3b82f6',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                        }, children: saving ? 'Saving...' : 'Save Preferences' })] })] }));
}
