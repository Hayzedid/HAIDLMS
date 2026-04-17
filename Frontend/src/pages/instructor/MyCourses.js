import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { courseApi } from "../../api/course.api";
import { useAuthStore } from "../../store/authStore";
export default function MyCourses() {
    const { user } = useAuthStore();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadCourses();
    }, []);
    const loadCourses = async () => {
        try {
            const response = await courseApi.listCourses({ search: user?.id });
            setCourses(response.data.data);
        }
        catch (error) {
            console.error("Failed to load courses:", error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this course?"))
            return;
        try {
            await courseApi.deleteCourse(id);
            setCourses(courses.filter((c) => c.id !== id));
            alert("Course deleted successfully");
        }
        catch (error) {
            alert("Failed to delete course");
        }
    };
    const handlePublish = async (id, currentStatus) => {
        const newStatus = currentStatus === "published" ? "draft" : "published";
        try {
            await courseApi.publishCourse(id, newStatus);
            setCourses(courses.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
            alert(`Course ${newStatus === "published" ? "published" : "unpublished"} successfully`);
        }
        catch (error) {
            alert("Failed to update course status");
        }
    };
    if (loading) {
        return _jsx("div", { style: { padding: "2rem" }, children: "Loading courses..." });
    }
    return (_jsxs("div", { style: { padding: "2rem", maxWidth: "1200px", margin: "0 auto" }, children: [_jsxs("div", { style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2rem",
                }, children: [_jsx("h1", { children: "My Courses" }), _jsx(Link, { to: "/instructor/courses/new", style: {
                            padding: "0.75rem 1.5rem",
                            backgroundColor: "#1a56db",
                            color: "white",
                            textDecoration: "none",
                            borderRadius: "4px",
                            fontWeight: 500,
                        }, children: "+ New Course" })] }), courses.length === 0 ? (_jsxs("div", { style: { textAlign: "center", padding: "3rem", color: "#666" }, children: [_jsx("p", { children: "You haven't created any courses yet." }), _jsx(Link, { to: "/instructor/courses/new", style: { color: "#1a56db" }, children: "Create your first course" })] })) : (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" }, children: courses.map((course) => (_jsxs("div", { style: {
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "1.5rem",
                        display: "flex",
                        gap: "1.5rem",
                    }, children: [course.coverImageUrl && (_jsx("img", { src: course.coverImageUrl, alt: course.title, style: {
                                width: "200px",
                                height: "120px",
                                objectFit: "cover",
                                borderRadius: "4px",
                            } })), _jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: {
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "start",
                                        marginBottom: "0.5rem",
                                    }, children: [_jsx("h3", { style: { margin: 0 }, children: course.title }), _jsx("span", { style: {
                                                padding: "0.25rem 0.75rem",
                                                borderRadius: "12px",
                                                fontSize: "0.875rem",
                                                backgroundColor: course.status === "published" ? "#d1fae5" : "#fee",
                                                color: course.status === "published" ? "#065f46" : "#991b1b",
                                            }, children: course.status })] }), _jsx("p", { style: { color: "#666", marginBottom: "1rem" }, children: course.shortDescription ||
                                        course.description.substring(0, 150) + "..." }), _jsxs("div", { style: {
                                        display: "flex",
                                        gap: "1rem",
                                        fontSize: "0.875rem",
                                        color: "#666",
                                        marginBottom: "1rem",
                                    }, children: [_jsxs("span", { children: [course.totalEnrollments || 0, " students"] }), course.averageRating && (_jsxs("span", { children: ["\u2605 ", course.averageRating.toFixed(1)] }))] }), _jsxs("div", { style: { display: "flex", gap: "1rem" }, children: [_jsx(Link, { to: `/instructor/courses/${course.id}/edit`, style: {
                                                padding: "0.5rem 1rem",
                                                backgroundColor: "#f5f5f5",
                                                color: "#333",
                                                textDecoration: "none",
                                                borderRadius: "4px",
                                                fontSize: "0.875rem",
                                            }, children: "Edit" }), _jsx("button", { onClick: () => handlePublish(course.id, course.status), style: {
                                                padding: "0.5rem 1rem",
                                                backgroundColor: course.status === "published" ? "#fef3c7" : "#10b981",
                                                color: course.status === "published" ? "#92400e" : "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                fontSize: "0.875rem",
                                                cursor: "pointer",
                                            }, children: course.status === "published" ? "Unpublish" : "Publish" }), _jsx("button", { onClick: () => handleDelete(course.id), style: {
                                                padding: "0.5rem 1rem",
                                                backgroundColor: "#fee",
                                                color: "#991b1b",
                                                border: "none",
                                                borderRadius: "4px",
                                                fontSize: "0.875rem",
                                                cursor: "pointer",
                                            }, children: "Delete" })] })] })] }, course.id))) }))] }));
}
