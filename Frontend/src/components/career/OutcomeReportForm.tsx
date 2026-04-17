import React, { useState, useEffect } from 'react';
import {
  Briefcase, TrendingUp, Award, Plus, Check, X, AlertCircle, Linkedin
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';

interface Props {
  courseId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const OutcomeReportForm: React.FC<Props> = ({ courseId, onSuccess, onCancel }) => {
  const [outcomeType, setOutcomeType] = useState<string>('hired');
  const [formData, setFormData] = useState({
    newJobTitle: '',
    newCompany: '',
    newSalaryRange: '',
    newEmploymentStatus: 'employed',
    outcomeDate: '',
    previousJobTitle: '',
    previousCompany: '',
    previousSalaryRange: '',
    previousEmploymentStatus: 'employed',
    linkedinProfileUrl: '',
    linkedinPostUrl: '',
    outcomeDescription: '',
    industry: '',
    location: '',
    jobLevel: 'entry',
    referralSource: '',
    courseDirectlyHelped: true,
    isPublic: true,
    allowTestimonial: false,
    testimonialText: '',
  });

  const [skillsUsed, setSkillsUsed] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const outcomeTypes = [
    { value: 'hired', label: 'Got Hired', icon: Briefcase, color: 'text-green-600' },
    { value: 'promoted', label: 'Promoted', icon: TrendingUp, color: 'text-blue-600' },
    { value: 'role_change', label: 'Changed Role', icon: Briefcase, color: 'text-purple-600' },
    { value: 'salary_increase', label: 'Salary Increase', icon: TrendingUp, color: 'text-amber-600' },
    { value: 'started_business', label: 'Started Business', icon: Award, color: 'text-indigo-600' },
    { value: 'other', label: 'Other', icon: Plus, color: 'text-gray-600' },
  ];

  const salaryRanges = [
    '< $50k',
    '$50k - $75k',
    '$75k - $100k',
    '$100k - $125k',
    '$125k - $150k',
    '$150k - $200k',
    '$200k+',
  ];

  const jobLevels = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead / Principal' },
    { value: 'executive', label: 'Executive' },
  ];

  const referralSources = [
    'LinkedIn',
    'Company Referral',
    'Job Board',
    'Recruiter',
    'Career Fair',
    'Networking Event',
    'Direct Application',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.newJobTitle && outcomeType !== 'other') {
      setError('Job title is required');
      return;
    }

    if (!formData.outcomeDate) {
      setError('Outcome date is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/career-outcomes`,
        {
          ...formData,
          courseId,
          outcomeType,
          skillsUsed,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMessage('Career outcome reported successfully! It will be reviewed shortly.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to report outcome');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (!skillInput.trim() || skillsUsed.includes(skillInput.trim())) return;
    setSkillsUsed([...skillsUsed, skillInput.trim()]);
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setSkillsUsed(skillsUsed.filter((s) => s !== skill));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" />
            Report Career Outcome
          </h2>
          <p className="text-gray-600 mt-2">
            Share your career success story and help others see the value of this course!
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 flex items-center gap-2">
            <Check className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Outcome Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of outcome did you achieve? *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {outcomeTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setOutcomeType(type.value)}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition ${
                      outcomeType === type.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${type.color}`} />
                    <span className="text-sm font-medium text-gray-800">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Outcome Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              When did this happen? *
            </label>
            <input
              type="date"
              value={formData.outcomeDate}
              onChange={(e) => setFormData({ ...formData, outcomeDate: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* New Position Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">New Position Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.newJobTitle}
                  onChange={(e) => setFormData({ ...formData, newJobTitle: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.newCompany}
                  onChange={(e) => setFormData({ ...formData, newCompany: e.target.value })}
                  placeholder="e.g., Google"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Range
                </label>
                <select
                  value={formData.newSalaryRange}
                  onChange={(e) => setFormData({ ...formData, newSalaryRange: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select range</option>
                  {salaryRanges.map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Level
                </label>
                <select
                  value={formData.jobLevel}
                  onChange={(e) => setFormData({ ...formData, jobLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {jobLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g., Technology, Healthcare"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Skills Used */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Which skills from the course are you using in this role?
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="e.g., React, Node.js"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsUsed.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full flex items-center gap-2"
                >
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)}>
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* How you found the job */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How did you find this opportunity?
            </label>
            <select
              value={formData.referralSource}
              onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select source</option>
              {referralSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tell us more about your success story
            </label>
            <textarea
              value={formData.outcomeDescription}
              onChange={(e) => setFormData({ ...formData, outcomeDescription: e.target.value })}
              placeholder="How did this course help you achieve this outcome? What specific skills or knowledge made a difference?"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* LinkedIn */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Linkedin className="w-5 h-5 text-blue-600" />
              LinkedIn (Optional)
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={formData.linkedinProfileUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedinProfileUrl: e.target.value })
                  }
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn Post URL (if you shared your success)
                </label>
                <input
                  type="url"
                  value={formData.linkedinPostUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedinPostUrl: e.target.value })
                  }
                  placeholder="https://linkedin.com/posts/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sharing on LinkedIn helps verify your outcome faster
                </p>
              </div>
            </div>
          </div>

          {/* Privacy & Testimonial */}
          <div className="space-y-3 border-t pt-6">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.courseDirectlyHelped}
                onChange={(e) =>
                  setFormData({ ...formData, courseDirectlyHelped: e.target.checked })
                }
                className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <div>
                <div className="font-medium text-gray-800">
                  This course directly helped me achieve this outcome
                </div>
                <div className="text-sm text-gray-600">
                  The skills or knowledge I gained were instrumental to this success
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <div>
                <div className="font-medium text-gray-800">Show in public course statistics</div>
                <div className="text-sm text-gray-600">
                  Help others see the career outcomes this course can enable
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.allowTestimonial}
                onChange={(e) =>
                  setFormData({ ...formData, allowTestimonial: e.target.checked })
                }
                className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <div>
                <div className="font-medium text-gray-800">Allow use as testimonial</div>
                <div className="text-sm text-gray-600">
                  We may feature your success story on the course page
                </div>
              </div>
            </label>

            {formData.allowTestimonial && (
              <div className="ml-8">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Testimonial Quote (Optional)
                </label>
                <textarea
                  value={formData.testimonialText}
                  onChange={(e) =>
                    setFormData({ ...formData, testimonialText: e.target.value })
                  }
                  placeholder="A short quote about your experience with the course..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-6">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Submit Outcome
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
