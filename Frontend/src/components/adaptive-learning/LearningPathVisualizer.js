import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adaptiveLearningApi } from '../../api';
import { Target, TrendingUp, CheckCircle2, Circle, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
export const LearningPathVisualizer = ({ userId }) => {
    const queryClient = useQueryClient();
    const [selectedStatus, setSelectedStatus] = useState('active');
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [selectedConcept, setSelectedConcept] = useState('');
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
        mutationFn: async (targetConceptId) => {
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
        onError: (error) => {
            const message = error.response?.data?.error || 'Failed to generate path';
            toast.error(message);
        },
    });
    const paths = pathsData?.paths || [];
    const concepts = conceptsData?.concepts || [];
    const masteryMap = new Map((masteryData?.mastery || []).map((m) => [m.concept_id, m.mastery_status]));
    const getStatusColor = (status) => {
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
    const getMasteryBadge = (conceptId) => {
        const status = masteryMap.get(conceptId);
        switch (status) {
            case 'mastered':
                return (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800", children: [_jsx(CheckCircle2, { className: "w-3 h-3" }), "Mastered"] }));
            case 'proficient':
                return (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800", children: [_jsx(TrendingUp, { className: "w-3 h-3" }), "Proficient"] }));
            case 'learning':
                return (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800", children: [_jsx(Circle, { className: "w-3 h-3" }), "Learning"] }));
            default:
                return (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800", children: [_jsx(Circle, { className: "w-3 h-3" }), "Not Started"] }));
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
        return (_jsx("div", { className: "flex items-center justify-center p-8", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }));
    }
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Target, { className: "w-6 h-6 text-purple-600" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Learning Paths" })] }), _jsxs("button", { onClick: () => setShowGenerateModal(true), className: "flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors", children: [_jsx(Sparkles, { className: "w-4 h-4" }), "Generate Path"] })] }), _jsx("div", { className: "flex gap-2 mb-6", children: ['active', 'completed', 'abandoned'].map((status) => (_jsx("button", { onClick: () => setSelectedStatus(status), className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedStatus === status
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: status.charAt(0).toUpperCase() + status.slice(1) }, status))) }), paths.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Target, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsxs("p", { className: "text-gray-600 mb-2", children: ["No ", selectedStatus, " learning paths"] }), _jsx("p", { className: "text-sm text-gray-500", children: "Generate a personalized learning path to reach your goals" })] })) : (_jsx("div", { className: "space-y-4", children: paths.map((path) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-5 hover:border-purple-300 transition-colors", children: [_jsx("div", { className: "flex items-start justify-between mb-4", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: path.target_concept_name || 'Learning Path' }), _jsx("span", { className: `px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(path.status)}`, children: path.status })] }), _jsx("div", { className: "flex items-center gap-1 mb-2", children: getMasteryBadge(path.target_concept_id) })] }) }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Progress" }), _jsxs("span", { className: "text-sm font-semibold text-purple-600", children: [path.progress_percentage, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-3", children: _jsx("div", { className: "bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500 flex items-center justify-end px-1", style: { width: `${path.progress_percentage}%` }, children: path.progress_percentage > 10 && (_jsx(CheckCircle2, { className: "w-3 h-3 text-white" })) }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { className: "bg-gray-50 rounded-lg p-3", children: [_jsx("p", { className: "text-xs text-gray-600 mb-1", children: "Steps" }), _jsxs("p", { className: "text-lg font-bold text-gray-900", children: [path.completed_steps || 0, " / ", path.step_count || 0] })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-3", children: [_jsx("p", { className: "text-xs text-gray-600 mb-1", children: "Started" }), _jsx("p", { className: "text-sm font-medium text-gray-900", children: new Date(path.created_at).toLocaleDateString() })] })] }), path.status === 'active' && (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors", children: "Continue Learning" }), _jsx("button", { className: "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors", children: "View Details" })] })), path.status === 'completed' && (_jsxs("div", { className: "flex items-center gap-2 text-green-600 font-medium", children: [_jsx(CheckCircle2, { className: "w-5 h-5" }), _jsx("span", { children: "Path Completed!" })] }))] }, path.id))) })), showGenerateModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Sparkles, { className: "w-6 h-6 text-purple-600" }), _jsx("h3", { className: "text-xl font-bold text-gray-900", children: "Generate Learning Path" })] }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Select a concept you want to master, and we'll create a personalized learning path based on your current knowledge." }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Target Concept" }), _jsxs("select", { value: selectedConcept, onChange: (e) => setSelectedConcept(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "Select a concept..." }), concepts.map((concept) => (_jsxs("option", { value: concept.id, children: [concept.name, " (", concept.cognitive_level, ")"] }, concept.id)))] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: handleGeneratePath, disabled: generatePathMutation.isPending || !selectedConcept, className: "flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors", children: generatePathMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 animate-spin" }), "Generating..."] })) : (_jsxs(_Fragment, { children: [_jsx(Sparkles, { className: "w-4 h-4" }), "Generate"] })) }), _jsx("button", { onClick: () => {
                                        setShowGenerateModal(false);
                                        setSelectedConcept('');
                                    }, disabled: generatePathMutation.isPending, className: "px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors", children: "Cancel" })] })] }) }))] }));
};
