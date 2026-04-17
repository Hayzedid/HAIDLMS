import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  User, MapPin, Globe, Linkedin, Github, Mail, Award, Code, BookOpen,
  Calendar, TrendingUp, Star, ExternalLink, Eye
} from 'lucide-react';
import axios from 'axios';
import { BadgeShowcase } from '../../components/badges';

interface PortfolioData {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  settings: {
    displayName: string;
    headline: string;
    bio: string;
    avatarUrl: string;
    location: string;
    linkedinUrl?: string;
    githubUrl?: string;
    personalWebsite?: string;
    emailPublic?: string;
    themeColor: string;
    viewCount: number;
  };
  projects: Array<{
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    technologies: string[];
    liveUrl?: string;
    repositoryUrl?: string;
    completedAt: string;
    peerReviewRating?: number;
  }>;
  skills: Array<{
    skillName: string;
    proficiencyLevel: string;
    proficiencyScore: number;
    endorsedByPeers: number;
  }>;
  activity: Array<{
    id: string;
    activityType: string;
    activityTitle: string;
    activityDate: string;
    iconName: string;
    iconColor: string;
  }>;
  stats: {
    totalCourses: number;
    totalProjects: number;
    totalBadges: number;
    totalSkills: number;
  };
}

const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';

export const PublicPortfolio: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'skills' | 'activity' | 'badges'>('projects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPortfolio();
    trackView();
  }, [username]);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/portfolio/${username}`);
      setPortfolio(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Portfolio not found');
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    try {
      await axios.post(`${API_URL}/api/portfolio/${username}/view`, {
        referrer: document.referrer,
      });
    } catch (err) {
      // Silent fail
    }
  };

  const getProficiencyColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-blue-500',
      intermediate: 'bg-green-500',
      advanced: 'bg-purple-500',
      expert: 'bg-red-500',
    };
    return colors[level] || colors.beginner;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Portfolio Not Found</h2>
          <p className="text-gray-600">{error || 'This portfolio does not exist or is not public.'}</p>
        </div>
      </div>
    );
  }

  const { user, settings, projects, skills, activity, stats } = portfolio;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div
        className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white py-16"
        style={{ backgroundColor: settings.themeColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="relative">
              {settings.avatarUrl ? (
                <img
                  src={settings.avatarUrl}
                  alt={settings.displayName}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white bg-white/20 flex items-center justify-center">
                  <User className="w-16 h-16" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white"></div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">{settings.displayName}</h1>
              {settings.headline && (
                <p className="text-xl text-white/90 mb-4">{settings.headline}</p>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-white/80 justify-center md:justify-start">
                {settings.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{settings.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{settings.viewCount.toLocaleString()} views</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-3 mt-4 justify-center md:justify-start">
                {settings.linkedinUrl && (
                  <a
                    href={settings.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {settings.githubUrl && (
                  <a
                    href={settings.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {settings.personalWebsite && (
                  <a
                    href={settings.personalWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
                {settings.emailPublic && (
                  <a
                    href={`mailto:${settings.emailPublic}`}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{stats.totalCourses}</div>
                <div className="text-sm text-white/80">Courses</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{stats.totalProjects}</div>
                <div className="text-sm text-white/80">Projects</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{stats.totalBadges}</div>
                <div className="text-sm text-white/80">Badges</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{stats.totalSkills}</div>
                <div className="text-sm text-white/80">Skills</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {settings.bio && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              About
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{settings.bio}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { key: 'projects', label: 'Projects', icon: Code, count: projects.length },
                { key: 'skills', label: 'Skills', icon: TrendingUp, count: skills.length },
                { key: 'badges', label: 'Badges', icon: Award, count: stats.totalBadges },
                { key: 'activity', label: 'Activity', icon: Calendar, count: activity.length },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition ${
                      activeTab === tab.key
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No projects yet</p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <div key={project.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                      {project.thumbnailUrl && (
                        <img
                          src={project.thumbnailUrl}
                          alt={project.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{project.title}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>

                        {/* Technologies */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {project.technologies.slice(0, 4).map((tech, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded">
                              {tech}
                            </span>
                          ))}
                        </div>

                        {/* Links */}
                        <div className="flex gap-2">
                          {project.liveUrl && (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Live Demo
                            </a>
                          )}
                          {project.repositoryUrl && (
                            <a
                              href={project.repositoryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                            >
                              <Github className="w-4 h-4" />
                              Code
                            </a>
                          )}
                        </div>

                        {/* Rating */}
                        {project.peerReviewRating && (
                          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-gray-600">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{project.peerReviewRating.toFixed(1)} peer rating</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skills.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No skills recorded</p>
                  </div>
                ) : (
                  skills.map((skill, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{skill.skillName}</h4>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded uppercase">
                          {skill.proficiencyLevel}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProficiencyColor(skill.proficiencyLevel)}`}
                            style={{ width: `${skill.proficiencyScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Endorsements */}
                      {skill.endorsedByPeers > 0 && (
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{skill.endorsedByPeers} endorsement{skill.endorsedByPeers !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Badges Tab */}
            {activeTab === 'badges' && (
              <BadgeShowcase userId={user.id} />
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                {activity.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No activity yet</p>
                  </div>
                ) : (
                  activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: item.iconColor + '20' }}
                      >
                        <BookOpen className="w-5 h-5" style={{ color: item.iconColor }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{item.activityTitle}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(item.activityDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
