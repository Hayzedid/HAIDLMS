import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseApi, Course, Category } from '../../api/course.api';

export default function CourseEditor() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    skillLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    coverImageUrl: '',
    trailerVideoUrl: '',
    estimatedDurationHours: 0,
    priceCents: 0,
    language: 'en',
    tags: [] as string[],
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
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadCourse = async () => {
    try {
      const response = await courseApi.getCourse(id!);
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
    } catch (error) {
      console.error('Failed to load course:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await courseApi.uploadImage(file);
      setFormData((prev) => ({ ...prev, coverImageUrl: response.data.data.url }));
      alert('Image uploaded successfully!');
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id && id !== 'new') {
        await courseApi.updateCourse(id, formData);
        alert('Course updated successfully!');
      } else {
        const response = await courseApi.createCourse(formData);
        alert('Course created successfully!');
        navigate(`/instructor/courses/${response.data.data.id}/edit`);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{id && id !== 'new' ? 'Edit Course' : 'Create New Course'}</h1>

      <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Course Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            URL Slug *
          </label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
          <small style={{ color: '#666' }}>URL-friendly version of the title (lowercase, hyphenated)</small>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Short Description
          </label>
          <input
            type="text"
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            maxLength={500}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Full Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={6}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Category
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Skill Level *
            </label>
            <select
              name="skillLevel"
              value={formData.skillLevel}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Cover Image
          </label>
          {formData.coverImageUrl && (
            <img src={formData.coverImageUrl} alt="Cover" style={{ width: '200px', marginBottom: '0.5rem', borderRadius: '4px' }} />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            style={{ display: 'block' }}
          />
          {uploading && <small>Uploading...</small>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Estimated Duration (hours)
            </label>
            <input
              type="number"
              name="estimatedDurationHours"
              value={formData.estimatedDurationHours}
              onChange={handleChange}
              min="0"
              step="0.5"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Price (USD)
            </label>
            <input
              type="number"
              name="priceCents"
              value={formData.priceCents / 100}
              onChange={(e) => setFormData((prev) => ({ ...prev, priceCents: parseFloat(e.target.value) * 100 }))}
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: loading ? '#ccc' : '#1a56db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Saving...' : 'Save Course'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/instructor/courses')}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#f5f5f5',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
