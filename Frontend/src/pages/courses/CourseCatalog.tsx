import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Star,
  Users,
  Clock,
  TrendingUp,
  Award,
  BookOpen,
  ChevronRight,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { courseApi, Course, Category } from "../../api/course.api";
import { AppLayout } from "../../components/layout";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Skeleton,
  EmptyState,
} from "../../components/ui";
import { cn } from "../../lib/utils";

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [showFilters, setShowFilters] = useState(false);

  // Mock featured courses
  const featuredCourses = [
    {
      id: "1",
      title: "Complete Web Development Bootcamp 2024",
      instructor: "Dr. Angela Yu",
      rating: 4.9,
      students: 145230,
      price: 89.99,
      thumbnail:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
      badge: "Bestseller",
    },
    {
      id: "2",
      title: "The Complete JavaScript Course 2024",
      instructor: "Jonas Schmedtmann",
      rating: 4.8,
      students: 98500,
      price: 79.99,
      thumbnail:
        "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800",
      badge: "Highest Rated",
    },
    {
      id: "3",
      title: "React - The Complete Guide 2024",
      instructor: "Maximilian Schwarzmüller",
      rating: 4.9,
      students: 125000,
      price: 84.99,
      thumbnail:
        "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
      badge: "Most Popular",
    },
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadCourses();
  }, [
    selectedCategory,
    selectedLevel,
    selectedPrice,
    selectedRating,
    search,
    sortBy,
  ]);

  const loadCategories = async () => {
    try {
      const response = await courseApi.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await courseApi.listCourses({
        categoryId: selectedCategory || undefined,
        skillLevel: selectedLevel || undefined,
        search: search || undefined,
      });
      setCourses(response.data.data);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedLevel("");
    setSelectedPrice("");
    setSelectedRating("");
    setSearch("");
  };

  const hasActiveFilters =
    selectedCategory || selectedLevel || selectedPrice || selectedRating;

  return (
    <AppLayout showFooter={true}>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 mb-8 text-white shadow-xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Discover Your Next Skill
        </h1>
        <p className="text-primary-100 text-lg mb-6 max-w-2xl">
          Learn from industry experts with hands-on projects, AI tutoring, and
          peer collaboration
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="What do you want to learn?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-lg text-lg"
            />
          </div>
        </div>
      </div>

      {/* Featured Courses Carousel */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Courses</h2>
          <Link to="/courses/featured">
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCourses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="group"
            >
              <Card className="overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 h-full">
                <div className="relative">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="warning" className="font-semibold">
                      {course.badge}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {course.instructor}
                  </p>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center text-warning-600">
                      <Star className="w-4 h-4 fill-current mr-1" />
                      <span className="font-bold text-sm">{course.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({course.students.toLocaleString()} students)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      ${course.price}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">
            All Courses
            {courses.length > 0 && (
              <span className="text-gray-500 font-normal ml-2">
                ({courses.length} results)
              </span>
            )}
          </h2>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              icon={<X className="w-4 h-4" />}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Mobile Filter Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            icon={<SlidersHorizontal className="w-4 h-4" />}
            className="lg:hidden"
          >
            Filters
          </Button>

          {/* Sort Dropdown */}
          <Select
            options={[
              { value: "popular", label: "Most Popular" },
              { value: "newest", label: "Newest" },
              { value: "rating", label: "Highest Rated" },
              { value: "price-low", label: "Price: Low to High" },
              { value: "price-high", label: "Price: High to Low" },
            ]}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className={cn("lg:block", showFilters ? "block" : "hidden")}>
          <Card className="sticky top-4">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </h3>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <Select
                  options={[
                    { value: "", label: "All Categories" },
                    ...categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    })),
                  ]}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  fullWidth
                />
              </div>

              {/* Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Level
                </label>
                <Select
                  options={[
                    { value: "", label: "All Levels" },
                    { value: "beginner", label: "Beginner" },
                    { value: "intermediate", label: "Intermediate" },
                    { value: "advanced", label: "Advanced" },
                  ]}
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  fullWidth
                />
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <div className="space-y-2">
                  {[
                    { value: "", label: "All Prices" },
                    { value: "free", label: "Free" },
                    { value: "0-50", label: "Under $50" },
                    { value: "50-100", label: "$50 - $100" },
                    { value: "100+", label: "$100+" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="price"
                        value={option.value}
                        checked={selectedPrice === option.value}
                        onChange={(e) => setSelectedPrice(e.target.value)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="space-y-2">
                  {[
                    { value: "", label: "All Ratings" },
                    { value: "4.5", label: "4.5 & up" },
                    { value: "4.0", label: "4.0 & up" },
                    { value: "3.5", label: "3.5 & up" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="rating"
                        value={option.value}
                        checked={selectedRating === option.value}
                        onChange={(e) => setSelectedRating(e.target.value)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 flex items-center gap-1">
                        {option.value && (
                          <Star className="w-4 h-4 fill-warning-600 text-warning-600" />
                        )}
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses found"
              description="Try adjusting your filters or search query"
              action={
                hasActiveFilters
                  ? {
                      label: "Clear Filters",
                      onClick: clearFilters,
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course: any) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all h-full flex flex-col">
                    {course.coverImageUrl ? (
                      <img
                        src={course.coverImageUrl}
                        alt={course.title}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-white" />
                      </div>
                    )}

                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="info" className="text-xs">
                          {course.skillLevel || "Beginner"}
                        </Badge>
                      </div>

                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors flex-1">
                        {course.title}
                      </h3>

                      <p className="text-sm text-gray-600 mb-3">
                        {course.instructorName || "Instructor"}
                      </p>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center text-warning-600">
                          <Star className="w-4 h-4 fill-current mr-1" />
                          <span className="font-bold text-sm">
                            {course.avgRating?.toFixed(1) || "4.5"}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          ({course.enrollmentCount || 0} students)
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{course.duration || "8h"}</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                          {course.price ? `$${course.price}` : "Free"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trending Topics Section */}
      <div className="mt-16 pt-12 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Trending Topics
        </h2>
        <div className="flex flex-wrap gap-3">
          {[
            "React",
            "Python",
            "Machine Learning",
            "Web Development",
            "JavaScript",
            "Data Science",
            "AWS",
            "TypeScript",
            "Node.js",
            "Docker",
            "Kubernetes",
            "System Design",
          ].map((topic) => (
            <Link
              key={topic}
              to={`/courses?search=${topic}`}
              className="px-4 py-2 bg-gray-100 hover:bg-primary-50 text-gray-700 hover:text-primary-600 rounded-full text-sm font-medium transition-colors"
            >
              {topic}
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
