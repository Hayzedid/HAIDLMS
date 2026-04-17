import React, { useState, useEffect } from 'react';
import {
  peerReviewApi,
  ReviewRubric,
  RubricCriterion,
} from '../../api/peer-review.api';
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  courseId: string;
  assessmentId?: string;
  onRubricCreated?: (rubric: ReviewRubric) => void;
}

export const RubricManagement: React.FC<Props> = ({ courseId, assessmentId, onRubricCreated }) => {
  const [rubrics, setRubrics] = useState<ReviewRubric[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<ReviewRubric | null>(null);
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [isCreatingRubric, setIsCreatingRubric] = useState(false);
  const [isAddingCriterion, setIsAddingCriterion] = useState(false);

  const [rubricForm, setRubricForm] = useState({
    name: '',
    description: '',
    minReviewsRequired: 2,
    allowSelfReview: false,
    anonymizeReviewers: true,
    anonymizeCodeAuthors: false,
    runMossCheck: true,
    mossSimilarityThreshold: 75,
  });

  const [criterionForm, setCriterionForm] = useState({
    name: '',
    description: '',
    weight: 1,
    maxScore: 5,
    isRequired: true,
    examples: '',
  });

  useEffect(() => {
    loadRubrics();
  }, [courseId]);

  useEffect(() => {
    if (selectedRubric) {
      loadCriteria(selectedRubric.id);
    }
  }, [selectedRubric]);

  const loadRubrics = async () => {
    try {
      setLoading(true);
      const data = await peerReviewApi.getCourseRubrics(courseId);
      setRubrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load rubrics');
    } finally {
      setLoading(false);
    }
  };

  const loadCriteria = async (rubricId: string) => {
    try {
      const data = await peerReviewApi.getRubricCriteria(rubricId);
      setCriteria(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load criteria');
    }
  };

  const createRubric = async () => {
    try {
      setLoading(true);
      setError('');
      const newRubric = await peerReviewApi.createRubric({
        courseId,
        assessmentId,
        ...rubricForm,
        isActive: true,
      });

      setRubrics(prev => [...prev, newRubric]);
      setSelectedRubric(newRubric);
      setIsCreatingRubric(false);
      setSuccess('Rubric created successfully!');
      if (onRubricCreated) onRubricCreated(newRubric);

      // Reset form
      setRubricForm({
        name: '',
        description: '',
        minReviewsRequired: 2,
        allowSelfReview: false,
        anonymizeReviewers: true,
        anonymizeCodeAuthors: false,
        runMossCheck: true,
        mossSimilarityThreshold: 75,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create rubric');
    } finally {
      setLoading(false);
    }
  };

  const addCriterion = async () => {
    if (!selectedRubric) return;

    try {
      setLoading(true);
      setError('');
      const newCriterion = await peerReviewApi.createCriterion(selectedRubric.id, {
        ...criterionForm,
        displayOrder: criteria.length + 1,
      });

      setCriteria(prev => [...prev, newCriterion]);
      setIsAddingCriterion(false);
      setSuccess('Criterion added successfully!');

      // Reset form
      setCriterionForm({
        name: '',
        description: '',
        weight: 1,
        maxScore: 5,
        isRequired: true,
        examples: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to add criterion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Peer Review Rubrics</h2>
            <p className="text-gray-600 mt-1">Create and manage review rubrics for your course</p>
          </div>
          <button
            onClick={() => setIsCreatingRubric(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            New Rubric
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Rubrics List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Rubrics ({rubrics.length})</h3>

          {loading && rubrics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Loading rubrics...</div>
          ) : rubrics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rubrics yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {rubrics.map(rubric => (
                <button
                  key={rubric.id}
                  onClick={() => setSelectedRubric(rubric)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    selectedRubric?.id === rubric.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-semibold text-gray-800">{rubric.name}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {rubric.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{rubric.minReviewsRequired} reviews required</span>
                    {rubric.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Active</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">Inactive</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Rubric Details & Criteria */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Rubric Form */}
          {isCreatingRubric && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create New Rubric</h3>
                <button
                  onClick={() => setIsCreatingRubric(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rubric Name *
                  </label>
                  <input
                    type="text"
                    value={rubricForm.name}
                    onChange={(e) => setRubricForm({ ...rubricForm, name: e.target.value })}
                    placeholder="e.g., Assignment 1 Peer Review"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={rubricForm.description}
                    onChange={(e) => setRubricForm({ ...rubricForm, description: e.target.value })}
                    placeholder="Describe what this rubric evaluates..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Reviews Required
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={rubricForm.minReviewsRequired}
                      onChange={(e) => setRubricForm({ ...rubricForm, minReviewsRequired: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MOSS Threshold (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={rubricForm.mossSimilarityThreshold}
                      onChange={(e) => setRubricForm({ ...rubricForm, mossSimilarityThreshold: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rubricForm.anonymizeReviewers}
                      onChange={(e) => setRubricForm({ ...rubricForm, anonymizeReviewers: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Anonymize reviewers</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rubricForm.anonymizeCodeAuthors}
                      onChange={(e) => setRubricForm({ ...rubricForm, anonymizeCodeAuthors: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Anonymize code authors</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rubricForm.runMossCheck}
                      onChange={(e) => setRubricForm({ ...rubricForm, runMossCheck: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Run MOSS collusion check</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rubricForm.allowSelfReview}
                      onChange={(e) => setRubricForm({ ...rubricForm, allowSelfReview: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Allow self-review</span>
                  </label>
                </div>

                <button
                  onClick={createRubric}
                  disabled={!rubricForm.name || loading}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
                >
                  {loading ? 'Creating...' : 'Create Rubric'}
                </button>
              </div>
            </div>
          )}

          {/* Selected Rubric Details */}
          {selectedRubric && !isCreatingRubric && (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">{selectedRubric.name}</h3>
                <p className="text-gray-600 mb-4">{selectedRubric.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Min Reviews:</span>
                    <span className="ml-2 font-semibold">{selectedRubric.minReviewsRequired}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">MOSS Threshold:</span>
                    <span className="ml-2 font-semibold">{selectedRubric.mossSimilarityThreshold}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Anonymous Reviewers:</span>
                    <span className="ml-2 font-semibold">{selectedRubric.anonymizeReviewers ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">MOSS Check:</span>
                    <span className="ml-2 font-semibold">{selectedRubric.runMossCheck ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              {/* Criteria */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Evaluation Criteria ({criteria.length})</h3>
                  <button
                    onClick={() => setIsAddingCriterion(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Criterion
                  </button>
                </div>

                {isAddingCriterion && (
                  <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={criterionForm.name}
                        onChange={(e) => setCriterionForm({ ...criterionForm, name: e.target.value })}
                        placeholder="Criterion name (e.g., Code Quality)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <textarea
                        value={criterionForm.description}
                        onChange={(e) => setCriterionForm({ ...criterionForm, description: e.target.value })}
                        placeholder="Description (what to evaluate)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        rows={2}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={criterionForm.maxScore}
                          onChange={(e) => setCriterionForm({ ...criterionForm, maxScore: parseInt(e.target.value) })}
                          placeholder="Max score"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          min="0.1"
                          max="5"
                          step="0.1"
                          value={criterionForm.weight}
                          onChange={(e) => setCriterionForm({ ...criterionForm, weight: parseFloat(e.target.value) })}
                          placeholder="Weight"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                          <input
                            type="checkbox"
                            checked={criterionForm.isRequired}
                            onChange={(e) => setCriterionForm({ ...criterionForm, isRequired: e.target.checked })}
                            className="w-4 h-4"
                          />
                          Required
                        </label>
                      </div>
                      <input
                        type="text"
                        value={criterionForm.examples}
                        onChange={(e) => setCriterionForm({ ...criterionForm, examples: e.target.value })}
                        placeholder="Examples (optional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsAddingCriterion(false)}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={addCriterion}
                          disabled={!criterionForm.name || !criterionForm.description || loading}
                          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {criteria.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No criteria yet. Add evaluation criteria to complete the rubric.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {criteria.map((criterion, idx) => (
                      <div key={criterion.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">{idx + 1}. {criterion.name}</span>
                              {criterion.isRequired && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Required</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{criterion.description}</p>
                            {criterion.examples && (
                              <p className="text-xs text-gray-500 mt-1 italic">Examples: {criterion.examples}</p>
                            )}
                          </div>
                          <div className="text-right text-sm">
                            <div className="text-gray-600">Max: {criterion.maxScore}</div>
                            <div className="text-gray-500">Weight: {criterion.weight}x</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
