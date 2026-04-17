import React from "react";
import { useQuery } from "@tanstack/react-query";
import { careerApi } from "../../api/career-outcome.api";
import { TrendingUp, Briefcase, DollarSign, Target } from "lucide-react";

interface CareerOutcome {
  id: string;
  jobTitle: string;
  company?: string;
  salaryRange?: { min: number; max: number };
  location?: string;
  jobType: string;
  requiredSkills: string[];
  relatedCourses: string[];
  matchPercentage: number;
}

export const CareerOutcomesPage: React.FC = () => {
  const { data: careerData, isLoading } = useQuery({
    queryKey: ["career-outcomes"],
    queryFn: careerApi.getCareerOutcomes,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Career Outcomes
          </h1>
          <p className="text-gray-600">
            Explore job opportunities aligned with your learning path
          </p>
        </div>

        {/* Stats */}
        {careerData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Recommended Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {careerData.recommendedJobs?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Avg. Salary</p>
                  <p className="text-2xl font-bold text-gray-900">
                    $
                    {careerData.averageSalary
                      ? (careerData.averageSalary / 1000).toFixed(0) + "K"
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Job Market</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {careerData.jobMarketDemand || "Good"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Growth Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    +{careerData.growthRate || "0"}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Job Opportunities */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !careerData?.recommendedJobs?.length ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
            <Briefcase className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p>Complete more courses to unlock career recommendations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {careerData.recommendedJobs.map((job: CareerOutcome) => (
              <div
                key={job.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {job.jobTitle}
                    </h3>
                    {job.company && (
                      <p className="text-gray-600">{job.company}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {job.matchPercentage}% Match
                    </div>
                    <div className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded">
                      Based on your skills
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {job.salaryRange && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Salary Range
                      </p>
                      <p className="text-gray-900 font-semibold">
                        ${(job.salaryRange.min / 1000).toFixed(0)}K - $
                        {(job.salaryRange.max / 1000).toFixed(0)}K
                      </p>
                    </div>
                  )}
                  {job.location && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Location
                      </p>
                      <p className="text-gray-900 font-semibold">
                        {job.location}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      Job Type
                    </p>
                    <p className="text-gray-900 font-semibold">{job.jobType}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Required Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {job.relatedCourses && job.relatedCourses.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Related Courses
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {job.relatedCourses.map((course) => (
                        <li key={course}>{course}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerOutcomesPage;
