import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { privacyComplianceApi, type UserConsent } from '../../api';
import { Shield, Check, X, Info, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ConsentManagerProps {
  userId: string;
}

export const ConsentManager: React.FC<ConsentManagerProps> = ({ userId }) => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Fetch user consents
  const { data: consentsData, isLoading } = useQuery({
    queryKey: ['user-consents', userId, selectedStatus],
    queryFn: async () => {
      const response = await privacyComplianceApi.getUserConsents(
        userId,
        selectedStatus || undefined
      );
      return response.data;
    },
    enabled: !!userId,
  });

  // Grant consent mutation
  const grantConsentMutation = useMutation({
    mutationFn: async (data: {
      consent_type: string;
      consent_purpose: string;
      consent_version: string;
    }) => {
      const response = await privacyComplianceApi.grantConsent({
        user_id: userId,
        ...data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-consents', userId] });
      toast.success('Consent granted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to grant consent';
      toast.error(message);
    },
  });

  // Withdraw consent mutation
  const withdrawConsentMutation = useMutation({
    mutationFn: async (consentType: string) => {
      const response = await privacyComplianceApi.withdrawConsent(userId, consentType);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-consents', userId] });
      toast.success(`${data.count} consent(s) withdrawn successfully`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to withdraw consent';
      toast.error(message);
    },
  });

  const consents = consentsData?.consents || [];

  const consentPurposes = [
    {
      type: 'data_processing',
      purpose: 'service_provision',
      name: 'Essential Service',
      description: 'Required for core platform functionality and account management',
      required: true,
    },
    {
      type: 'analytics',
      purpose: 'analytics',
      name: 'Analytics & Performance',
      description: 'Help us improve the platform by collecting usage statistics',
      required: false,
    },
    {
      type: 'marketing',
      purpose: 'marketing',
      name: 'Marketing Communications',
      description: 'Receive updates about new courses, features, and promotions',
      required: false,
    },
    {
      type: 'personalization',
      purpose: 'personalization',
      name: 'Personalization',
      description: 'Customize your learning experience based on your preferences',
      required: false,
    },
  ];

  const getConsentStatus = (consentType: string): UserConsent | undefined => {
    return consents.find(
      (c) => c.consent_type === consentType && c.consent_status === 'granted'
    );
  };

  const handleToggleConsent = async (
    consentType: string,
    purpose: string,
    required: boolean
  ) => {
    if (required) {
      toast.error('This consent is required for the service to function');
      return;
    }

    const existingConsent = getConsentStatus(consentType);

    if (existingConsent) {
      // Withdraw consent
      await withdrawConsentMutation.mutateAsync(consentType);
    } else {
      // Grant consent
      await grantConsentMutation.mutateAsync({
        consent_type: consentType,
        consent_purpose: purpose,
        consent_version: 'v1.0',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Privacy Preferences</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-900 font-medium mb-1">
              Your Privacy Matters
            </p>
            <p className="text-sm text-blue-800">
              Control how your data is used. You can change these settings at any time.
              Some consents are required for the platform to function properly.
            </p>
          </div>
        </div>
      </div>

      {/* Consent Options */}
      <div className="space-y-4 mb-6">
        {consentPurposes.map((item) => {
          const hasConsent = !!getConsentStatus(item.type);
          const isPending =
            grantConsentMutation.isPending || withdrawConsentMutation.isPending;

          return (
            <div
              key={item.type}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {item.required && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>

                  {hasConsent && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>
                        Granted on{' '}
                        {new Date(
                          getConsentStatus(item.type)!.granted_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    handleToggleConsent(item.type, item.purpose, item.required)
                  }
                  disabled={isPending || item.required}
                  className={`flex items-center justify-center w-14 h-8 rounded-full transition-colors ${
                    hasConsent
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-300 hover:bg-gray-400'
                  } ${
                    item.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${isPending ? 'opacity-50' : ''}`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                      hasConsent ? 'translate-x-3' : '-translate-x-3'
                    } flex items-center justify-center`}
                  >
                    {hasConsent ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Consent History */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Consent History</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStatus('')}
              className={`px-3 py-1 text-sm rounded ${
                selectedStatus === ''
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus('granted')}
              className={`px-3 py-1 text-sm rounded ${
                selectedStatus === 'granted'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setSelectedStatus('withdrawn')}
              className={`px-3 py-1 text-sm rounded ${
                selectedStatus === 'withdrawn'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Withdrawn
            </button>
          </div>
        </div>

        {consents.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No consent history found
          </p>
        ) : (
          <div className="space-y-2">
            {consents.map((consent) => (
              <div
                key={consent.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {consent.consent_type}
                  </p>
                  <p className="text-xs text-gray-500">
                    Purpose: {consent.consent_purpose}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs ${
                      consent.consent_status === 'granted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {consent.consent_status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(
                      consent.consent_status === 'granted'
                        ? consent.granted_at
                        : consent.withdrawn_at!
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GDPR Notice */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-yellow-900 font-medium mb-1">
              Your Rights Under GDPR/CCPA
            </p>
            <p className="text-yellow-800 mb-2">
              You have the right to access, rectify, or delete your personal data. You
              can also request data portability or restrict processing.
            </p>
            <button className="text-yellow-900 underline hover:text-yellow-700 font-medium">
              Submit a Privacy Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
