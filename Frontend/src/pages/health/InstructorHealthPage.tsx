import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { InstructorHealthDashboard } from '../../components/health/InstructorHealthDashboard';

const InstructorHealthPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  if (!courseId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid Course</h2>
          <p className="text-gray-600 mb-4">No course ID provided.</p>
          <Link
            to="/instructor/courses"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            ← Back to My Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            to="/instructor/courses"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to My Courses
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Course Health Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor learner health and identify students who may need support
          </p>
        </div>

        <InstructorHealthDashboard courseId={courseId} />
      </div>
    </div>
  );
};

export default InstructorHealthPage;
