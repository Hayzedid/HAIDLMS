import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseApi } from '../../api/course.api';
export default function CourseEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        description: '',
        shortDescription: '',
        categoryId: '',
        skillLevel: 'beginner',
        coverImageUrl: '',
        trailerVideoUrl: '',
        estimatedDurationHours: 0,
        priceCents: 0,
        language: 'en',
        tags: [],
    });
    useEffect(() => {
        loadCategories();
        if (id && id !== 'new') {
            loadCourse();
        }
    }, [id]);
    const loadCategories = async () => {
        try {
            const response = await courseApi.getCategories();
            setCategories(response.data.data);
        }
        catch (error) {
            console.error('Failed to load categories:', error);
        }
    };
    const loadCourse = async () => {
        try {
            const response = await courseApi.getCourse(id);
            const course = response.data.data;
            setFormData({
                title: course.title,
                slug: course.slug,
                description: course.description,
                shortDescription: course.shortDescription || '',
                categoryId: course.categoryId || '',
                skillLevel: course.skillLevel,
                coverImageUrl: course.coverImageUrl || '',
                trailerVideoUrl: course.trailerVideoUrl || '',
                estimatedDurationHours: course.estimatedDurationHours || 0,
                priceCents: course.priceCents,
                language: course.language,
                tags: course.tags || [],
            });
        }
        catch (error) {
            console.error('Failed to load course:', error);
        }
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Auto-generate slug from title
        if (name === 'title' && !id) {
            setFormData((prev) => ({
                ...prev,
                slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            }));
        }
    };
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
        try {
            const response = await courseApi.uploadImage(file);
            setFormData((prev) => ({ ...prev, coverImageUrl: response.data.data.url }));
            alert('Image uploaded successfully!');
        }
        catch (error) {
            alert('Failed to upload image');
        }
        finally {
            setUploading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (id && id !== 'new') {
                await courseApi.updateCourse(id, formData);
                alert('Course updated successfully!');
            }
            else {
                const response = await courseApi.createCourse(formData);
                alert('Course created successfully!');
                navigate(`/instructor/courses/${response.data.data.id}/edit`);
            }
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to save course');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { style: { padding: '2rem', maxWidth: '800px', margin: '0 auto' }, children: [_jsx("h1", { children: id && id !== 'new' ? 'Edit Course' : 'Create New Course' }), _jsxs("form", { onSubmit: handleSubmit, style: { marginTop: '2rem' }, children: [_jsxs("div", { style: { marginBottom: '1.5rem' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 }, children: "Course Title *" }), _jsx("input", { type: "text", name: "title", value: formData.title, onChange: handleChange, required: true, style: {
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                } })] }), _jsxs("div", { style: { marginBottom: '1.5rem' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 }, children: "URL Slug *" }), _jsx("input", { type: "text", name: "slug", value: formData.slug, onChange: handleChange, required: true, style: {
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                } }), _jsx("small", { style: { color: '#666' }, children: "URL-friendly version of the title (lowercase, hyphenated)" })] }), _jsxs("div", { style: { marginBottom: '1.5rem' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 }, children: "Short Description" }), _jsx("input", { type: "text", name: "shortDescription", value: formData.shortDescription, onChange: handleChange, maxLength: 500, style: {
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                } })] }), _jsxs("div", { style: { marginBottom: '1.5rem' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 }, children: "Full Description *" }), _jsx("textarea", { name: "description", value: formData.description, onChange: handleChange, required: true, rows: 6, style: {
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                } })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 }, children: "Category" }), _jsxs("select", { name: "categoryId", value: formData.categoryId, onChange: handleChange, style: {
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '1rem',
                                        }, children: [_jsx("option", { value: "", children: "Select category" }), categories.map((cat) => (_jsx("option", { value: cat.id, children: cat.name }, cat.id)))] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 }, children: "Skill Level *" }), _jsxs("select", { name: "skillLevel", value: formData.skillLevel, onChange: handleChange, required: true, style: {
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '1rem',
                                        }, children: [_jsx("option", { value: "beginner", children: "Beginner" }), _jsx("option", { value: "intermediate", children: "Intermediate" }), _jsx("option", { value: "advanced", children: "Advanced" })] })] })] }), _jsxs("div", { style: { marginBottom: '1.5rem' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 }, children: "Cover Image" }), formData.coverImageUrl && (_jsx("img", { src: formData.coverImageUrl, alt: "Cover", style: { width: '200px', marginBottom: '0.5rem', borderRadius: '4px' } })), _jsx("input", { type: "file", accept: "image/*", onChange: handleImageUpload, disabled: uploading, style: { display: 'block' } }), uploading && _jsx("small", { children: "Uploading..." })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 }, children: "Estimated Duration (hours)" }), _jsx("input", { type: "number", name: "estimatedDurationHours", value: formData.estimatedDurationHours, onChange: handleChange, min: "0", step: "0.5", style: {
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '1rem',
                                        } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 }, children: "Price (USD)" }), _jsx("input", { type: "number", name: "priceCents", value: formData.priceCents / 100, onChange: (e) => setFormData((prev) => ({ ...prev, priceCents: parseFloat(e.target.value) * 100 })), min: "0", step: "0.01", style: {
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '1rem',
                                        } })] })] }), _jsxs("div", { style: { display: 'flex', gap: '1rem', marginTop: '2rem' }, children: [_jsx("button", { type: "submit", disabled: loading, style: {
                                    padding: '0.75rem 2rem',
                                    backgroundColor: loading ? '#ccc' : '#1a56db',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    fontWeight: 500,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                }, children: loading ? 'Saving...' : 'Save Course' }), _jsx("button", { type: "button", onClick: () => navigate('/instructor/courses'), style: {
                                    padding: '0.75rem 2rem',
                                    backgroundColor: '#f5f5f5',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }, children: "Cancel" })] })] })] }));
}
