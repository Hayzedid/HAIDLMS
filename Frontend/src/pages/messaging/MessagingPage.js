import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { messagingApi } from "../../api/messaging.api";
import { Send, Search, Plus, X } from "lucide-react";
export const MessagingPage = () => {
    const [selectedConversationId, setSelectedConversationId] = useState(null);
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
        queryFn: () => selectedConversationId
            ? messagingApi.getMessages(selectedConversationId)
            : Promise.resolve([]),
        enabled: !!selectedConversationId,
    });
    const sendMutation = useMutation({
        mutationFn: () => selectedConversationId
            ? messagingApi.sendMessage(selectedConversationId, newMessage)
            : Promise.reject("No conversation selected"),
        onSuccess: () => {
            setNewMessage("");
            // Refetch messages
        },
    });
    const filteredConversations = (conversations || []).filter((conv) => conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()));
    return (_jsxs("div", { className: "flex h-screen bg-gray-100", children: [_jsxs("div", { className: "w-full md:w-80 bg-white border-r border-gray-200 flex flex-col", children: [_jsxs("div", { className: "p-4 border-b border-gray-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Messages" }), _jsx("button", { onClick: () => setShowNewConversation(true), className: "p-2 hover:bg-gray-100 rounded-lg transition", children: _jsx(Plus, { className: "w-5 h-5 text-gray-600" }) })] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 w-4 h-4 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search conversations...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: convLoading ? (_jsx("div", { className: "p-4 text-center text-gray-600", children: "Loading conversations..." })) : !filteredConversations.length ? (_jsx("div", { className: "p-4 text-center text-gray-600", children: "No conversations" })) : (filteredConversations.map((conv) => (_jsx("button", { onClick: () => setSelectedConversationId(conv.id), className: `w-full p-4 text-left border-b border-gray-200 hover:bg-gray-50 transition ${selectedConversationId === conv.id ? "bg-blue-50" : ""}`, children: _jsxs("div", { className: "flex items-center gap-3", children: [conv.participantAvatar && (_jsx("img", { src: conv.participantAvatar, alt: conv.participantName, className: "w-10 h-10 rounded-full object-cover" })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("h3", { className: "font-semibold text-gray-900 truncate", children: conv.participantName }), conv.unreadCount > 0 && (_jsx("span", { className: "bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full", children: conv.unreadCount }))] }), _jsx("p", { className: "text-sm text-gray-600 truncate", children: conv.lastMessage }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: conv.lastMessageTime })] })] }) }, conv.id)))) })] }), _jsx("div", { className: "hidden md:flex flex-1 flex-col", children: selectedConversationId ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-white border-b border-gray-200 p-4 flex items-center justify-between", children: [_jsx("div", { children: _jsx("h2", { className: "text-lg font-bold text-gray-900", children: conversations?.find((c) => c.id === selectedConversationId)?.participantName }) }), _jsx("button", { onClick: () => setSelectedConversationId(null), className: "p-2 hover:bg-gray-100 rounded-lg transition", children: _jsx(X, { className: "w-5 h-5 text-gray-600" }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4", children: msgLoading ? (_jsx("div", { className: "text-center text-gray-600", children: "Loading messages..." })) : !messages?.length ? (_jsx("div", { className: "text-center text-gray-600", children: "No messages yet" })) : (messages.map((msg) => (_jsx("div", { className: `flex ${msg.senderId === "currentUser" ? "justify-end" : "justify-start"}`, children: _jsxs("div", { className: `max-w-xs px-4 py-2 rounded-lg ${msg.senderId === "currentUser"
                                        ? "bg-blue-600 text-white"
                                        : "bg-white text-gray-900 border border-gray-200"}`, children: [_jsx("p", { className: "text-sm", children: msg.content }), _jsx("p", { className: `text-xs mt-1 ${msg.senderId === "currentUser" ? "text-blue-100" : "text-gray-500"}`, children: new Date(msg.timestamp).toLocaleTimeString() })] }) }, msg.id)))) }), _jsx("div", { className: "bg-white border-t border-gray-200 p-4", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: newMessage, onChange: (e) => setNewMessage(e.target.value), onKeyPress: (e) => {
                                            if (e.key === "Enter" && newMessage.trim()) {
                                                sendMutation.mutate();
                                            }
                                        }, placeholder: "Type a message...", className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("button", { onClick: () => sendMutation.mutate(), disabled: sendMutation.isPending || !newMessage.trim(), className: "bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition disabled:opacity-50", children: _jsx(Send, { className: "w-5 h-5" }) })] }) })] })) : (_jsx("div", { className: "flex items-center justify-center h-full text-gray-600", children: "Select a conversation to start messaging" })) }), showNewConversation && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-md w-full mx-4", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Start New Conversation" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Search User" }), _jsx("input", { type: "text", placeholder: "Enter name or email...", className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex gap-3 mt-6", children: [_jsx("button", { onClick: () => setShowNewConversation(false), className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition", children: "Cancel" }), _jsx("button", { className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition", children: "Start Chat" })] })] }) }))] }));
};
export default MessagingPage;
