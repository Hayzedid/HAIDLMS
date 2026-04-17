import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { IntegrityReviewDashboard } from '../../components/integrity/IntegrityReviewDashboard';

const IntegrityDashboardPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId?: string }>();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            to="/instructor/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔒 Academic Integrity Dashboard
          </h1>
          <p className="text-gray-600">
            Review flagged behavior and make decisions on integrity violations
          </p>
          {assessmentId && (
            <p className="text-sm text-gray-500 mt-2">
              Filtered to Assessment: {assessmentId}
            </p>
          )}
        </div>

        <IntegrityReviewDashboard assessmentId={assessmentId} />
      </div>
    </div>
  );
};

export default IntegrityDashboardPage;
