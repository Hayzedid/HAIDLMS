import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { portfolioApi } from "../../api/portfolio.api";
import { Award, ExternalLink, Edit, Trash2, Plus } from "lucide-react";
export const PortfolioPage = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "project",
        sourceUrl: "",
        tags: [],
    });
    const { data: portfolio, isLoading, refetch, } = useQuery({
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
        mutationFn: (itemId) => portfolioApi.deleteItem(itemId),
        onSuccess: () => {
            setSelectedItem(null);
            refetch();
        },
    });
    const getCategoryColor = (category) => {
        const colors = {
            project: "bg-blue-100 text-blue-800",
            certificate: "bg-purple-100 text-purple-800",
            article: "bg-green-100 text-green-800",
            achievement: "bg-yellow-100 text-yellow-800",
        };
        return colors[category] || "bg-gray-100 text-gray-800";
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "My Portfolio" }), _jsx("p", { className: "text-gray-600", children: "Showcase your projects, certificates, and achievements" })] }), _jsxs("button", { onClick: () => {
                                setFormData({
                                    title: "",
                                    description: "",
                                    category: "project",
                                    sourceUrl: "",
                                    tags: [],
                                });
                                setShowAddModal(true);
                            }, className: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition", children: [_jsx(Plus, { className: "w-5 h-5" }), "Add Item"] })] }), isLoading ? (_jsx("div", { className: "text-center py-12", children: _jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) })) : !portfolio?.items?.length ? (_jsxs("div", { className: "bg-white rounded-lg shadow p-12 text-center text-gray-600", children: [_jsx(Award, { className: "w-16 h-16 mx-auto text-gray-300 mb-4" }), _jsx("p", { className: "text-lg", children: "No portfolio items yet. Start by adding your first project!" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: portfolio.items.map((item) => (_jsxs("div", { className: "bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden group", children: [item.imageUrl && (_jsx("div", { className: "relative overflow-hidden bg-gray-200 h-40", children: _jsx("img", { src: item.imageUrl, alt: item.title, className: "w-full h-full object-cover group-hover:scale-110 transition" }) })), _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("span", { className: `inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.category)}`, children: item.category }), _jsxs("div", { className: "flex gap-2 opacity-0 group-hover:opacity-100 transition", children: [_jsx("button", { onClick: () => {
                                                            setSelectedItem(item);
                                                            setFormData({
                                                                title: item.title,
                                                                description: item.description,
                                                                category: item.category,
                                                                sourceUrl: item.sourceUrl || "",
                                                                tags: item.tags || [],
                                                            });
                                                            setShowAddModal(true);
                                                        }, className: "p-1 hover:bg-blue-100 rounded transition", children: _jsx(Edit, { className: "w-4 h-4 text-blue-600" }) }), _jsx("button", { onClick: () => deleteMutation.mutate(item.id), className: "p-1 hover:bg-red-100 rounded transition", children: _jsx(Trash2, { className: "w-4 h-4 text-red-600" }) })] })] }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: item.title }), _jsx("p", { className: "text-gray-600 text-sm mb-3", children: item.description }), item.tags && item.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mb-3", children: item.tags.map((tag) => (_jsx("span", { className: "bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded", children: tag }, tag))) })), item.sourceUrl && (_jsxs("a", { href: item.sourceUrl, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium", children: ["View Project ", _jsx(ExternalLink, { className: "w-3 h-3" })] }))] })] }, item.id))) })), showAddModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: selectedItem ? "Edit Item" : "Add Portfolio Item" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Title" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Project title" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "Describe your work...", rows: 3 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Category" }), _jsxs("select", { value: formData.category, onChange: (e) => setFormData({ ...formData, category: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "project", children: "Project" }), _jsx("option", { value: "certificate", children: "Certificate" }), _jsx("option", { value: "article", children: "Article" }), _jsx("option", { value: "achievement", children: "Achievement" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Source URL" }), _jsx("input", { type: "url", value: formData.sourceUrl, onChange: (e) => setFormData({ ...formData, sourceUrl: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "https://github.com/yourrepo" })] })] }), _jsxs("div", { className: "flex gap-3 mt-6", children: [_jsx("button", { onClick: () => {
                                            setShowAddModal(false);
                                            setSelectedItem(null);
                                        }, className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition", children: "Cancel" }), _jsx("button", { onClick: () => addMutation.mutate(), disabled: addMutation.isPending || !formData.title, className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50", children: addMutation.isPending ? "Saving..." : "Save" })] })] }) }))] }) }));
};
export default PortfolioPage;
