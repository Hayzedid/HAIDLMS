import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Code, Plus, Edit2, Trash2, Save, X, ExternalLink, Github, Upload, Star, Check, AlertTriangle } from 'lucide-react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';
export const ProjectEditor = () => {
    const [projects, setProjects] = useState([]);
    const [editingProject, setEditingProject] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [techInput, setTechInput] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [featureInput, setFeatureInput] = useState('');
    useEffect(() => {
        loadProjects();
    }, []);
    const loadProjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/portfolio/projects`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProjects(response.data.data);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to load projects');
        }
        finally {
            setLoading(false);
        }
    };
    const handleNew = () => {
        setEditingProject({
            title: '',
            description: '',
            detailedDescription: '',
            projectType: 'personal',
            liveUrl: '',
            repositoryUrl: '',
            thumbnailUrl: '',
            technologies: [],
            skillsDemonstrated: [],
            keyFeatures: [],
            challengesOvercome: '',
            lessonsLearned: '',
            isFeatured: false,
            isPublic: true,
        });
        setShowForm(true);
    };
    const handleEdit = (project) => {
        setEditingProject({ ...project });
        setShowForm(true);
    };
    const handleDelete = async (projectId) => {
        if (!confirm('Are you sure you want to delete this project?'))
            return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/portfolio/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProjects(projects.filter((p) => p.id !== projectId));
            setSuccessMessage('Project deleted successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to delete project');
        }
    };
    const handleSave = async () => {
        if (!editingProject)
            return;
        // Validation
        if (!editingProject.title.trim()) {
            setError('Project title is required');
            return;
        }
        if (!editingProject.description.trim()) {
            setError('Project description is required');
            return;
        }
        if (editingProject.technologies.length === 0) {
            setError('Add at least one technology');
            return;
        }
        try {
            setSaving(true);
            setError('');
            const token = localStorage.getItem('token');
            if (editingProject.id) {
                // Update existing
                const response = await axios.put(`${API_URL}/api/portfolio/projects/${editingProject.id}`, editingProject, { headers: { Authorization: `Bearer ${token}` } });
                setProjects(projects.map((p) => (p.id === editingProject.id ? response.data.data : p)));
            }
            else {
                // Create new
                const response = await axios.post(`${API_URL}/api/portfolio/projects`, editingProject, { headers: { Authorization: `Bearer ${token}` } });
                setProjects([...projects, response.data.data]);
            }
            setShowForm(false);
            setEditingProject(null);
            setSuccessMessage(editingProject.id ? 'Project updated successfully' : 'Project created successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to save project');
        }
        finally {
            setSaving(false);
        }
    };
    const addTechnology = () => {
        if (!techInput.trim() || !editingProject)
            return;
        if (editingProject.technologies.includes(techInput.trim()))
            return;
        setEditingProject({
            ...editingProject,
            technologies: [...editingProject.technologies, techInput.trim()],
        });
        setTechInput('');
    };
    const removeTechnology = (tech) => {
        if (!editingProject)
            return;
        setEditingProject({
            ...editingProject,
            technologies: editingProject.technologies.filter((t) => t !== tech),
        });
    };
    const addSkill = () => {
        if (!skillInput.trim() || !editingProject)
            return;
        if (editingProject.skillsDemonstrated?.includes(skillInput.trim()))
            return;
        setEditingProject({
            ...editingProject,
            skillsDemonstrated: [...(editingProject.skillsDemonstrated || []), skillInput.trim()],
        });
        setSkillInput('');
    };
    const removeSkill = (skill) => {
        if (!editingProject)
            return;
        setEditingProject({
            ...editingProject,
            skillsDemonstrated: editingProject.skillsDemonstrated?.filter((s) => s !== skill),
        });
    };
    const addFeature = () => {
        if (!featureInput.trim() || !editingProject)
            return;
        setEditingProject({
            ...editingProject,
            keyFeatures: [...(editingProject.keyFeatures || []), featureInput.trim()],
        });
        setFeatureInput('');
    };
    const removeFeature = (index) => {
        if (!editingProject)
            return;
        setEditingProject({
            ...editingProject,
            keyFeatures: editingProject.keyFeatures?.filter((_, i) => i !== index),
        });
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" }) }));
    }
    return (_jsxs("div", { className: "max-w-6xl mx-auto p-6 space-y-6", children: [_jsx("div", { className: "bg-white rounded-lg shadow-md p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-gray-800 flex items-center gap-2", children: [_jsx(Code, { className: "w-7 h-7" }), "Portfolio Projects"] }), _jsx("p", { className: "text-gray-600 mt-1", children: "Showcase your best work and development projects" })] }), _jsxs("button", { onClick: handleNew, className: "flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700", children: [_jsx(Plus, { className: "w-5 h-5" }), "New Project"] })] }) }), successMessage && (_jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 flex items-center gap-2", children: [_jsx(Check, { className: "w-5 h-5" }), successMessage] })), error && !showForm && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center justify-between", children: [_jsx("span", { children: error }), _jsx("button", { onClick: () => setError(''), children: _jsx(X, { className: "w-5 h-5" }) })] })), !showForm && (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: projects.length === 0 ? (_jsxs("div", { className: "col-span-full text-center py-12 bg-white rounded-lg shadow-md", children: [_jsx(Code, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-700 mb-2", children: "No projects yet" }), _jsx("p", { className: "text-gray-500 mb-4", children: "Start showcasing your work by adding your first project" }), _jsxs("button", { onClick: handleNew, className: "inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700", children: [_jsx(Plus, { className: "w-5 h-5" }), "Add Project"] })] })) : (projects.map((project) => (_jsxs("div", { className: "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition", children: [project.thumbnailUrl && (_jsx("img", { src: project.thumbnailUrl, alt: project.title, className: "w-full h-48 object-cover" })), _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx("h3", { className: "text-lg font-bold text-gray-800", children: project.title }), _jsxs("div", { className: "flex gap-2", children: [project.isFeatured && (_jsx(Star, { className: "w-5 h-5 text-yellow-500 fill-current" })), !project.isPublic && (_jsx("span", { className: "px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded", children: "Private" }))] })] }), _jsx("p", { className: "text-sm text-gray-600 mb-3 line-clamp-2", children: project.description }), _jsxs("div", { className: "flex flex-wrap gap-1 mb-3", children: [project.technologies.slice(0, 4).map((tech, idx) => (_jsx("span", { className: "px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded", children: tech }, idx))), project.technologies.length > 4 && (_jsxs("span", { className: "px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded", children: ["+", project.technologies.length - 4, " more"] }))] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => handleEdit(project), className: "flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700", children: [_jsx(Edit2, { className: "w-4 h-4" }), "Edit"] }), _jsx("button", { onClick: () => project.id && handleDelete(project.id), className: "flex items-center justify-center gap-1 px-3 py-2 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] })] }, project.id)))) })), showForm && editingProject && (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between pb-4 border-b", children: [_jsx("h2", { className: "text-xl font-bold text-gray-800", children: editingProject.id ? 'Edit Project' : 'New Project' }), _jsx("button", { onClick: () => {
                                    setShowForm(false);
                                    setEditingProject(null);
                                    setError('');
                                }, className: "text-gray-500 hover:text-gray-700", children: _jsx(X, { className: "w-6 h-6" }) })] }), error && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-start gap-2", children: [_jsx(AlertTriangle, { className: "w-5 h-5 flex-shrink-0 mt-0.5" }), _jsx("span", { children: error })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Project Title *" }), _jsx("input", { type: "text", value: editingProject.title, onChange: (e) => setEditingProject({ ...editingProject, title: e.target.value }), placeholder: "My Awesome Project", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Short Description *" }), _jsx("textarea", { value: editingProject.description, onChange: (e) => setEditingProject({ ...editingProject, description: e.target.value }), placeholder: "A brief description of your project (1-2 sentences)", rows: 2, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Detailed Description" }), _jsx("textarea", { value: editingProject.detailedDescription || '', onChange: (e) => setEditingProject({
                                    ...editingProject,
                                    detailedDescription: e.target.value,
                                }), placeholder: "Provide more details about your project, its purpose, and how it works...", rows: 4, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [_jsx(ExternalLink, { className: "w-4 h-4 inline mr-1" }), "Live Demo URL"] }), _jsx("input", { type: "url", value: editingProject.liveUrl || '', onChange: (e) => setEditingProject({ ...editingProject, liveUrl: e.target.value }), placeholder: "https://myproject.com", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [_jsx(Github, { className: "w-4 h-4 inline mr-1" }), "Repository URL"] }), _jsx("input", { type: "url", value: editingProject.repositoryUrl || '', onChange: (e) => setEditingProject({ ...editingProject, repositoryUrl: e.target.value }), placeholder: "https://github.com/user/repo", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [_jsx(Upload, { className: "w-4 h-4 inline mr-1" }), "Thumbnail Image URL"] }), _jsx("input", { type: "url", value: editingProject.thumbnailUrl || '', onChange: (e) => setEditingProject({ ...editingProject, thumbnailUrl: e.target.value }), placeholder: "https://example.com/image.jpg", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Technologies Used *" }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx("input", { type: "text", value: techInput, onChange: (e) => setTechInput(e.target.value), onKeyPress: (e) => e.key === 'Enter' && (e.preventDefault(), addTechnology()), placeholder: "e.g., React, Node.js, PostgreSQL", className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" }), _jsx("button", { onClick: addTechnology, className: "px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700", children: "Add" })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: editingProject.technologies.map((tech, idx) => (_jsxs("span", { className: "px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full flex items-center gap-2", children: [tech, _jsx("button", { onClick: () => removeTechnology(tech), children: _jsx(X, { className: "w-4 h-4" }) })] }, idx))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Skills Demonstrated" }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx("input", { type: "text", value: skillInput, onChange: (e) => setSkillInput(e.target.value), onKeyPress: (e) => e.key === 'Enter' && (e.preventDefault(), addSkill()), placeholder: "e.g., API Design, State Management", className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" }), _jsx("button", { onClick: addSkill, className: "px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700", children: "Add" })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: editingProject.skillsDemonstrated?.map((skill, idx) => (_jsxs("span", { className: "px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-2", children: [skill, _jsx("button", { onClick: () => removeSkill(skill), children: _jsx(X, { className: "w-4 h-4" }) })] }, idx))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Key Features" }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx("input", { type: "text", value: featureInput, onChange: (e) => setFeatureInput(e.target.value), onKeyPress: (e) => e.key === 'Enter' && (e.preventDefault(), addFeature()), placeholder: "e.g., Real-time notifications", className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" }), _jsx("button", { onClick: addFeature, className: "px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700", children: "Add" })] }), _jsx("ul", { className: "space-y-2", children: editingProject.keyFeatures?.map((feature, idx) => (_jsxs("li", { className: "flex items-start gap-2 p-2 bg-gray-50 rounded", children: [_jsx("span", { className: "flex-1", children: feature }), _jsx("button", { onClick: () => removeFeature(idx), children: _jsx(Trash2, { className: "w-4 h-4 text-red-500" }) })] }, idx))) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Challenges Overcome" }), _jsx("textarea", { value: editingProject.challengesOvercome || '', onChange: (e) => setEditingProject({
                                            ...editingProject,
                                            challengesOvercome: e.target.value,
                                        }), placeholder: "What obstacles did you face and how did you solve them?", rows: 4, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Lessons Learned" }), _jsx("textarea", { value: editingProject.lessonsLearned || '', onChange: (e) => setEditingProject({ ...editingProject, lessonsLearned: e.target.value }), placeholder: "What did you learn from this project?", rows: 4, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" })] })] }), _jsxs("div", { className: "space-y-3 border-t pt-4", children: [_jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", checked: editingProject.isFeatured, onChange: (e) => setEditingProject({ ...editingProject, isFeatured: e.target.checked }), className: "w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-800", children: "Feature this project" }), _jsx("div", { className: "text-sm text-gray-600", children: "Show at the top of your portfolio" })] })] }), _jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", checked: editingProject.isPublic, onChange: (e) => setEditingProject({ ...editingProject, isPublic: e.target.checked }), className: "w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-800", children: "Make project public" }), _jsx("div", { className: "text-sm text-gray-600", children: "Display on your public portfolio" })] })] })] }), _jsxs("div", { className: "flex justify-end gap-3 border-t pt-4", children: [_jsx("button", { onClick: () => {
                                    setShowForm(false);
                                    setEditingProject(null);
                                    setError('');
                                }, className: "px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50", children: "Cancel" }), _jsxs("button", { onClick: handleSave, disabled: saving, className: "flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed", children: [_jsx(Save, { className: "w-5 h-5" }), saving ? 'Saving...' : 'Save Project'] })] })] }))] }));
};
