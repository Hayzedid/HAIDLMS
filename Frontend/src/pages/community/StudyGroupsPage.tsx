import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { studyGroupsApi } from "../../api/study-groups.api";
import { Users, Plus, MessageCircle, Calendar } from "lucide-react";

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  maxMembers: number;
  subject: string;
  createdBy: { name: string };
  createdAt: string;
  isJoined: boolean;
  avatarUrl?: string;
}

export const StudyGroupsPage: React.FC = () => {
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
    mutationFn: (groupId: string) => studyGroupsApi.joinGroup(groupId),
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Study Groups
            </h1>
            <p className="text-gray-600">
              Collaborate with peers and learn together
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            Create Group
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search groups by name or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Groups Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !groups?.length ? (
          <div className="bg-gray-100 rounded-lg p-12 text-center text-gray-600">
            No groups found. Create one or search differently.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group: any) => (
              <div
                key={group.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition"
              >
                {group.avatarUrl && (
                  <img
                    src={group.avatarUrl}
                    alt={group.name}
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {group.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {group.description}
                  </p>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {group.memberCount}/{group.maxMembers} members
                      </span>
                    </div>
                    <div>
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {group.subject}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    by {group.createdBy.name}
                  </p>

                  {group.isJoined ? (
                    <button className="w-full bg-green-100 text-green-800 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Joined
                    </button>
                  ) : (
                    <button
                      onClick={() => joinMutation.mutate(group.id)}
                      disabled={joinMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                    >
                      {joinMutation.isPending ? "Joining..." : "Join Group"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Create Study Group</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newGroupData.name}
                    onChange={(e) =>
                      setNewGroupData({ ...newGroupData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., React Advanced Learners"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newGroupData.description}
                    onChange={(e) =>
                      setNewGroupData({
                        ...newGroupData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What's this group about?"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={newGroupData.subject}
                    onChange={(e) =>
                      setNewGroupData({
                        ...newGroupData,
                        subject: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., React, Web Development"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Members
                  </label>
                  <input
                    type="number"
                    value={newGroupData.maxMembers}
                    onChange={(e) =>
                      setNewGroupData({
                        ...newGroupData,
                        maxMembers: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="2"
                    max="100"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !newGroupData.name}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyGroupsPage;
