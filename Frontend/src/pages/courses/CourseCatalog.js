import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Star, Clock, BookOpen, ChevronRight, X, SlidersHorizontal, } from "lucide-react";
import { courseApi } from "../../api/course.api";
import { AppLayout } from "../../components/layout";
import { Card, CardContent, Button, Badge, Select, Skeleton, EmptyState, } from "../../components/ui";
import { cn } from "../../lib/utils";
export default function CourseCatalog() {
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
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
            thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
            badge: "Bestseller",
        },
        {
            id: "2",
            title: "The Complete JavaScript Course 2024",
            instructor: "Jonas Schmedtmann",
            rating: 4.8,
            students: 98500,
            price: 79.99,
            thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800",
            badge: "Highest Rated",
        },
        {
            id: "3",
            title: "React - The Complete Guide 2024",
            instructor: "Maximilian Schwarzmüller",
            rating: 4.9,
            students: 125000,
            price: 84.99,
            thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error("Failed to load courses:", error);
        }
        finally {
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
    const hasActiveFilters = selectedCategory || selectedLevel || selectedPrice || selectedRating;
    return (_jsxs(AppLayout, { showFooter: true, children: [_jsxs("div", { className: "bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 mb-8 text-white shadow-xl", children: [_jsx("h1", { className: "text-3xl md:text-4xl font-bold mb-4", children: "Discover Your Next Skill" }), _jsx("p", { className: "text-primary-100 text-lg mb-6 max-w-2xl", children: "Learn from industry experts with hands-on projects, AI tutoring, and peer collaboration" }), _jsx("div", { className: "max-w-2xl", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "What do you want to learn?", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-lg text-lg" })] }) })] }), _jsxs("div", { className: "mb-12", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Featured Courses" }), _jsx(Link, { to: "/courses/featured", children: _jsxs(Button, { variant: "ghost", size: "sm", children: ["View All", _jsx(ChevronRight, { className: "w-4 h-4 ml-1" })] }) })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: featuredCourses.map((course) => (_jsx(Link, { to: `/courses/${course.id}`, className: "group", children: _jsxs(Card, { className: "overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 h-full", children: [_jsxs("div", { className: "relative", children: [_jsx("img", { src: course.thumbnail, alt: course.title, className: "w-full h-48 object-cover" }), _jsx("div", { className: "absolute top-3 left-3", children: _jsx(Badge, { variant: "warning", className: "font-semibold", children: course.badge }) })] }), _jsxs(CardContent, { className: "p-4", children: [_jsx("h3", { className: "font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors", children: course.title }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: course.instructor }), _jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsxs("div", { className: "flex items-center text-warning-600", children: [_jsx(Star, { className: "w-4 h-4 fill-current mr-1" }), _jsx("span", { className: "font-bold text-sm", children: course.rating })] }), _jsxs("span", { className: "text-sm text-gray-500", children: ["(", course.students.toLocaleString(), " students)"] })] }), _jsx("div", { className: "flex items-center justify-between", children: _jsxs("span", { className: "text-2xl font-bold text-gray-900", children: ["$", course.price] }) })] })] }) }, course.id))) })] }), _jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("h2", { className: "text-xl font-bold text-gray-900", children: ["All Courses", courses.length > 0 && (_jsxs("span", { className: "text-gray-500 font-normal ml-2", children: ["(", courses.length, " results)"] }))] }), hasActiveFilters && (_jsx(Button, { variant: "ghost", size: "sm", onClick: clearFilters, icon: _jsx(X, { className: "w-4 h-4" }), children: "Clear Filters" }))] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3 w-full sm:w-auto", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => setShowFilters(!showFilters), icon: _jsx(SlidersHorizontal, { className: "w-4 h-4" }), className: "lg:hidden", children: "Filters" }), _jsx(Select, { options: [
                                    { value: "popular", label: "Most Popular" },
                                    { value: "newest", label: "Newest" },
                                    { value: "rating", label: "Highest Rated" },
                                    { value: "price-low", label: "Price: Low to High" },
                                    { value: "price-high", label: "Price: High to Low" },
                                ], value: sortBy, onChange: (e) => setSortBy(e.target.value), className: "w-full sm:w-48" })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-8", children: [_jsx("div", { className: cn("lg:block", showFilters ? "block" : "hidden"), children: _jsx(Card, { className: "sticky top-4", children: _jsxs(CardContent, { className: "p-6 space-y-6", children: [_jsx("div", { children: _jsxs("h3", { className: "font-semibold text-gray-900 mb-3 flex items-center gap-2", children: [_jsx(Filter, { className: "w-4 h-4" }), "Filters"] }) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Category" }), _jsx(Select, { options: [
                                                    { value: "", label: "All Categories" },
                                                    ...categories.map((cat) => ({
                                                        value: cat.id,
                                                        label: cat.name,
                                                    })),
                                                ], value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), fullWidth: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Skill Level" }), _jsx(Select, { options: [
                                                    { value: "", label: "All Levels" },
                                                    { value: "beginner", label: "Beginner" },
                                                    { value: "intermediate", label: "Intermediate" },
                                                    { value: "advanced", label: "Advanced" },
                                                ], value: selectedLevel, onChange: (e) => setSelectedLevel(e.target.value), fullWidth: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Price" }), _jsx("div", { className: "space-y-2", children: [
                                                    { value: "", label: "All Prices" },
                                                    { value: "free", label: "Free" },
                                                    { value: "0-50", label: "Under $50" },
                                                    { value: "50-100", label: "$50 - $100" },
                                                    { value: "100+", label: "$100+" },
                                                ].map((option) => (_jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [_jsx("input", { type: "radio", name: "price", value: option.value, checked: selectedPrice === option.value, onChange: (e) => setSelectedPrice(e.target.value), className: "text-primary-600 focus:ring-primary-500" }), _jsx("span", { className: "text-sm text-gray-700", children: option.label })] }, option.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Rating" }), _jsx("div", { className: "space-y-2", children: [
                                                    { value: "", label: "All Ratings" },
                                                    { value: "4.5", label: "4.5 & up" },
                                                    { value: "4.0", label: "4.0 & up" },
                                                    { value: "3.5", label: "3.5 & up" },
                                                ].map((option) => (_jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [_jsx("input", { type: "radio", name: "rating", value: option.value, checked: selectedRating === option.value, onChange: (e) => setSelectedRating(e.target.value), className: "text-primary-600 focus:ring-primary-500" }), _jsxs("span", { className: "text-sm text-gray-700 flex items-center gap-1", children: [option.value && (_jsx(Star, { className: "w-4 h-4 fill-warning-600 text-warning-600" })), option.label] })] }, option.value))) })] })] }) }) }), _jsx("div", { className: "lg:col-span-3", children: loading ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [...Array(6)].map((_, i) => (_jsx(Skeleton, { className: "h-80" }, i))) })) : courses.length === 0 ? (_jsx(EmptyState, { icon: BookOpen, title: "No courses found", description: "Try adjusting your filters or search query", action: hasActiveFilters
                                ? {
                                    label: "Clear Filters",
                                    onClick: clearFilters,
                                }
                                : undefined })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: courses.map((course) => (_jsx(Link, { to: `/courses/${course.id}`, className: "group", children: _jsxs(Card, { className: "overflow-hidden hover:shadow-lg transition-all h-full flex flex-col", children: [course.coverImageUrl ? (_jsx("img", { src: course.coverImageUrl, alt: course.title, className: "w-full h-40 object-cover group-hover:scale-105 transition-transform" })) : (_jsx("div", { className: "w-full h-40 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center", children: _jsx(BookOpen, { className: "w-16 h-16 text-white" }) })), _jsxs(CardContent, { className: "p-4 flex-1 flex flex-col", children: [_jsx("div", { className: "flex items-start justify-between mb-2", children: _jsx(Badge, { variant: "info", className: "text-xs", children: course.skillLevel || "Beginner" }) }), _jsx("h3", { className: "font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors flex-1", children: course.title }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: course.instructorName || "Instructor" }), _jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsxs("div", { className: "flex items-center text-warning-600", children: [_jsx(Star, { className: "w-4 h-4 fill-current mr-1" }), _jsx("span", { className: "font-bold text-sm", children: course.avgRating?.toFixed(1) || "4.5" })] }), _jsxs("span", { className: "text-sm text-gray-500", children: ["(", course.enrollmentCount || 0, " students)"] })] }), _jsxs("div", { className: "flex items-center justify-between pt-3 border-t border-gray-200", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600", children: [_jsx(Clock, { className: "w-4 h-4" }), _jsx("span", { children: course.duration || "8h" })] }), _jsx("span", { className: "text-xl font-bold text-gray-900", children: course.price ? `$${course.price}` : "Free" })] })] })] }) }, course.id))) })) })] }), _jsxs("div", { className: "mt-16 pt-12 border-t border-gray-200", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Trending Topics" }), _jsx("div", { className: "flex flex-wrap gap-3", children: [
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
                        ].map((topic) => (_jsx(Link, { to: `/courses?search=${topic}`, className: "px-4 py-2 bg-gray-100 hover:bg-primary-50 text-gray-700 hover:text-primary-600 rounded-full text-sm font-medium transition-colors", children: topic }, topic))) })] })] }));
}
