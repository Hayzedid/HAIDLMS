import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { portfolioApi } from "../../api/portfolio.api";
import { Award, ExternalLink, Edit, Trash2, Plus } from "lucide-react";

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  sourceUrl?: string;
  tags: string[];
  createdAt: string;
}

export const PortfolioPage: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "project",
    sourceUrl: "",
    tags: [] as string[],
  });

  const {
    data: portfolio,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["portfolio"],
    queryFn: portfolioApi.getMyPortfolio,
  });

  const addMutation = useMutation({
    mutationFn: () => portfolioApi.addItem(formData),
    onSuccess: () => {
      setShowAddModal(false);
      setFormData({
        title: "",
        description: "",
        category: "project",
        sourceUrl: "",
        tags: [],
      });
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => portfolioApi.deleteItem(itemId),
    onSuccess: () => {
      setSelectedItem(null);
      refetch();
    },
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      project: "bg-blue-100 text-blue-800",
      certificate: "bg-purple-100 text-purple-800",
      article: "bg-green-100 text-green-800",
      achievement: "bg-yellow-100 text-yellow-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Portfolio
            </h1>
            <p className="text-gray-600">
              Showcase your projects, certificates, and achievements
            </p>
          </div>
          <button
            onClick={() => {
              setFormData({
                title: "",
                description: "",
                category: "project",
                sourceUrl: "",
                tags: [],
              });
              setShowAddModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>

        {/* Portfolio Items */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !portfolio?.items?.length ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
            <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg">
              No portfolio items yet. Start by adding your first project!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.items.map((item: any) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden group"
              >
                {item.imageUrl && (
                  <div className="relative overflow-hidden bg-gray-200 h-40">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.category)}`}
                    >
                      {item.category}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setFormData({
                            title: item.title,
                            description: item.description,
                            category: item.category,
                            sourceUrl: item.sourceUrl || "",
                            tags: item.tags || [],
                          });
                          setShowAddModal(true);
                        }}
                        className="p-1 hover:bg-blue-100 rounded transition"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="p-1 hover:bg-red-100 rounded transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {item.description}
                  </p>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.tags.map((tag: any) => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Project <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {selectedItem ? "Edit Item" : "Add Portfolio Item"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Project title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your work..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="project">Project</option>
                    <option value="certificate">Certificate</option>
                    <option value="article">Article</option>
                    <option value="achievement">Achievement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source URL
                  </label>
                  <input
                    type="url"
                    value={formData.sourceUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, sourceUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://github.com/yourrepo"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedItem(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addMutation.mutate()}
                  disabled={addMutation.isPending || !formData.title}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {addMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;
