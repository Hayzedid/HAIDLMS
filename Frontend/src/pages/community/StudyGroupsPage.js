import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { studyGroupsApi } from "../../api/study-groups.api";
import { Users, Plus, MessageCircle } from "lucide-react";
export const StudyGroupsPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupData, setNewGroupData] = useState({
        name: "",
        description: "",
        subject: "",
        maxMembers: 10,
    });
    const { data: groups, isLoading } = useQuery({
        queryKey: ["study-groups", searchTerm],
        queryFn: () => studyGroupsApi.getAllGroups({ search: searchTerm }),
    });
    const joinMutation = useMutation({
        mutationFn: (groupId) => studyGroupsApi.joinGroup(groupId),
        onSuccess: () => {
            // Refetch groups to update isJoined status
            window.location.reload();
        },
    });
    const createMutation = useMutation({
        mutationFn: () => studyGroupsApi.createGroup(newGroupData),
        onSuccess: () => {
            setShowCreateModal(false);
            setNewGroupData({
                name: "",
                description: "",
                subject: "",
                maxMembers: 10,
            });
            window.location.reload();
        },
    });
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Study Groups" }), _jsx("p", { className: "text-gray-600", children: "Collaborate with peers and learn together" })] }), _jsxs("button", { onClick: () => setShowCreateModal(true), className: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition", children: [_jsx(Plus, { className: "w-5 h-5" }), "Create Group"] })] }), _jsx("div", { className: "mb-6", children: _jsx("input", { type: "text", placeholder: "Search groups by name or subject...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" }) }), isLoading ? (_jsx("div", { className: "text-center py-12", children: _jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) })) : !groups?.length ? (_jsx("div", { className: "bg-gray-100 rounded-lg p-12 text-center text-gray-600", children: "No groups found. Create one or search differently." })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: groups.map((group) => (_jsxs("div", { className: "bg-white rounded-lg shadow-md hover:shadow-lg transition", children: [group.avatarUrl && (_jsx("img", { src: group.avatarUrl, alt: group.name, className: "w-full h-32 object-cover" })), _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: group.name }), _jsx("p", { className: "text-gray-600 text-sm mb-3", children: group.description }), _jsxs("div", { className: "space-y-2 text-sm text-gray-600 mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Users, { className: "w-4 h-4" }), _jsxs("span", { children: [group.memberCount, "/", group.maxMembers, " members"] })] }), _jsx("div", { children: _jsx("span", { className: "inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium", children: group.subject }) })] }), _jsxs("p", { className: "text-xs text-gray-500 mb-4", children: ["by ", group.createdBy.name] }), group.isJoined ? (_jsxs("button", { className: "w-full bg-green-100 text-green-800 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2", children: [_jsx(MessageCircle, { className: "w-4 h-4" }), "Joined"] })) : (_jsx("button", { onClick: () => joinMutation.mutate(group.id), disabled: joinMutation.isPending, className: "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50", children: joinMutation.isPending ? "Joining..." : "Join Group" }))] })] }, group.id))) })), showCreateModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-md w-full mx-4", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Create Study Group" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Group Name" }), _jsx("input", { type: "text", value: newGroupData.name, onChange: (e) => setNewGroupData({ ...newGroupData, name: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "e.g., React Advanced Learners" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Description" }), _jsx("textarea", { value: newGroupData.description, onChange: (e) => setNewGroupData({
                                                    ...newGroupData,
                                                    description: e.target.value,
                                                }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "What's this group about?", rows: 3 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Subject" }), _jsx("input", { type: "text", value: newGroupData.subject, onChange: (e) => setNewGroupData({
                                                    ...newGroupData,
                                                    subject: e.target.value,
                                                }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "e.g., React, Web Development" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Max Members" }), _jsx("input", { type: "number", value: newGroupData.maxMembers, onChange: (e) => setNewGroupData({
                                                    ...newGroupData,
                                                    maxMembers: parseInt(e.target.value),
                                                }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", min: "2", max: "100" })] })] }), _jsxs("div", { className: "flex gap-3 mt-6", children: [_jsx("button", { onClick: () => setShowCreateModal(false), className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition", children: "Cancel" }), _jsx("button", { onClick: () => createMutation.mutate(), disabled: createMutation.isPending || !newGroupData.name, className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50", children: createMutation.isPending ? "Creating..." : "Create" })] })] }) }))] }) }));
};
export default StudyGroupsPage;
