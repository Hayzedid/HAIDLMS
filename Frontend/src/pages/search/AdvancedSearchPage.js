import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { courseApi } from "../../api/course.api";
import { Search, Filter, Star, Users, Clock } from "lucide-react";
export const AdvancedSearchPage = () => {
    const [filters, setFilters] = useState({
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
    return (_jsx("div", { className: "min-h-screen bg-gray-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Advanced Course Search" }), _jsx("p", { className: "text-gray-600", children: "Find the perfect course for your learning journey" })] }), _jsx("div", { className: "bg-white rounded-lg shadow-md p-6 mb-8", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: filters.query, onChange: (e) => setFilters({ ...filters, query: e.target.value }), placeholder: "Search courses, instructors, topics...", className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsxs("button", { className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2", children: [_jsx(Search, { className: "w-4 h-4" }), " Search"] })] }) }), _jsxs("div", { className: "flex gap-6", children: [showFilters && (_jsx("div", { className: "w-64 flex-shrink-0", children: _jsxs("div", { className: "bg-white rounded-lg shadow p-6 sticky top-4", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-4", children: "Filters" }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Category" }), _jsxs("select", { value: filters.category, onChange: (e) => setFilters({ ...filters, category: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "All Categories" }), categories.map((cat) => (_jsx("option", { value: cat, children: cat }, cat)))] })] }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Level" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "level", value: "", checked: filters.level === "", onChange: () => setFilters({ ...filters, level: "" }) }), _jsx("span", { className: "ml-2 text-sm text-gray-700", children: "All Levels" })] }), levels.map((level) => (_jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "radio", name: "level", checked: filters.level === level, onChange: () => setFilters({ ...filters, level: level }) }), _jsx("span", { className: "ml-2 text-sm text-gray-700 capitalize", children: level })] }, level)))] })] }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Minimum Rating" }), _jsxs("select", { value: filters.rating, onChange: (e) => setFilters({
                                                    ...filters,
                                                    rating: parseFloat(e.target.value),
                                                }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "0", children: "All Ratings" }), _jsx("option", { value: "4", children: "4+ \u2B50" }), _jsx("option", { value: "4.5", children: "4.5+ \u2B50" }), _jsx("option", { value: "5", children: "5 \u2B50" })] })] }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Price Range" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "number", min: "0", max: "500", value: filters.priceRange[0], onChange: (e) => setFilters({
                                                            ...filters,
                                                            priceRange: [
                                                                parseInt(e.target.value),
                                                                filters.priceRange[1],
                                                            ],
                                                        }), placeholder: "Min", className: "w-1/2 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" }), _jsx("input", { type: "number", min: "0", max: "500", value: filters.priceRange[1], onChange: (e) => setFilters({
                                                            ...filters,
                                                            priceRange: [
                                                                filters.priceRange[0],
                                                                parseInt(e.target.value),
                                                            ],
                                                        }), placeholder: "Max", className: "w-1/2 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Sort By" }), _jsxs("select", { value: filters.sortBy, onChange: (e) => setFilters({ ...filters, sortBy: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "relevance", children: "Relevance" }), _jsx("option", { value: "popularity", children: "Most Popular" }), _jsx("option", { value: "rating", children: "Highest Rated" }), _jsx("option", { value: "newest", children: "Newest" }), _jsx("option", { value: "price", children: "Price: Low to High" })] })] })] }) })), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("button", { onClick: () => setShowFilters(!showFilters), className: "flex items-center gap-2 text-gray-600 hover:text-gray-900", children: [_jsx(Filter, { className: "w-5 h-5" }), showFilters ? "Hide Filters" : "Show Filters"] }), _jsxs("p", { className: "text-gray-600", children: [results?.length || 0, " ", results?.length === 1 ? "course" : "courses", " found"] })] }), isLoading ? (_jsx("div", { className: "text-center py-12", children: _jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) })) : !filters.query ? (_jsxs("div", { className: "bg-white rounded-lg shadow p-12 text-center text-gray-600", children: [_jsx(Search, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("p", { children: "Enter a search query to find courses" })] })) : results?.length === 0 ? (_jsx("div", { className: "bg-white rounded-lg shadow p-12 text-center text-gray-600", children: _jsx("p", { children: "No courses found matching your criteria" }) })) : (_jsx("div", { className: "space-y-4", children: results?.map((course) => (_jsx("div", { className: "bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "w-48 h-32 bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0" }), _jsxs("div", { className: "flex-1 p-4 flex flex-col justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: course.title }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: course.description })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex gap-6 text-sm text-gray-600", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Star, { className: "w-4 h-4 text-yellow-500" }), " ", course.rating || 0] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Users, { className: "w-4 h-4" }), " ", course.enrollmentCount || 0, " students"] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-4 h-4" }), " ", course.duration || 0, " hours"] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { className: "text-xl font-bold text-gray-900", children: ["$", (course.priceCents
                                                                                    ? course.priceCents / 100
                                                                                    : 0).toFixed(2)] }), _jsx("button", { className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium", children: "Enroll" })] })] })] })] }) }, course.id))) }))] })] })] }) }));
};
export default AdvancedSearchPage;
