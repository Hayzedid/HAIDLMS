import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { messagingApi } from "../../api/messaging.api";
import { Send, Search, Plus, X } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const MessagingPage: React.FC = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);

  const { data: conversations, isLoading: convLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagingApi.getConversations(),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const { data: messages, isLoading: msgLoading } = useQuery({
    queryKey: ["messages", selectedConversationId],
    queryFn: () =>
      selectedConversationId
        ? messagingApi.getMessages(selectedConversationId)
        : Promise.resolve([]),
    enabled: !!selectedConversationId,
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      selectedConversationId
        ? messagingApi.sendMessage(selectedConversationId, newMessage)
        : Promise.reject("No conversation selected"),
    onSuccess: () => {
      setNewMessage("");
      // Refetch messages
    },
  });

  const filteredConversations = (conversations || []).filter(
    (conv: Conversation) =>
      conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <button
              onClick={() => setShowNewConversation(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {convLoading ? (
            <div className="p-4 text-center text-gray-600">
              Loading conversations...
            </div>
          ) : !filteredConversations.length ? (
            <div className="p-4 text-center text-gray-600">
              No conversations
            </div>
          ) : (
            filteredConversations.map((conv: Conversation) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversationId(conv.id)}
                className={`w-full p-4 text-left border-b border-gray-200 hover:bg-gray-50 transition ${
                  selectedConversationId === conv.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {conv.participantAvatar && (
                    <img
                      src={conv.participantAvatar}
                      alt={conv.participantName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conv.participantName}
                      </h3>
                      {conv.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conv.lastMessage}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {conv.lastMessageTime}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="hidden md:flex flex-1 flex-col">
        {selectedConversationId ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {
                    conversations?.find(
                      (c: Conversation) => c.id === selectedConversationId,
                    )?.participantName
                  }
                </h2>
              </div>
              <button
                onClick={() => setSelectedConversationId(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
              {msgLoading ? (
                <div className="text-center text-gray-600">
                  Loading messages...
                </div>
              ) : !messages?.length ? (
                <div className="text-center text-gray-600">No messages yet</div>
              ) : (
                messages.map((msg: Message) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === "currentUser" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.senderId === "currentUser"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-900 border border-gray-200"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${msg.senderId === "currentUser" ? "text-blue-100" : "text-gray-500"}`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && newMessage.trim()) {
                      sendMutation.mutate();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => sendMutation.mutate()}
                  disabled={sendMutation.isPending || !newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            Select a conversation to start messaging
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Start New Conversation</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search User
              </label>
              <input
                type="text"
                placeholder="Enter name or email..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewConversation(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                Start Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingPage;
