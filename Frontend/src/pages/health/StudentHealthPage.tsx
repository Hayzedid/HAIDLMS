import React from 'react';
import { useParams } from 'react-router-dom';
import { StudentHealthDashboard } from '../../components/health/StudentHealthDashboard';
import { useAuth } from '../../hooks/useAuth';

const StudentHealthPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();

  if (!user || !courseId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your health data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Your Learning Health
          </h1>
          <p className="text-gray-600">
            Track your progress and see how you're doing in this course
          </p>
        </div>

        <StudentHealthDashboard userId={user.id} courseId={courseId} />
      </div>
    </div>
  );
};

export default StudentHealthPage;
