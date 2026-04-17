import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { courseApi } from "../../api/course.api";
import { Search, Filter, Star, Users, Clock, DollarSign } from "lucide-react";

interface SearchFilters {
  query: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced" | "";
  rating: number;
  priceRange: [number, number];
  instructor: string;
  sortBy: "relevance" | "popularity" | "rating" | "newest" | "price";
}

export const AdvancedSearchPage: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "",
    level: "",
    rating: 0,
    priceRange: [0, 500],
    instructor: "",
    sortBy: "relevance",
  });

  const [showFilters, setShowFilters] = useState(true);

  const { data: results, isLoading } = useQuery({
    queryKey: ["courseSearch", filters],
    queryFn: () => courseApi.searchCourses(filters),
    enabled: filters.query.length > 0,
  });

  const categories = [
    "Development",
    "Design",
    "Business",
    "Science",
    "Languages",
  ];
  const levels = ["beginner", "intermediate", "advanced"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Advanced Course Search
          </h1>
          <p className="text-gray-600">
            Find the perfect course for your learning journey
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={filters.query}
              onChange={(e) =>
                setFilters({ ...filters, query: e.target.value })
              }
              placeholder="Search courses, instructors, topics..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2">
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          {showFilters && (
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>

                {/* Category */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      setFilters({ ...filters, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="level"
                        value=""
                        checked={filters.level === ""}
                        onChange={() => setFilters({ ...filters, level: "" })}
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        All Levels
                      </span>
                    </label>
                    {levels.map((level) => (
                      <label key={level} className="flex items-center">
                        <input
                          type="radio"
                          name="level"
                          checked={filters.level === level}
                          onChange={() =>
                            setFilters({ ...filters, level: level as any })
                          }
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {level}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.rating}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        rating: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0">All Ratings</option>
                    <option value="4">4+ ⭐</option>
                    <option value="4.5">4.5+ ⭐</option>
                    <option value="5">5 ⭐</option>
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={filters.priceRange[0]}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          priceRange: [
                            parseInt(e.target.value),
                            filters.priceRange[1],
                          ],
                        })
                      }
                      placeholder="Min"
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={filters.priceRange[1]}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          priceRange: [
                            filters.priceRange[0],
                            parseInt(e.target.value),
                          ],
                        })
                      }
                      placeholder="Max"
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters({ ...filters, sortBy: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="popularity">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                    <option value="newest">Newest</option>
                    <option value="price">Price: Low to High</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <Filter className="w-5 h-5" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
              <p className="text-gray-600">
                {results?.length || 0}{" "}
                {results?.length === 1 ? "course" : "courses"} found
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : !filters.query ? (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p>Enter a search query to find courses</p>
              </div>
            ) : results?.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
                <p>No courses found matching your criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results?.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                  >
                    <div className="flex">
                      <div className="w-48 h-32 bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0" />
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {course.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-6 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />{" "}
                              {course.rating || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />{" "}
                              {course.enrollmentCount || 0} students
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />{" "}
                              {course.duration || 0} hours
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xl font-bold text-gray-900">
                              $
                              {(course.priceCents
                                ? course.priceCents / 100
                                : 0
                              ).toFixed(2)}
                            </span>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                              Enroll
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchPage;
