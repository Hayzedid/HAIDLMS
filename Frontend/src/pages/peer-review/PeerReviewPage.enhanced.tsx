import React, { useState, useEffect } from "react";
import {
  FileCode,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  Users,
} from "lucide-react";
import { peerReviewApi, CodeReview } from "../../api/peer-review.api";
import { PeerReviewInterface } from "../../components/peer-review/PeerReviewInterface.enhanced";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Spinner } from "../../components/ui/Spinner";
import { useAuth } from "../../hooks/useAuth";
import { cn, formatRelativeTime } from "../../lib/utils";

export const PeerReviewPage: React.FC = () => {
  const { user } = useAuth();
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [submittedReviews, setSubmittedReviews] = useState<CodeReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "submitted">(
    "pending",
  );

  useEffect(() => {
    if (user) {
      loadReviews();
    }
  }, [user]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const [pending, assignments] = await Promise.all([
        peerReviewApi.getPendingReviews(user?.id),
        peerReviewApi.getReviewerAssignments(user?.id || "", "submitted"),
      ]);
      setPendingReviews(pending);
      setSubmittedReviews(assignments);
    } catch (err: any) {
      setError(err.message || "Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartReview = (review: any) => {
    setSelectedReview(review);
  };

  const handleReviewSubmitted = () => {
    setSelectedReview(null);
    loadReviews();
  };

  if (selectedReview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Button
            onClick={() => setSelectedReview(null)}
            variant="ghost"
            size="lg"
            className="mb-6"
          >
            ← Back to Reviews
          </Button>
          <PeerReviewInterface
            reviewId={selectedReview.review_id}
            submissionCode="// Sample code - would load from backend\nfunction example() {\n  return 'Hello World';\n}"
            submissionLanguage="javascript"
            onReviewSubmitted={handleReviewSubmitted}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
              <FileCode className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-display font-bold text-gray-900">
              Peer Code Reviews
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Review your classmates' code and provide constructive feedback
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger-50 border-l-4 border-danger-500 rounded-xl text-danger-700 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-2 shadow-lg inline-flex gap-2">
            <button
              onClick={() => setActiveTab("pending")}
              className={cn(
                "flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all",
                activeTab === "pending"
                  ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg scale-105"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              <Clock className="w-5 h-5" />
              <div className="text-left">
                <div className="text-sm font-bold">Pending</div>
                <div
                  className={cn(
                    "text-xs",
                    activeTab === "pending"
                      ? "text-orange-100"
                      : "text-gray-500",
                  )}
                >
                  {pendingReviews.length} to review
                </div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("submitted")}
              className={cn(
                "flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all",
                activeTab === "submitted"
                  ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg scale-105"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              <CheckCircle2 className="w-5 h-5" />
              <div className="text-left">
                <div className="text-sm font-bold">Submitted</div>
                <div
                  className={cn(
                    "text-xs",
                    activeTab === "submitted"
                      ? "text-green-100"
                      : "text-gray-500",
                  )}
                >
                  {submittedReviews.length} completed
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="xl" label="Loading reviews..." />
          </div>
        ) : activeTab === "pending" ? (
          <div className="space-y-4 animate-fade-in">
            {pendingReviews.length === 0 ? (
              <EmptyState
                icon={Award}
                title="All Caught Up!"
                description="You don't have any pending reviews at the moment. Great job staying on top of your peer reviews!"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingReviews.map((review, index) => (
                  <Card
                    key={review.review_id}
                    variant="elevated"
                    hover
                    className={cn(
                      "backdrop-blur-md bg-white/90 animate-fade-in-up",
                      review.is_overdue && "border-2 border-danger-300",
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileCode className="w-6 h-6 text-blue-600" />
                        </div>
                        {review.is_overdue && (
                          <Badge variant="danger" size="sm">
                            OVERDUE
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">
                        {review.rubric_name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Submission #{review.submission_id.slice(0, 8)}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Due {formatRelativeTime(review.due_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {review.min_reviews_required} reviews required
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <div className="p-4 pt-0">
                      <Button
                        onClick={() => handleStartReview(review)}
                        fullWidth
                        variant="primary"
                        size="lg"
                      >
                        Start Review
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {submittedReviews.length === 0 ? (
              <EmptyState
                icon={FileCode}
                title="No Submitted Reviews Yet"
                description="Your completed reviews will appear here. Start reviewing to help your peers!"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {submittedReviews.map((review, index) => (
                  <Card
                    key={review.id}
                    variant="elevated"
                    className="backdrop-blur-md bg-white/90 animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-success-100 rounded-lg">
                            <CheckCircle2 className="w-6 h-6 text-success-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              Review Completed
                            </CardTitle>
                            <Badge variant="success" size="sm" className="mt-1">
                              SUBMITTED
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          <strong>Submission:</strong> #
                          {review.submissionId.slice(0, 8)}
                        </p>
                        {review.overallScore && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Award
                                  key={i}
                                  className={cn(
                                    "w-5 h-5",
                                    i < review.overallScore!
                                      ? "text-warning-500 fill-current"
                                      : "text-gray-300",
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-semibold text-gray-700">
                              {review.overallScore.toFixed(1)} / 5.0
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          Submitted {formatRelativeTime(review.submittedAt!)}
                        </p>
                        {review.isFlaggedForCollusion && (
                          <div className="p-3 bg-danger-50 border-l-4 border-danger-500 rounded">
                            <p className="text-xs text-danger-700 font-semibold flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Flagged for review (similarity:{" "}
                              {(review.collusionSimilarityScore! * 100).toFixed(
                                1,
                              )}
                              %)
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Guidelines Box */}
        <Card
          variant="elevated"
          className="mt-12 backdrop-blur-md bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200"
        >
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <FileCode className="w-6 h-6" />
              Peer Review Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Badge variant="success" size="sm">
                  ✓
                </Badge>
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Be Constructive
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Provide helpful suggestions, not just criticism
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="success" size="sm">
                  ✓
                </Badge>
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Be Specific
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Reference specific lines and explain your reasoning
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="success" size="sm">
                  ✓
                </Badge>
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Be Respectful
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Remember there's a person behind the code
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="success" size="sm">
                  ✓
                </Badge>
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Follow the Rubric
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Use the provided criteria to guide your review
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white/60 rounded-xl border border-blue-300">
              <p className="text-sm text-blue-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Academic Integrity:</strong> Your reviews may be
                  cross-checked against your own code for academic integrity.
                  Don't copy code you're reviewing!
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
