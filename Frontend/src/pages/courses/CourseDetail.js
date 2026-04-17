import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseApi } from '../../api/course.api';
import { useAuthStore } from '../../store/authStore';
export default function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [course, setCourse] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    useEffect(() => {
        if (id) {
            loadCourse();
            loadReviews();
            checkEnrollment();
        }
    }, [id]);
    const loadCourse = async () => {
        try {
            const response = await courseApi.getCourse(id);
            setCourse(response.data.data);
        }
        catch (error) {
            console.error('Failed to load course:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const loadReviews = async () => {
        try {
            const response = await courseApi.getCourseReviews(id, { limit: 10 });
            setReviews(response.data.data);
        }
        catch (error) {
            console.error('Failed to load reviews:', error);
        }
    };
    const checkEnrollment = async () => {
        if (!user)
            return;
        try {
            await courseApi.getEnrollmentDetails(id);
            setIsEnrolled(true);
        }
        catch (error) {
            setIsEnrolled(false);
        }
    };
    const handleEnroll = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setEnrolling(true);
        try {
            await courseApi.enrollInCourse(id);
            setIsEnrolled(true);
            alert('Successfully enrolled in course!');
            navigate(`/courses/${id}/learn`);
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to enroll');
        }
        finally {
            setEnrolling(false);
        }
    };
    if (loading) {
        return _jsx("div", { style: { padding: '2rem', textAlign: 'center' }, children: "Loading course..." });
    }
    if (!course) {
        return _jsx("div", { style: { padding: '2rem', textAlign: 'center' }, children: "Course not found" });
    }
    return (_jsxs("div", { style: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' }, children: [_jsx(Link, { to: "/courses", style: { color: '#1a56db', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }, children: "\u2190 Back to Catalog" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '3rem' }, children: [_jsxs("div", { children: [_jsx("h1", { style: { marginBottom: '1rem' }, children: course.title }), _jsx("p", { style: { fontSize: '1.125rem', color: '#666', marginBottom: '1rem' }, children: course.shortDescription || course.description }), _jsxs("div", { style: { display: 'flex', gap: '1rem', marginBottom: '1rem' }, children: [_jsx("span", { style: { fontSize: '0.875rem', padding: '0.25rem 0.75rem', backgroundColor: '#e3f2fd', borderRadius: '12px' }, children: course.skillLevel }), course.category_name && (_jsx("span", { style: { fontSize: '0.875rem', padding: '0.25rem 0.75rem', backgroundColor: '#f5f5f5', borderRadius: '12px' }, children: course.category_name }))] }), _jsxs("div", { style: { display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#666' }, children: [course.estimatedDurationHours && _jsxs("span", { children: [course.estimatedDurationHours, "h total"] }), course.totalEnrollments && _jsxs("span", { children: [course.totalEnrollments, " students"] }), course.averageRating && _jsxs("span", { children: ["\u2605 ", course.averageRating.toFixed(1), " (", course.totalReviews, " reviews)"] })] })] }), _jsxs("div", { style: { border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem' }, children: [course.coverImageUrl && (_jsx("img", { src: course.coverImageUrl, alt: course.title, style: { width: '100%', borderRadius: '4px', marginBottom: '1rem' } })), _jsx("div", { style: { fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }, children: course.priceCents === 0 ? 'Free' : `$${(course.priceCents / 100).toFixed(2)}` }), isEnrolled ? (_jsx(Link, { to: `/courses/${id}/learn`, style: {
                                    display: 'block',
                                    textAlign: 'center',
                                    padding: '0.75rem',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    borderRadius: '4px',
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                }, children: "Continue Learning" })) : (_jsx("button", { onClick: handleEnroll, disabled: enrolling, style: {
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: enrolling ? '#ccc' : '#1a56db',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    fontWeight: 500,
                                    cursor: enrolling ? 'not-allowed' : 'pointer',
                                }, children: enrolling ? 'Enrolling...' : 'Enroll Now' }))] })] }), _jsxs("section", { style: { marginBottom: '3rem' }, children: [_jsx("h2", { children: "About this course" }), _jsx("p", { style: { whiteSpace: 'pre-wrap' }, children: course.description })] }), course.modules && course.modules.length > 0 && (_jsxs("section", { style: { marginBottom: '3rem' }, children: [_jsx("h2", { children: "Course Curriculum" }), _jsx("div", { style: { marginTop: '1rem' }, children: course.modules.map((module, idx) => (_jsxs("details", { style: { marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', padding: '1rem' }, children: [_jsxs("summary", { style: { cursor: 'pointer', fontWeight: 500 }, children: [idx + 1, ". ", module.title, " ", module.lessons && `(${module.lessons.length} lessons)`] }), module.lessons && module.lessons.length > 0 && (_jsx("ul", { style: { marginTop: '1rem', paddingLeft: '1.5rem' }, children: module.lessons.map((lesson) => (_jsxs("li", { style: { marginBottom: '0.5rem' }, children: [lesson.title, lesson.isPreview && (_jsx("span", { style: { marginLeft: '0.5rem', color: '#10b981', fontSize: '0.875rem' }, children: "(Free preview)" }))] }, lesson.id))) }))] }, module.id))) })] })), reviews.length > 0 && (_jsxs("section", { children: [_jsx("h2", { children: "Student Reviews" }), _jsx("div", { style: { marginTop: '1rem' }, children: reviews.map((review) => (_jsxs("div", { style: { marginBottom: '1.5rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }, children: [_jsxs("div", { style: { marginBottom: '0.5rem' }, children: ['★'.repeat(review.rating), '☆'.repeat(5 - review.rating)] }), _jsx("p", { children: review.reviewText }), review.instructorResponse && (_jsxs("div", { style: { marginTop: '1rem', paddingLeft: '1rem', borderLeft: '3px solid #e3f2fd' }, children: [_jsx("strong", { children: "Instructor Response:" }), _jsx("p", { children: review.instructorResponse })] }))] }, review.id))) })] }))] }));
}
