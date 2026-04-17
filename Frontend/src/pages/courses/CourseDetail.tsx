import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseApi, Course, Module, Review } from '../../api/course.api';
import { useAuthStore } from '../../store/authStore';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course & { modules?: Module[]; prerequisites?: any[] } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
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
      const response = await courseApi.getCourse(id!);
      setCourse(response.data.data);
    } catch (error) {
      console.error('Failed to load course:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await courseApi.getCourseReviews(id!, { limit: 10 });
      setReviews(response.data.data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const checkEnrollment = async () => {
    if (!user) return;
    try {
      await courseApi.getEnrollmentDetails(id!);
      setIsEnrolled(true);
    } catch (error) {
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
      await courseApi.enrollInCourse(id!);
      setIsEnrolled(true);
      alert('Successfully enrolled in course!');
      navigate(`/courses/${id}/learn`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading course...</div>;
  }

  if (!course) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Course not found</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Link to="/courses" style={{ color: '#1a56db', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to Catalog
      </Link>

      {/* Hero Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ marginBottom: '1rem' }}>{course.title}</h1>
          <p style={{ fontSize: '1.125rem', color: '#666', marginBottom: '1rem' }}>
            {course.shortDescription || course.description}
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', backgroundColor: '#e3f2fd', borderRadius: '12px' }}>
              {course.skillLevel}
            </span>
            {course.category_name && (
              <span style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', backgroundColor: '#f5f5f5', borderRadius: '12px' }}>
                {course.category_name}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#666' }}>
            {course.estimatedDurationHours && <span>{course.estimatedDurationHours}h total</span>}
            {course.totalEnrollments && <span>{course.totalEnrollments} students</span>}
            {course.averageRating && <span>★ {course.averageRating.toFixed(1)} ({course.totalReviews} reviews)</span>}
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem' }}>
          {course.coverImageUrl && (
            <img src={course.coverImageUrl} alt={course.title} style={{ width: '100%', borderRadius: '4px', marginBottom: '1rem' }} />
          )}
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {course.priceCents === 0 ? 'Free' : `$${(course.priceCents / 100).toFixed(2)}`}
          </div>
          {isEnrolled ? (
            <Link
              to={`/courses/${id}/learn`}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '0.75rem',
                backgroundColor: '#10b981',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Continue Learning
            </Link>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: enrolling ? '#ccc' : '#1a56db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: enrolling ? 'not-allowed' : 'pointer',
              }}
            >
              {enrolling ? 'Enrolling...' : 'Enroll Now'}
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>About this course</h2>
        <p style={{ whiteSpace: 'pre-wrap' }}>{course.description}</p>
      </section>

      {/* Curriculum */}
      {course.modules && course.modules.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <h2>Course Curriculum</h2>
          <div style={{ marginTop: '1rem' }}>
            {course.modules.map((module, idx) => (
              <details key={module.id} style={{ marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', padding: '1rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
                  {idx + 1}. {module.title} {module.lessons && `(${module.lessons.length} lessons)`}
                </summary>
                {module.lessons && module.lessons.length > 0 && (
                  <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id} style={{ marginBottom: '0.5rem' }}>
                        {lesson.title}
                        {lesson.isPreview && (
                          <span style={{ marginLeft: '0.5rem', color: '#10b981', fontSize: '0.875rem' }}>
                            (Free preview)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section>
          <h2>Student Reviews</h2>
          <div style={{ marginTop: '1rem' }}>
            {reviews.map((review) => (
              <div key={review.id} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                <p>{review.reviewText}</p>
                {review.instructorResponse && (
                  <div style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '3px solid #e3f2fd' }}>
                    <strong>Instructor Response:</strong>
                    <p>{review.instructorResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
