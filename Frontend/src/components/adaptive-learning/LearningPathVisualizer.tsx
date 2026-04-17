import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adaptiveLearningApi, type LearningPath, type KnowledgeConcept } from '../../api';
import {
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LearningPathVisualizerProps {
  userId: string;
}

export const LearningPathVisualizer: React.FC<LearningPathVisualizerProps> = ({ userId }) => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<string>('');

  // Fetch learning paths
  const { data: pathsData, isLoading: pathsLoading } = useQuery({
    queryKey: ['learning-paths', userId, selectedStatus],
    queryFn: async () => {
      const response = await adaptiveLearningApi.getLearningPaths(userId, selectedStatus);
      return response.data;
    },
    enabled: !!userId,
  });

  // Fetch all concepts for path generation
  const { data: conceptsData } = useQuery({
    queryKey: ['knowledge-concepts'],
    queryFn: async () => {
      const response = await adaptiveLearningApi.getConcepts();
      return response.data;
    },
  });

  // Fetch user mastery
  const { data: masteryData } = useQuery({
    queryKey: ['concept-mastery', userId],
    queryFn: async () => {
      const response = await adaptiveLearningApi.getMastery(userId);
      return response.data;
    },
    enabled: !!userId,
  });

  // Generate path mutation
  const generatePathMutation = useMutation({
    mutationFn: async (targetConceptId: string) => {
      const response = await adaptiveLearningApi.generatePath({
        user_id: userId,
        target_concept_id: targetConceptId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-paths', userId] });
      toast.success('Learning path generated successfully!');
      setShowGenerateModal(false);
      setSelectedConcept('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to generate path';
      toast.error(message);
    },
  });

  const paths = pathsData?.paths || [];
  const concepts = conceptsData?.concepts || [];
  const masteryMap = new Map(
    (masteryData?.mastery || []).map((m) => [m.concept_id, m.mastery_status])
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'abandoned':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMasteryBadge = (conceptId: string) => {
    const status = masteryMap.get(conceptId);
    switch (status) {
      case 'mastered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3" />
            Mastered
          </span>
        );
      case 'proficient':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            <TrendingUp className="w-3 h-3" />
            Proficient
          </span>
        );
      case 'learning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            <Circle className="w-3 h-3" />
            Learning
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            <Circle className="w-3 h-3" />
            Not Started
          </span>
        );
    }
  };

  const handleGeneratePath = () => {
    if (!selectedConcept) {
      toast.error('Please select a target concept');
      return;
    }
    generatePathMutation.mutate(selectedConcept);
  };

  if (pathsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Learning Paths</h2>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Generate Path
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {['active', 'completed', 'abandoned'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === status
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Paths List */}
      {paths.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No {selectedStatus} learning paths</p>
          <p className="text-sm text-gray-500">
            Generate a personalized learning path to reach your goals
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paths.map((path) => (
            <div
              key={path.id}
              className="border border-gray-200 rounded-lg p-5 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {path.target_concept_name || 'Learning Path'}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        path.status
                      )}`}
                    >
                      {path.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    {getMasteryBadge(path.target_concept_id)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-semibold text-purple-600">
                    {path.progress_percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500 flex items-center justify-end px-1"
                    style={{ width: `${path.progress_percentage}%` }}
                  >
                    {path.progress_percentage > 10 && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Steps</p>
                  <p className="text-lg font-bold text-gray-900">
                    {path.completed_steps || 0} / {path.step_count || 0}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Started</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(path.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {path.status === 'active' && (
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Continue Learning
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    View Details
                  </button>
                </div>
              )}

              {path.status === 'completed' && (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Path Completed!</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Generate Path Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">
                Generate Learning Path
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Select a concept you want to master, and we'll create a personalized learning
              path based on your current knowledge.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Concept
              </label>
              <select
                value={selectedConcept}
                onChange={(e) => setSelectedConcept(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a concept...</option>
                {concepts.map((concept: KnowledgeConcept) => (
                  <option key={concept.id} value={concept.id}>
                    {concept.name} ({concept.cognitive_level})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGeneratePath}
                disabled={generatePathMutation.isPending || !selectedConcept}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {generatePathMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setSelectedConcept('');
                }}
                disabled={generatePathMutation.isPending}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
