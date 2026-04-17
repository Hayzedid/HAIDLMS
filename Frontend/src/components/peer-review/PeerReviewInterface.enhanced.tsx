import React, { useState, useEffect } from "react";
import {
  Code,
  Star,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  ThumbsUp,
  FileCode,
  Award,
} from "lucide-react";
import {
  peerReviewApi,
  CodeReview,
  RubricCriterion,
  ReviewComment,
} from "../../api/peer-review.api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Progress } from "../ui/Progress";
import { Modal, ConfirmModal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { cn } from "../../lib/utils";

interface Props {
  reviewId: string;
  submissionCode: string;
  submissionLanguage: string;
  onReviewSubmitted?: () => void;
}

export const PeerReviewInterface: React.FC<Props> = ({
  reviewId,
  submissionCode,
  submissionLanguage,
  onReviewSubmitted,
}) => {
  const [review, setReview] = useState<CodeReview | null>(null);
  const [criteria, setCriteria] = useState<RubricCriterion[]>([]);
  const [scores, setScores] = useState<
    Record<string, { score: number; feedback: string }>
  >({});
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [overallFeedback, setOverallFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [startTime] = useState(Date.now());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // For adding line comments
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState<
    "suggestion" | "question" | "praise" | "issue"
  >("suggestion");

  const toast = useToast();
  const codeLines = submissionCode.split("\n");

  useEffect(() => {
    loadReviewData();
  }, [reviewId]);

  const loadReviewData = async () => {
    try {
      const reviewData = await peerReviewApi.getReview(reviewId);
      setReview(reviewData);

      const rubricCriteria = await peerReviewApi.getRubricCriteria(
        reviewData.rubricId,
      );
      setCriteria(rubricCriteria);

      const existingComments = await peerReviewApi.getReviewComments(reviewId);
      setComments(existingComments);

      // Start the review
      if (reviewData.status === "pending") {
        await peerReviewApi.startReview(reviewId);
        setReview({ ...reviewData, status: "in_progress" });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load review data");
      toast.error("Failed to load review", err.message);
    }
  };

  const handleScoreChange = (
    criterionId: string,
    score: number,
    feedback: string,
  ) => {
    setScores((prev) => ({
      ...prev,
      [criterionId]: { score, feedback },
    }));
  };

  const addLineComment = async () => {
    if (!newComment.trim() || selectedLine === null) return;

    try {
      const comment = await peerReviewApi.addComment(reviewId, {
        lineNumber: selectedLine + 1,
        codeSnippet: codeLines[selectedLine],
        comment: newComment,
        commentType,
      });

      setComments((prev) => [...prev, comment]);
      setNewComment("");
      setSelectedLine(null);
      toast.success("Comment added!");
    } catch (err: any) {
      setError(err.message || "Failed to add comment");
      toast.error("Failed to add comment", err.message);
    }
  };

  const submitReview = async () => {
    // Validate
    const missingScores = criteria
      .filter((c) => c.isRequired && !scores[c.id])
      .map((c) => c.name);

    if (missingScores.length > 0) {
      setError(
        `Please score all required criteria: ${missingScores.join(", ")}`,
      );
      toast.warning("Missing required scores", missingScores.join(", "));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Submit scores
      for (const [criterionId, { score, feedback }] of Object.entries(scores)) {
        await peerReviewApi.submitCriterionScore(reviewId, {
          criterionId,
          score,
          feedback,
        });
      }

      // Submit review
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      await peerReviewApi.submitReview(reviewId, {
        overallFeedback,
        timeSpentSeconds: timeSpent,
      });

      setShowConfirmModal(false);
      setShowSuccessModal(true);

      setTimeout(() => {
        if (onReviewSubmitted) onReviewSubmitted();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
      toast.error("Submission failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (Object.keys(scores).length / criteria.length) * 100;

  const commentTypeConfig = {
    suggestion: {
      icon: Lightbulb,
      color: "text-blue-600",
      bg: "bg-blue-50",
      label: "Suggestion",
    },
    question: {
      icon: MessageSquare,
      color: "text-purple-600",
      bg: "bg-purple-50",
      label: "Question",
    },
    praise: {
      icon: ThumbsUp,
      color: "text-green-600",
      bg: "bg-green-50",
      label: "Praise",
    },
    issue: {
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      label: "Issue",
    },
  };

  if (!review) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <Card variant="elevated" className="mb-6 backdrop-blur-md bg-white/90">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  <FileCode className="w-8 h-8 text-primary-600" />
                  Peer Code Review
                </h1>
                <p className="text-gray-600">
                  Review the code carefully and provide constructive feedback
                  using the rubric below.
                </p>
              </div>
              <Badge variant="info" size="lg" dot>
                In Progress
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <Progress
                value={progress}
                label="Review Progress"
                showLabel
                variant={progress === 100 ? "success" : "default"}
              />
              <p className="text-xs text-gray-500 mt-2">
                {Object.keys(scores).length} of {criteria.length} criteria
                scored
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-danger-50 border-l-4 border-danger-500 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger-700">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Code View */}
          <div className="space-y-4">
            <Card variant="elevated" className="backdrop-blur-md bg-white/90">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-primary-600" />
                    Submitted Code
                  </CardTitle>
                  <Badge variant="default" size="sm">
                    {submissionLanguage}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                    <span className="text-xs text-gray-400 font-mono">
                      main.{submissionLanguage}
                    </span>
                    <span className="text-xs text-gray-400">
                      {codeLines.length} lines
                    </span>
                  </div>
                  <div
                    className="overflow-x-auto custom-scrollbar"
                    style={{ maxHeight: "500px" }}
                  >
                    {codeLines.map((line, index) => {
                      const lineComments = comments.filter(
                        (c) => c.lineNumber === index + 1,
                      );
                      const hasComment = lineComments.length > 0;
                      const isSelected = selectedLine === index;

                      return (
                        <div key={index}>
                          <div
                            onClick={() => setSelectedLine(index)}
                            className={cn(
                              "flex items-start hover:bg-gray-800 cursor-pointer transition-colors",
                              isSelected &&
                                "bg-primary-900/30 border-l-4 border-primary-500",
                              hasComment && "bg-yellow-900/20",
                            )}
                          >
                            <span className="w-12 flex-shrink-0 text-right pr-4 py-2 text-gray-500 text-xs font-mono select-none">
                              {index + 1}
                            </span>
                            <pre className="flex-1 py-2 text-sm text-gray-100 font-mono">
                              <code>{line || " "}</code>
                            </pre>
                          </div>
                          {/* Line Comments */}
                          {hasComment && (
                            <div className="bg-yellow-900/30 border-l-4 border-yellow-500 ml-12 p-3 space-y-2">
                              {lineComments.map((comment) => {
                                const config =
                                  commentTypeConfig[
                                    comment.commentType as keyof typeof commentTypeConfig
                                  ] || commentTypeConfig.suggestion;
                                const Icon = config.icon;
                                return (
                                  <div
                                    key={comment.id}
                                    className="flex items-start gap-2 text-sm"
                                  >
                                    <Icon
                                      className={cn(
                                        "w-4 h-4 flex-shrink-0 mt-0.5",
                                        config.color,
                                      )}
                                    />
                                    <div>
                                      <Badge variant="warning" size="sm">
                                        {config.label}
                                      </Badge>
                                      <p className="text-gray-200 mt-1">
                                        {comment.comment}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Comment Form */}
                {selectedLine !== null && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200 animate-fade-in">
                    <p className="text-sm font-semibold text-blue-900 mb-3">
                      Add comment to line {selectedLine + 1}
                    </p>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        {Object.entries(commentTypeConfig).map(
                          ([type, config]) => {
                            const Icon = config.icon;
                            return (
                              <button
                                key={type}
                                onClick={() => setCommentType(type as any)}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                  commentType === type
                                    ? `${config.bg} ${config.color} border-2 border-current scale-105`
                                    : "bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300",
                                )}
                              >
                                <Icon className="w-4 h-4" />
                                {config.label}
                              </button>
                            );
                          },
                        )}
                      </div>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write your comment..."
                        className="w-full px-3 py-2 border-2 border-blue-200 focus:border-blue-500 rounded-lg text-sm custom-scrollbar focus:outline-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={addLineComment}
                          size="sm"
                          variant="primary"
                          icon={<Send className="w-4 h-4" />}
                        >
                          Add Comment
                        </Button>
                        <Button
                          onClick={() => setSelectedLine(null)}
                          size="sm"
                          variant="ghost"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Rubric & Scoring */}
          <div className="space-y-4">
            {/* Rubric Criteria */}
            <div className="space-y-3">
              {criteria.map((criterion, index) => {
                const currentScore = scores[criterion.id];
                const isScored = !!currentScore;

                return (
                  <Card
                    key={criterion.id}
                    variant={isScored ? "elevated" : "bordered"}
                    className={cn(
                      "animate-fade-in transition-all",
                      isScored &&
                        "border-2 border-success-300 bg-success-50/50",
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {criterion.name}
                            {criterion.isRequired && (
                              <Badge variant="danger" size="sm">
                                Required
                              </Badge>
                            )}
                            {isScored && (
                              <CheckCircle className="w-5 h-5 text-success-600" />
                            )}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {criterion.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Weight: {(criterion.weight * 100).toFixed(0)}% • Max
                            Score: {criterion.maxScore}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Star Rating */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Score (1-{criterion.maxScore})
                        </label>
                        <div className="flex gap-2">
                          {Array.from(
                            { length: criterion.maxScore },
                            (_, i) => i + 1,
                          ).map((score) => (
                            <button
                              key={score}
                              onClick={() =>
                                handleScoreChange(
                                  criterion.id,
                                  score,
                                  currentScore?.feedback || "",
                                )
                              }
                              className={cn(
                                "p-2 rounded-lg transition-all hover:scale-110",
                                currentScore?.score >= score
                                  ? "text-warning-500"
                                  : "text-gray-300 hover:text-gray-400",
                              )}
                            >
                              <Star
                                className="w-8 h-8"
                                fill={
                                  currentScore?.score >= score
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            </button>
                          ))}
                        </div>
                        {currentScore && (
                          <p className="text-sm font-semibold text-warning-700 mt-2">
                            Score: {currentScore.score} / {criterion.maxScore}
                          </p>
                        )}
                      </div>

                      {/* Feedback */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Feedback for this criterion
                        </label>
                        <textarea
                          value={currentScore?.feedback || ""}
                          onChange={(e) =>
                            handleScoreChange(
                              criterion.id,
                              currentScore?.score || 0,
                              e.target.value,
                            )
                          }
                          placeholder="Explain your score..."
                          className="w-full px-3 py-2 border-2 border-gray-200 focus:border-primary-500 rounded-lg text-sm custom-scrollbar focus:outline-none"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Overall Feedback */}
            <Card variant="elevated" className="backdrop-blur-md bg-white/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-600" />
                  Overall Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={overallFeedback}
                  onChange={(e) => setOverallFeedback(e.target.value)}
                  placeholder="Provide overall feedback on the submission..."
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:border-primary-500 rounded-xl text-sm custom-scrollbar focus:outline-none"
                  rows={6}
                />
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={progress < 100 || isSubmitting}
                  fullWidth
                  size="lg"
                  variant={progress === 100 ? "success" : "primary"}
                  icon={<CheckCircle className="w-5 h-5" />}
                  loading={isSubmitting}
                >
                  {progress === 100
                    ? "Submit Review"
                    : `Complete ${criteria.length - Object.keys(scores).length} more criteria`}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={submitReview}
        title="Submit Review?"
        message="Are you sure you want to submit this review? You won't be able to edit it after submission."
        confirmText="Submit Review"
        variant="primary"
        loading={isSubmitting}
      />

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        size="sm"
        showCloseButton={false}
      >
        <div className="text-center py-6">
          <div className="inline-flex p-6 bg-success-100 rounded-full mb-4 animate-bounce-in">
            <Award className="w-16 h-16 text-success-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Review Submitted!
          </h3>
          <p className="text-gray-600 mb-6">
            Thank you for your thoughtful feedback. Your peer will benefit from
            your insights!
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">
              ✓ {comments.length} comments added
            </p>
            <p className="text-sm text-gray-500">
              ✓ {criteria.length} criteria scored
            </p>
            <p className="text-sm text-gray-500">✓ Overall feedback provided</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
