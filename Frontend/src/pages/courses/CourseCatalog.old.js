import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseApi } from '../../api/course.api';
export default function CourseCatalog() {
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [search, setSearch] = useState('');
    useEffect(() => {
        loadCategories();
    }, []);
    useEffect(() => {
        loadCourses();
    }, [selectedCategory, selectedLevel, search]);
    const loadCategories = async () => {
        try {
            const response = await courseApi.getCategories();
            setCategories(response.data.data);
        }
        catch (error) {
            console.error('Failed to load categories:', error);
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
            console.error('Failed to load courses:', error);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { style: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' }, children: [_jsx("h1", { style: { marginBottom: '2rem' }, children: "Course Catalog" }), _jsxs("div", { style: { marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }, children: [_jsx("input", { type: "text", placeholder: "Search courses...", value: search, onChange: (e) => setSearch(e.target.value), style: {
                            flex: 1,
                            minWidth: '200px',
                            padding: '0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                        } }), _jsxs("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), style: {
                            padding: '0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                        }, children: [_jsx("option", { value: "", children: "All Categories" }), categories.map((cat) => (_jsx("option", { value: cat.id, children: cat.name }, cat.id)))] }), _jsxs("select", { value: selectedLevel, onChange: (e) => setSelectedLevel(e.target.value), style: {
                            padding: '0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                        }, children: [_jsx("option", { value: "", children: "All Levels" }), _jsx("option", { value: "beginner", children: "Beginner" }), _jsx("option", { value: "intermediate", children: "Intermediate" }), _jsx("option", { value: "advanced", children: "Advanced" })] })] }), loading ? (_jsx("div", { style: { textAlign: 'center', padding: '3rem' }, children: "Loading courses..." })) : courses.length === 0 ? (_jsx("div", { style: { textAlign: 'center', padding: '3rem', color: '#666' }, children: "No courses found matching your criteria." })) : (_jsx("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem',
                }, children: courses.map((course) => (_jsxs(Link, { to: `/courses/${course.id}`, style: {
                        textDecoration: 'none',
                        color: 'inherit',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                    }, onMouseEnter: (e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }, onMouseLeave: (e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }, children: [course.coverImageUrl && (_jsx("img", { src: course.coverImageUrl, alt: course.title, style: {
                                width: '100%',
                                height: '180px',
                                objectFit: 'cover',
                                backgroundColor: '#f0f0f0',
                            } })), _jsxs("div", { style: { padding: '1rem' }, children: [_jsxs("div", { style: { fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }, children: [course.category_name || 'Uncategorized', " \u2022 ", course.skillLevel] }), _jsx("h3", { style: { margin: '0 0 0.5rem 0', fontSize: '1.125rem' }, children: course.title }), _jsx("p", { style: { fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }, children: course.shortDescription || course.description.substring(0, 100) + '...' }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("div", { style: { fontSize: '0.875rem', color: '#666' }, children: course.averageRating && (_jsxs("span", { children: ["\u2605 ", course.averageRating.toFixed(1), " (", course.totalReviews, ")"] })) }), _jsx("div", { style: { fontWeight: 'bold', color: '#1a56db' }, children: course.priceCents === 0 ? 'Free' : `$${(course.priceCents / 100).toFixed(2)}` })] })] })] }, course.id))) }))] }));
}
