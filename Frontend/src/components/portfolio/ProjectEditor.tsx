import React, { useState, useEffect } from 'react';
import {
  Code, Plus, Edit2, Trash2, Save, X, ExternalLink, Github,
  Upload, Star, Calendar, Check, AlertTriangle
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';

interface Project {
  id?: string;
  title: string;
  description: string;
  detailedDescription?: string;
  projectType?: string;
  liveUrl?: string;
  repositoryUrl?: string;
  thumbnailUrl?: string;
  technologies: string[];
  skillsDemonstrated?: string[];
  keyFeatures?: string[];
  challengesOvercome?: string;
  lessonsLearned?: string;
  isFeatured?: boolean;
  isPublic?: boolean;
  completedAt?: string;
}

export const ProjectEditor: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
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

  const handleEdit = (project: Project) => {
    setEditingProject({ ...project });
    setShowForm(true);
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/portfolio/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(projects.filter((p) => p.id !== projectId));
      setSuccessMessage('Project deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleSave = async () => {
    if (!editingProject) return;

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
        const response = await axios.put(
          `${API_URL}/api/portfolio/projects/${editingProject.id}`,
          editingProject,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProjects(
          projects.map((p) => (p.id === editingProject.id ? response.data.data : p))
        );
      } else {
        // Create new
        const response = await axios.post(
          `${API_URL}/api/portfolio/projects`,
          editingProject,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProjects([...projects, response.data.data]);
      }

      setShowForm(false);
      setEditingProject(null);
      setSuccessMessage(
        editingProject.id ? 'Project updated successfully' : 'Project created successfully'
      );
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const addTechnology = () => {
    if (!techInput.trim() || !editingProject) return;
    if (editingProject.technologies.includes(techInput.trim())) return;

    setEditingProject({
      ...editingProject,
      technologies: [...editingProject.technologies, techInput.trim()],
    });
    setTechInput('');
  };

  const removeTechnology = (tech: string) => {
    if (!editingProject) return;
    setEditingProject({
      ...editingProject,
      technologies: editingProject.technologies.filter((t) => t !== tech),
    });
  };

  const addSkill = () => {
    if (!skillInput.trim() || !editingProject) return;
    if (editingProject.skillsDemonstrated?.includes(skillInput.trim())) return;

    setEditingProject({
      ...editingProject,
      skillsDemonstrated: [...(editingProject.skillsDemonstrated || []), skillInput.trim()],
    });
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    if (!editingProject) return;
    setEditingProject({
      ...editingProject,
      skillsDemonstrated: editingProject.skillsDemonstrated?.filter((s) => s !== skill),
    });
  };

  const addFeature = () => {
    if (!featureInput.trim() || !editingProject) return;

    setEditingProject({
      ...editingProject,
      keyFeatures: [...(editingProject.keyFeatures || []), featureInput.trim()],
    });
    setFeatureInput('');
  };

  const removeFeature = (index: number) => {
    if (!editingProject) return;
    setEditingProject({
      ...editingProject,
      keyFeatures: editingProject.keyFeatures?.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Code className="w-7 h-7" />
              Portfolio Projects
            </h1>
            <p className="text-gray-600 mt-1">
              Showcase your best work and development projects
            </p>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 flex items-center gap-2">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {error && !showForm && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Project List */}
      {!showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-md">
              <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-4">
                Start showcasing your work by adding your first project
              </p>
              <button
                onClick={handleNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
                Add Project
              </button>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                {project.thumbnailUrl && (
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{project.title}</h3>
                    <div className="flex gap-2">
                      {project.isFeatured && (
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      )}
                      {!project.isPublic && (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                          Private
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.technologies.slice(0, 4).map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 4 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        +{project.technologies.length - 4} more
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => project.id && handleDelete(project.id)}
                      className="flex items-center justify-center gap-1 px-3 py-2 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Project Form */}
      {showForm && editingProject && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">
              {editingProject.id ? 'Edit Project' : 'New Project'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingProject(null);
                setError('');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              value={editingProject.title}
              onChange={(e) =>
                setEditingProject({ ...editingProject, title: e.target.value })
              }
              placeholder="My Awesome Project"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description *
            </label>
            <textarea
              value={editingProject.description}
              onChange={(e) =>
                setEditingProject({ ...editingProject, description: e.target.value })
              }
              placeholder="A brief description of your project (1-2 sentences)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Description
            </label>
            <textarea
              value={editingProject.detailedDescription || ''}
              onChange={(e) =>
                setEditingProject({
                  ...editingProject,
                  detailedDescription: e.target.value,
                })
              }
              placeholder="Provide more details about your project, its purpose, and how it works..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <ExternalLink className="w-4 h-4 inline mr-1" />
                Live Demo URL
              </label>
              <input
                type="url"
                value={editingProject.liveUrl || ''}
                onChange={(e) =>
                  setEditingProject({ ...editingProject, liveUrl: e.target.value })
                }
                placeholder="https://myproject.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Github className="w-4 h-4 inline mr-1" />
                Repository URL
              </label>
              <input
                type="url"
                value={editingProject.repositoryUrl || ''}
                onChange={(e) =>
                  setEditingProject({ ...editingProject, repositoryUrl: e.target.value })
                }
                placeholder="https://github.com/user/repo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Upload className="w-4 h-4 inline mr-1" />
              Thumbnail Image URL
            </label>
            <input
              type="url"
              value={editingProject.thumbnailUrl || ''}
              onChange={(e) =>
                setEditingProject({ ...editingProject, thumbnailUrl: e.target.value })
              }
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Technologies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technologies Used *
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                placeholder="e.g., React, Node.js, PostgreSQL"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={addTechnology}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editingProject.technologies.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full flex items-center gap-2"
                >
                  {tech}
                  <button onClick={() => removeTechnology(tech)}>
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Skills Demonstrated */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills Demonstrated
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="e.g., API Design, State Management"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={addSkill}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editingProject.skillsDemonstrated?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-2"
                >
                  {skill}
                  <button onClick={() => removeSkill(skill)}>
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Features
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                placeholder="e.g., Real-time notifications"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={addFeature}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <ul className="space-y-2">
              {editingProject.keyFeatures?.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                  <span className="flex-1">{feature}</span>
                  <button onClick={() => removeFeature(idx)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Challenges & Learnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Challenges Overcome
              </label>
              <textarea
                value={editingProject.challengesOvercome || ''}
                onChange={(e) =>
                  setEditingProject({
                    ...editingProject,
                    challengesOvercome: e.target.value,
                  })
                }
                placeholder="What obstacles did you face and how did you solve them?"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lessons Learned
              </label>
              <textarea
                value={editingProject.lessonsLearned || ''}
                onChange={(e) =>
                  setEditingProject({ ...editingProject, lessonsLearned: e.target.value })
                }
                placeholder="What did you learn from this project?"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 border-t pt-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={editingProject.isFeatured}
                onChange={(e) =>
                  setEditingProject({ ...editingProject, isFeatured: e.target.checked })
                }
                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <div>
                <div className="font-medium text-gray-800">Feature this project</div>
                <div className="text-sm text-gray-600">Show at the top of your portfolio</div>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={editingProject.isPublic}
                onChange={(e) =>
                  setEditingProject({ ...editingProject, isPublic: e.target.checked })
                }
                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <div>
                <div className="font-medium text-gray-800">Make project public</div>
                <div className="text-sm text-gray-600">
                  Display on your public portfolio
                </div>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingProject(null);
                setError('');
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
