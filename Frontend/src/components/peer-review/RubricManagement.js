import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { peerReviewApi, } from '../../api/peer-review.api';
import { Plus, X } from 'lucide-react';
export const RubricManagement = ({ courseId, assessmentId, onRubricCreated }) => {
    const [rubrics, setRubrics] = useState([]);
    const [selectedRubric, setSelectedRubric] = useState(null);
    const [criteria, setCriteria] = useState([]);
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
        }
        catch (err) {
            setError(err.message || 'Failed to load rubrics');
        }
        finally {
            setLoading(false);
        }
    };
    const loadCriteria = async (rubricId) => {
        try {
            const data = await peerReviewApi.getRubricCriteria(rubricId);
            setCriteria(data);
        }
        catch (err) {
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
            if (onRubricCreated)
                onRubricCreated(newRubric);
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
        }
        catch (err) {
            setError(err.message || 'Failed to create rubric');
        }
        finally {
            setLoading(false);
        }
    };
    const addCriterion = async () => {
        if (!selectedRubric)
            return;
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
        }
        catch (err) {
            setError(err.message || 'Failed to add criterion');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6 space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800", children: "Peer Review Rubrics" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Create and manage review rubrics for your course" })] }), _jsxs("button", { onClick: () => setIsCreatingRubric(true), className: "flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700", children: [_jsx(Plus, { className: "w-5 h-5" }), "New Rubric"] })] }), error && (_jsx("div", { className: "mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700", children: error })), success && (_jsx("div", { className: "mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700", children: success }))] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("h3", { className: "text-lg font-semibold mb-4", children: ["Rubrics (", rubrics.length, ")"] }), loading && rubrics.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-500", children: "Loading rubrics..." })) : rubrics.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-500", children: "No rubrics yet. Create one to get started." })) : (_jsx("div", { className: "space-y-2", children: rubrics.map(rubric => (_jsxs("button", { onClick: () => setSelectedRubric(rubric), className: `w-full text-left p-4 rounded-lg border-2 transition ${selectedRubric?.id === rubric.id
                                        ? 'border-indigo-600 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300'}`, children: [_jsx("h4", { className: "font-semibold text-gray-800", children: rubric.name }), _jsx("p", { className: "text-sm text-gray-600 mt-1 line-clamp-2", children: rubric.description || 'No description' }), _jsxs("div", { className: "flex items-center gap-4 mt-2 text-xs text-gray-500", children: [_jsxs("span", { children: [rubric.minReviewsRequired, " reviews required"] }), rubric.isActive ? (_jsx("span", { className: "px-2 py-1 bg-green-100 text-green-700 rounded", children: "Active" })) : (_jsx("span", { className: "px-2 py-1 bg-gray-100 text-gray-600 rounded", children: "Inactive" }))] })] }, rubric.id))) }))] }), _jsxs("div", { className: "lg:col-span-2 space-y-6", children: [isCreatingRubric && (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Create New Rubric" }), _jsx("button", { onClick: () => setIsCreatingRubric(false), className: "text-gray-500 hover:text-gray-700", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Rubric Name *" }), _jsx("input", { type: "text", value: rubricForm.name, onChange: (e) => setRubricForm({ ...rubricForm, name: e.target.value }), placeholder: "e.g., Assignment 1 Peer Review", className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Description" }), _jsx("textarea", { value: rubricForm.description, onChange: (e) => setRubricForm({ ...rubricForm, description: e.target.value }), placeholder: "Describe what this rubric evaluates...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg", rows: 3 })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Min Reviews Required" }), _jsx("input", { type: "number", min: "1", max: "10", value: rubricForm.minReviewsRequired, onChange: (e) => setRubricForm({ ...rubricForm, minReviewsRequired: parseInt(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "MOSS Threshold (%)" }), _jsx("input", { type: "number", min: "0", max: "100", value: rubricForm.mossSimilarityThreshold, onChange: (e) => setRubricForm({ ...rubricForm, mossSimilarityThreshold: parseInt(e.target.value) }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: rubricForm.anonymizeReviewers, onChange: (e) => setRubricForm({ ...rubricForm, anonymizeReviewers: e.target.checked }), className: "w-4 h-4" }), _jsx("span", { className: "text-sm text-gray-700", children: "Anonymize reviewers" })] }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: rubricForm.anonymizeCodeAuthors, onChange: (e) => setRubricForm({ ...rubricForm, anonymizeCodeAuthors: e.target.checked }), className: "w-4 h-4" }), _jsx("span", { className: "text-sm text-gray-700", children: "Anonymize code authors" })] }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: rubricForm.runMossCheck, onChange: (e) => setRubricForm({ ...rubricForm, runMossCheck: e.target.checked }), className: "w-4 h-4" }), _jsx("span", { className: "text-sm text-gray-700", children: "Run MOSS collusion check" })] }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: rubricForm.allowSelfReview, onChange: (e) => setRubricForm({ ...rubricForm, allowSelfReview: e.target.checked }), className: "w-4 h-4" }), _jsx("span", { className: "text-sm text-gray-700", children: "Allow self-review" })] })] }), _jsx("button", { onClick: createRubric, disabled: !rubricForm.name || loading, className: "w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300", children: loading ? 'Creating...' : 'Create Rubric' })] })] })), selectedRubric && !isCreatingRubric && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: selectedRubric.name }), _jsx("p", { className: "text-gray-600 mb-4", children: selectedRubric.description }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Min Reviews:" }), _jsx("span", { className: "ml-2 font-semibold", children: selectedRubric.minReviewsRequired })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "MOSS Threshold:" }), _jsxs("span", { className: "ml-2 font-semibold", children: [selectedRubric.mossSimilarityThreshold, "%"] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "Anonymous Reviewers:" }), _jsx("span", { className: "ml-2 font-semibold", children: selectedRubric.anonymizeReviewers ? 'Yes' : 'No' })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-600", children: "MOSS Check:" }), _jsx("span", { className: "ml-2 font-semibold", children: selectedRubric.runMossCheck ? 'Enabled' : 'Disabled' })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "text-lg font-semibold", children: ["Evaluation Criteria (", criteria.length, ")"] }), _jsxs("button", { onClick: () => setIsAddingCriterion(true), className: "flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700", children: [_jsx(Plus, { className: "w-4 h-4" }), "Add Criterion"] })] }), isAddingCriterion && (_jsx("div", { className: "mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg", children: _jsxs("div", { className: "space-y-3", children: [_jsx("input", { type: "text", value: criterionForm.name, onChange: (e) => setCriterionForm({ ...criterionForm, name: e.target.value }), placeholder: "Criterion name (e.g., Code Quality)", className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" }), _jsx("textarea", { value: criterionForm.description, onChange: (e) => setCriterionForm({ ...criterionForm, description: e.target.value }), placeholder: "Description (what to evaluate)", className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm", rows: 2 }), _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsx("input", { type: "number", min: "1", max: "10", value: criterionForm.maxScore, onChange: (e) => setCriterionForm({ ...criterionForm, maxScore: parseInt(e.target.value) }), placeholder: "Max score", className: "px-3 py-2 border border-gray-300 rounded-lg text-sm" }), _jsx("input", { type: "number", min: "0.1", max: "5", step: "0.1", value: criterionForm.weight, onChange: (e) => setCriterionForm({ ...criterionForm, weight: parseFloat(e.target.value) }), placeholder: "Weight", className: "px-3 py-2 border border-gray-300 rounded-lg text-sm" }), _jsxs("label", { className: "flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white", children: [_jsx("input", { type: "checkbox", checked: criterionForm.isRequired, onChange: (e) => setCriterionForm({ ...criterionForm, isRequired: e.target.checked }), className: "w-4 h-4" }), "Required"] })] }), _jsx("input", { type: "text", value: criterionForm.examples, onChange: (e) => setCriterionForm({ ...criterionForm, examples: e.target.value }), placeholder: "Examples (optional)", className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: () => setIsAddingCriterion(false), className: "px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg", children: "Cancel" }), _jsx("button", { onClick: addCriterion, disabled: !criterionForm.name || !criterionForm.description || loading, className: "px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300", children: "Add" })] })] }) })), criteria.length === 0 ? (_jsx("div", { className: "text-center py-8 text-gray-500", children: "No criteria yet. Add evaluation criteria to complete the rubric." })) : (_jsx("div", { className: "space-y-3", children: criteria.map((criterion, idx) => (_jsx("div", { className: "p-4 border border-gray-200 rounded-lg", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "font-semibold text-gray-800", children: [idx + 1, ". ", criterion.name] }), criterion.isRequired && (_jsx("span", { className: "px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded", children: "Required" }))] }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: criterion.description }), criterion.examples && (_jsxs("p", { className: "text-xs text-gray-500 mt-1 italic", children: ["Examples: ", criterion.examples] }))] }), _jsxs("div", { className: "text-right text-sm", children: [_jsxs("div", { className: "text-gray-600", children: ["Max: ", criterion.maxScore] }), _jsxs("div", { className: "text-gray-500", children: ["Weight: ", criterion.weight, "x"] })] })] }) }, criterion.id))) }))] })] }))] })] })] }));
};
