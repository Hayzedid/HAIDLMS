import React, { useState } from 'react';
import { Shield, Smartphone, Key, Check, Copy, Download } from 'lucide-react';
import axios from 'axios';

interface Props {
  userId: string;
  onComplete: () => void;
}

const API_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:4001';

export const MFASetupWizard: React.FC<Props> = ({ userId, onComplete }) => {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<'totp' | 'webauthn'>('totp');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startTOTPSetup = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/mfa/totp/enable`, { userId });
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set up TOTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyTOTP = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/mfa/totp/verify`, {
        userId,
        token: verificationCode,
      });

      if (response.data.verified) {
        await generateBackupCodes();
        setStep(3);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const generateBackupCodes = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/mfa/backup-codes`, { userId });
      setBackupCodes(response.data.codes);
    } catch (err: any) {
      setError('Failed to generate backup codes');
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
  };

  const downloadBackupCodes = () => {
    const element = document.createElement('a');
    const file = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'haidlms-backup-codes.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const completeMFASetup = async () => {
    try {
      await axios.post(`${API_URL}/api/mfa/enable`, { userId, primaryMethod: method });
      onComplete();
    } catch (err: any) {
      setError('Failed to complete MFA setup');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > s ? <Check className="w-6 h-6" /> : s}
            </div>
            {s < 3 && (
              <div className={`w-20 h-1 ${step > s ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Choose Method */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <Shield className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Set Up Multi-Factor Authentication</h2>
            <p className="text-gray-600">Add an extra layer of security to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => {
                setMethod('totp');
                startTOTPSetup();
              }}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-600 transition text-left"
            >
              <div className="flex items-start">
                <Smartphone className="w-8 h-8 text-indigo-600 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    Authenticator App (Recommended)
                  </h3>
                  <p className="text-sm text-gray-600">
                    Use an app like Google Authenticator or Authy to generate verification codes
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMethod('webauthn')}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-600 transition text-left"
              disabled
            >
              <div className="flex items-start">
                <Key className="w-8 h-8 text-gray-400 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-400 mb-1">
                    Security Key (Coming Soon)
                  </h3>
                  <p className="text-sm text-gray-500">
                    Use a hardware security key like YubiKey or your device's biometrics
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Scan QR Code */}
      {step === 2 && method === 'totp' && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Scan QR Code</h2>
          <p className="text-gray-600 text-center mb-6">
            Open your authenticator app and scan this QR code
          </p>

          {qrCode && (
            <div className="flex justify-center mb-6">
              <img src={qrCode} alt="QR Code" className="w-64 h-64 border-2 border-gray-200 rounded-lg" />
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600 mb-2 text-center">Or enter this code manually:</p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-lg font-mono font-semibold text-gray-800">{secret}</code>
              <button
                onClick={() => navigator.clipboard.writeText(secret)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg tracking-widest"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={verifyTOTP}
            disabled={verificationCode.length !== 6 || loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify and Continue'}
          </button>
        </div>
      )}

      {/* Step 3: Backup Codes */}
      {step === 3 && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Save Your Backup Codes</h2>
          <p className="text-gray-600 text-center mb-6">
            Store these codes in a safe place. You can use them to access your account if you lose your device.
          </p>

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-3">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="font-mono text-center py-2 bg-white rounded border border-gray-200">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={copyBackupCodes}
              className="flex-1 py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 flex items-center justify-center gap-2"
            >
              <Copy className="w-5 h-5" />
              Copy Codes
            </button>
            <button
              onClick={downloadBackupCodes}
              className="flex-1 py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> Each backup code can only be used once. Store them securely and don't share them with anyone.
            </p>
          </div>

          <button
            onClick={completeMFASetup}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
          >
            Complete Setup
          </button>
        </div>
      )}
    </div>
  );
};
