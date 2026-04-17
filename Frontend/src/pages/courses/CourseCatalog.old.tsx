import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseApi, Course, Category } from '../../api/course.api';

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
    } catch (error) {
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
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Course Catalog</h1>

      {/* Filters */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading courses...</div>
      ) : courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          No courses found matching your criteria.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {course.coverImageUrl && (
                <img
                  src={course.coverImageUrl}
                  alt={course.title}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    backgroundColor: '#f0f0f0',
                  }}
                />
              )}
              <div style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                  {course.category_name || 'Uncategorized'} • {course.skillLevel}
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>
                  {course.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                  {course.shortDescription || course.description.substring(0, 100) + '...'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    {course.averageRating && (
                      <span>★ {course.averageRating.toFixed(1)} ({course.totalReviews})</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#1a56db' }}>
                    {course.priceCents === 0 ? 'Free' : `$${(course.priceCents / 100).toFixed(2)}`}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
