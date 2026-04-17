import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { peerReviewApi } from '../../api/peer-review.api';
import { Users, Shuffle, TrendingUp, Award, CheckCircle, AlertCircle } from 'lucide-react';
export const ReviewerAssignment = ({ rubricId, submissionIds, onAssignmentComplete, }) => {
    const [rubric, setRubric] = useState(null);
    const [algorithm, setAlgorithm] = useState('random');
    const [reviewsPerSubmission, setReviewsPerSubmission] = useState(2);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [highQualityReviewers, setHighQualityReviewers] = useState([]);
    useEffect(() => {
        loadRubric();
        loadHighQualityReviewers();
    }, [rubricId]);
    const loadRubric = async () => {
        try {
            const data = await peerReviewApi.getRubric(rubricId);
            setRubric(data);
            setReviewsPerSubmission(data.minReviewsRequired);
        }
        catch (err) {
            setError(err.message || 'Failed to load rubric');
        }
    };
    const loadHighQualityReviewers = async () => {
        try {
            const data = await peerReviewApi.getHighQualityReviewers(10);
            setHighQualityReviewers(data);
        }
        catch (err) {
            // Non-critical error, just log it
            console.error('Failed to load high-quality reviewers:', err);
        }
    };
    const assignReviewers = async () => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');
            await peerReviewApi.assignReviewers(rubricId, {
                submissionIds,
                reviewsPerSubmission,
                algorithm,
            });
            setSuccess(`Successfully assigned ${reviewsPerSubmission} reviewers to ${submissionIds.length} submissions using ${algorithm} algorithm!`);
            if (onAssignmentComplete) {
                setTimeout(() => {
                    onAssignmentComplete();
                }, 2000);
            }
        }
        catch (err) {
            setError(err.message || 'Failed to assign reviewers');
        }
        finally {
            setLoading(false);
        }
    };
    const algorithmDescriptions = {
        'round-robin': 'Each student reviews the next submission in sequence. Ensures even distribution and prevents students from reviewing the same peers repeatedly.',
        random: 'Randomly assigns reviewers to submissions. Good for preventing bias and ensuring variety in review perspectives.',
        'quality-based': 'Prioritizes high-quality reviewers (based on past performance) for each submission. Ensures better feedback quality but may overload top reviewers.',
    };
    const totalReviewsNeeded = submissionIds.length * reviewsPerSubmission;
    if (!rubric) {
        return _jsx("div", { className: "text-center py-8", children: "Loading rubric..." });
    }
    return (_jsxs("div", { className: "max-w-4xl mx-auto p-6 space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-2", children: "Assign Peer Reviewers" }), _jsxs("p", { className: "text-gray-600", children: ["Configure and assign reviewers for ", _jsx("strong", { children: submissionIds.length }), " submissions using", ' ', _jsx("strong", { children: rubric.name })] }), error && (_jsxs("div", { className: "mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2", children: [_jsx(AlertCircle, { className: "w-5 h-5 flex-shrink-0 mt-0.5" }), _jsx("span", { children: error })] })), success && (_jsxs("div", { className: "mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-start gap-2", children: [_jsx(CheckCircle, { className: "w-5 h-5 flex-shrink-0 mt-0.5" }), _jsx("span", { children: success })] }))] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Assignment Configuration" }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Reviews Per Submission" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("input", { type: "range", min: "1", max: "5", value: reviewsPerSubmission, onChange: (e) => setReviewsPerSubmission(parseInt(e.target.value)), className: "flex-1" }), _jsx("div", { className: "flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-lg", children: _jsx("span", { className: "text-2xl font-bold text-indigo-700", children: reviewsPerSubmission }) })] }), _jsxs("p", { className: "text-sm text-gray-500 mt-2", children: ["Each submission will be reviewed by ", reviewsPerSubmission, " different", ' ', reviewsPerSubmission === 1 ? 'peer' : 'peers', ". Minimum required by rubric:", ' ', rubric.minReviewsRequired] }), reviewsPerSubmission < rubric.minReviewsRequired && (_jsxs("p", { className: "text-sm text-amber-600 mt-1 flex items-center gap-1", children: [_jsx(AlertCircle, { className: "w-4 h-4" }), "Warning: Below minimum required reviews"] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: "Assignment Algorithm" }), _jsx("div", { className: "space-y-3", children: [
                                            { value: 'round-robin', icon: Users, label: 'Round Robin', color: 'blue' },
                                            { value: 'random', icon: Shuffle, label: 'Random', color: 'purple' },
                                            { value: 'quality-based', icon: Award, label: 'Quality-Based', color: 'green' },
                                        ].map(({ value, icon: Icon, label, color }) => (_jsxs("button", { onClick: () => setAlgorithm(value), className: `w-full flex items-start gap-4 p-4 border-2 rounded-lg transition ${algorithm === value
                                                ? `border-${color}-600 bg-${color}-50`
                                                : 'border-gray-200 hover:border-gray-300'}`, children: [_jsx("div", { className: `w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center flex-shrink-0`, children: _jsx(Icon, { className: `w-6 h-6 text-${color}-600` }) }), _jsxs("div", { className: "flex-1 text-left", children: [_jsx("h4", { className: "font-semibold text-gray-800 mb-1", children: label }), _jsx("p", { className: "text-sm text-gray-600", children: algorithmDescriptions[value] })] }), _jsx("div", { className: "flex-shrink-0", children: algorithm === value && (_jsx("div", { className: `w-6 h-6 bg-${color}-600 rounded-full flex items-center justify-center`, children: _jsx("svg", { className: "w-4 h-4 text-white", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }) })) })] }, value))) })] }), algorithm === 'quality-based' && highQualityReviewers.length > 0 && (_jsxs("div", { className: "p-4 bg-green-50 border border-green-200 rounded-lg", children: [_jsxs("h4", { className: "font-semibold text-green-800 mb-2 flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-5 h-5" }), "Top Reviewers Available"] }), _jsx("p", { className: "text-sm text-green-700 mb-3", children: "These students will be prioritized in the quality-based assignment:" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: highQualityReviewers.slice(0, 6).map((reviewer, idx) => (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("span", { className: "w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold", children: idx + 1 }), _jsx("span", { className: "text-gray-700", children: reviewer.user_name || `Reviewer ${reviewer.user_id.slice(-6)}` }), _jsxs("span", { className: "text-green-600 ml-auto", children: [reviewer.avg_helpfulness_rating?.toFixed(1) || 'N/A', "\u2605"] })] }, reviewer.user_id))) })] })), _jsxs("div", { className: "grid grid-cols-3 gap-4 pt-4 border-t", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: submissionIds.length }), _jsx("p", { className: "text-sm text-gray-600", children: "Submissions" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-2xl font-bold text-indigo-600", children: totalReviewsNeeded }), _jsx("p", { className: "text-sm text-gray-600", children: "Total Reviews" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-2xl font-bold text-purple-600", children: Math.ceil(totalReviewsNeeded / submissionIds.length) }), _jsx("p", { className: "text-sm text-gray-600", children: "Reviews/Student" })] })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-4", children: "Rubric Settings" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsx("span", { className: "text-gray-600", children: "Anonymous Reviewers:" }), _jsx("span", { className: "font-semibold text-gray-900", children: rubric.anonymizeReviewers ? 'Yes' : 'No' })] }), _jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsx("span", { className: "text-gray-600", children: "Anonymous Authors:" }), _jsx("span", { className: "font-semibold text-gray-900", children: rubric.anonymizeCodeAuthors ? 'Yes' : 'No' })] }), _jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsx("span", { className: "text-gray-600", children: "MOSS Collusion Check:" }), _jsx("span", { className: "font-semibold text-gray-900", children: rubric.runMossCheck ? 'Enabled' : 'Disabled' })] }), _jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsx("span", { className: "text-gray-600", children: "Similarity Threshold:" }), _jsxs("span", { className: "font-semibold text-gray-900", children: [rubric.mossSimilarityThreshold, "%"] })] })] })] }), _jsx("button", { onClick: assignReviewers, disabled: loading || reviewsPerSubmission < rubric.minReviewsRequired, className: "w-full py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-b-2 border-white" }), _jsx("span", { children: "Assigning Reviewers..." })] })) : (_jsxs(_Fragment, { children: [_jsx(Users, { className: "w-6 h-6" }), _jsxs("span", { children: ["Assign Reviewers (", algorithm, ")"] })] })) }), reviewsPerSubmission < rubric.minReviewsRequired && (_jsxs("p", { className: "text-center text-sm text-amber-600", children: ["Please set reviews per submission to at least ", rubric.minReviewsRequired, " (rubric minimum)"] }))] }));
};
