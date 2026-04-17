import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { courseApi, Course } from "../../api/course.api";
import { useAuthStore } from "../../store/authStore";

export default function MyCourses() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await courseApi.listCourses({ search: user?.id });
      setCourses(response.data.data);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      await courseApi.deleteCourse(id);
      setCourses(courses.filter((c) => c.id !== id));
      alert("Course deleted successfully");
    } catch (error) {
      alert("Failed to delete course");
    }
  };

  const handlePublish = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    try {
      await courseApi.publishCourse(id, newStatus);
      setCourses(
        courses.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
      );
      alert(
        `Course ${newStatus === "published" ? "published" : "unpublished"} successfully`,
      );
    } catch (error) {
      alert("Failed to update course status");
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading courses...</div>;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>My Courses</h1>
        <Link
          to="/instructor/courses/new"
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#1a56db",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
            fontWeight: 500,
          }}
        >
          + New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
          <p>You haven't created any courses yet.</p>
          <Link to="/instructor/courses/new" style={{ color: "#1a56db" }}>
            Create your first course
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {courses.map((course) => (
            <div
              key={course.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "1.5rem",
                display: "flex",
                gap: "1.5rem",
              }}
            >
              {course.coverImageUrl && (
                <img
                  src={course.coverImageUrl}
                  alt={course.title}
                  style={{
                    width: "200px",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: "0.5rem",
                  }}
                >
                  <h3 style={{ margin: 0 }}>{course.title}</h3>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "12px",
                      fontSize: "0.875rem",
                      backgroundColor:
                        course.status === "published" ? "#d1fae5" : "#fee",
                      color:
                        course.status === "published" ? "#065f46" : "#991b1b",
                    }}
                  >
                    {course.status}
                  </span>
                </div>
                <p style={{ color: "#666", marginBottom: "1rem" }}>
                  {course.shortDescription ||
                    course.description.substring(0, 150) + "..."}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    fontSize: "0.875rem",
                    color: "#666",
                    marginBottom: "1rem",
                  }}
                >
                  <span>{course.totalEnrollments || 0} students</span>
                  {course.averageRating && (
                    <span>★ {course.averageRating.toFixed(1)}</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <Link
                    to={`/instructor/courses/${course.id}/edit`}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#f5f5f5",
                      color: "#333",
                      textDecoration: "none",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                    }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handlePublish(course.id, course.status)}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor:
                        course.status === "published" ? "#fef3c7" : "#10b981",
                      color:
                        course.status === "published" ? "#92400e" : "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                    }}
                  >
                    {course.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#fee",
                      color: "#991b1b",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
