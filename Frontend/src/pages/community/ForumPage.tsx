import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Plus,
  Search,
  TrendingUp,
  Clock,
  MessageCircle,
  Eye,
  ThumbsUp,
  Pin,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { AppLayout } from "../../components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Avatar,
  Input,
  Select,
  Tabs,
  Skeleton,
  EmptyState,
} from "../../components/ui";
import { cn, formatRelativeTime } from "../../lib/utils";

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  category: string;
  tags: string[];
  replies: number;
  views: number;
  likes: number;
  isPinned: boolean;
  isSolved: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  lastReply?: {
    author: string;
    time: string;
  };
}

interface Category {
  id: string;
  name: string;
  description: string;
  threadCount: number;
  color: string;
}

export default function ForumPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [activeTab, setActiveTab] = useState<
    "all" | "trending" | "unanswered" | "my-posts"
  >("all");
  const [threads, setThreads] = useState<ForumThread[]>([]);

  const categories: Category[] = [
    {
      id: "general",
      name: "General Discussion",
      description: "General topics and questions",
      threadCount: 245,
      color: "primary",
    },
    {
      id: "help",
      name: "Help & Support",
      description: "Get help with courses and platform",
      threadCount: 189,
      color: "warning",
    },
    {
      id: "code",
      name: "Code Review",
      description: "Share code and get feedback",
      threadCount: 156,
      color: "success",
    },
    {
      id: "projects",
      name: "Project Showcase",
      description: "Show off your projects",
      threadCount: 98,
      color: "accent",
    },
    {
      id: "career",
      name: "Career Advice",
      description: "Career guidance and opportunities",
      threadCount: 134,
      color: "info",
    },
  ];

  useEffect(() => {
    loadThreads();
  }, [activeTab, selectedCategory, sortBy, searchQuery]);

  const loadThreads = async () => {
    setLoading(true);
    try {
      // Mock data - would come from API
      const mockThreads: ForumThread[] = [
        {
          id: "1",
          title: "How to optimize React performance for large lists?",
          content:
            "I have a component rendering 10,000 items and it's really slow...",
          author: {
            id: "1",
            name: "Sarah Johnson",
            role: "Student",
          },
          category: "help",
          tags: ["react", "performance", "optimization"],
          replies: 12,
          views: 345,
          likes: 28,
          isPinned: false,
          isSolved: true,
          isLocked: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          lastReply: {
            author: "Michael Chen",
            time: "30 minutes ago",
          },
        },
        {
          id: "2",
          title: "Best practices for REST API design",
          content: "What are the best practices when designing a REST API?",
          author: {
            id: "2",
            name: "Alex Martinez",
            role: "Student",
          },
          category: "general",
          tags: ["api", "rest", "backend"],
          replies: 8,
          views: 456,
          likes: 42,
          isPinned: true,
          isSolved: false,
          isLocked: false,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          lastReply: {
            author: "Emily Davis",
            time: "1 hour ago",
          },
        },
        {
          id: "3",
          title: "Just finished my first full-stack project!",
          content:
            "After 6 months of learning, I finally built my first full-stack app...",
          author: {
            id: "3",
            name: "Jessica Lee",
            role: "Student",
          },
          category: "projects",
          tags: ["project", "fullstack", "milestone"],
          replies: 24,
          views: 789,
          likes: 156,
          isPinned: false,
          isSolved: false,
          isLocked: false,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          lastReply: {
            author: "David Kim",
            time: "2 hours ago",
          },
        },
        {
          id: "4",
          title: "TypeScript vs JavaScript: Which should I learn first?",
          content:
            "I'm new to programming and wondering if I should start with TS or JS...",
          author: {
            id: "4",
            name: "Chris Wilson",
            role: "Student",
          },
          category: "general",
          tags: ["typescript", "javascript", "beginner"],
          replies: 15,
          views: 567,
          likes: 34,
          isPinned: false,
          isSolved: false,
          isLocked: false,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          lastReply: {
            author: "Anna Rodriguez",
            time: "6 hours ago",
          },
        },
      ];

      setThreads(mockThreads);
    } catch (error) {
      console.error("Failed to load threads:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    const cat = categories.find((c) => c.id === category);
    switch (cat?.color) {
      case "warning":
        return "warning";
      case "success":
        return "success";
      case "danger":
        return "danger";
      default:
        return "info";
    }
  };

  const tabs = [
    { id: "all", label: "All Discussions" },
    {
      id: "trending",
      label: "Trending",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: "unanswered",
      label: "Unanswered",
      icon: <AlertCircle className="w-4 h-4" />,
    },
    { id: "my-posts", label: "My Posts" },
  ];

  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 mb-8 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Community Forum
              </h1>
              <p className="text-primary-100 text-lg">
                Ask questions, share knowledge, connect with peers
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => navigate("/forum/new")}
          >
            New Discussion
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Categories */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg transition-colors font-medium",
                  selectedCategory === "all"
                    ? "bg-primary-50 text-primary-700"
                    : "hover:bg-gray-50 text-gray-700",
                )}
              >
                <div className="flex items-center justify-between">
                  <span>All Categories</span>
                  <Badge variant="neutral" className="text-xs">
                    {categories.reduce((sum, cat) => sum + cat.threadCount, 0)}
                  </Badge>
                </div>
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg transition-colors",
                    selectedCategory === category.id
                      ? "bg-primary-50 text-primary-700"
                      : "hover:bg-gray-50 text-gray-700",
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="neutral" className="text-xs">
                      {category.threadCount}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {category.description}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Search discussions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                    fullWidth
                  />
                </div>

                <Select
                  options={[
                    { value: "recent", label: "Most Recent" },
                    { value: "popular", label: "Most Popular" },
                    { value: "unanswered", label: "Unanswered" },
                    { value: "solved", label: "Solved" },
                  ]}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sm:w-48"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div>
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={(tabId) => setActiveTab(tabId as any)}
              variant="underline"
            />
          </div>

          {/* Threads List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No discussions found"
              description="Be the first to start a discussion!"
              action={{
                label: "Start Discussion",
                onClick: () => navigate("/forum/new"),
              }}
            />
          ) : (
            <div className="space-y-4">
              {threads.map((thread) => (
                <Link key={thread.id} to={`/forum/${thread.id}`}>
                  <Card className="hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Author Avatar */}
                        <Avatar
                          name={thread.author.name}
                          src={thread.author.avatar}
                          size="md"
                        />

                        {/* Thread Content */}
                        <div className="flex-1 min-w-0">
                          {/* Title and Badges */}
                          <div className="flex items-start gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors flex-1">
                              {thread.isPinned && (
                                <Pin className="w-4 h-4 inline mr-2 text-warning-600" />
                              )}
                              {thread.title}
                              {thread.isSolved && (
                                <CheckCircle className="w-4 h-4 inline ml-2 text-success-600" />
                              )}
                            </h3>
                            <Badge
                              variant={getCategoryBadgeVariant(thread.category)}
                              className="flex-shrink-0"
                            >
                              {
                                categories.find((c) => c.id === thread.category)
                                  ?.name
                              }
                            </Badge>
                          </div>

                          {/* Author and Time */}
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <span className="font-medium">
                              {thread.author.name}
                            </span>
                            <span>•</span>
                            <span>
                              {formatRelativeTime(new Date(thread.createdAt))}
                            </span>
                            {thread.lastReply && (
                              <>
                                <span>•</span>
                                <span>
                                  Last reply by {thread.lastReply.author}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {thread.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 transition-colors"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <MessageCircle className="w-4 h-4" />
                              <span>{thread.replies} replies</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Eye className="w-4 h-4" />
                              <span>{thread.views} views</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{thread.likes} likes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
