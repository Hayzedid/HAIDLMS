import React, { useState, useEffect } from "react";
import {
  clipboardKeystrokeApi,
  TypingPatterns,
} from "../../api/clipboard-keystroke.api";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  Clock,
} from "lucide-react";

interface Props {
  userId: string;
  sessionId?: string;
}

interface TypingPattern extends TypingPatterns {
  consistencyScore?: number;
  commonPausePatterns?: string;
  avgKeystrokesPerBurst?: number;
  preferredKeyCombinations?: string;
}

interface PatternDeviation {
  sessionId: string;
  deviationType: string;
  severity: string;
  expectedValue: number;
  actualValue: number;
  deviationPercentage: number;
  description: string;
}

export const PatternAnalysisView: React.FC<Props> = ({ userId, sessionId }) => {
  const [baseline, setBaseline] = useState<TypingPattern | null>(null);
  const [deviations, setDeviations] = useState<PatternDeviation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [userId, sessionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [baselineData, deviationsData] = await Promise.all([
        clipboardKeystrokeApi.getTypingBaseline(userId),
        clipboardKeystrokeApi.getPatternDeviations(userId),
      ]);

      setBaseline(baselineData);
      setDeviations(deviationsData);
    } catch (err: any) {
      setError(err.message || "Failed to load pattern analysis");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: "text-blue-600 bg-blue-100",
      medium: "text-yellow-600 bg-yellow-100",
      high: "text-orange-600 bg-orange-100",
      critical: "text-red-600 bg-red-100",
    };
    return colors[severity] || colors.low;
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === "critical" || severity === "high") {
      return <AlertTriangle className="w-5 h-5" />;
    }
    return <Activity className="w-5 h-5" />;
  };

  const getDeviationIndicator = (percentage: number) => {
    if (Math.abs(percentage) < 10) {
      return { icon: CheckCircle, color: "text-green-600", label: "Normal" };
    } else if (Math.abs(percentage) < 25) {
      return {
        icon: TrendingUp,
        color: "text-yellow-600",
        label: "Minor Deviation",
      };
    } else {
      return {
        icon: AlertTriangle,
        color: "text-red-600",
        label: "Significant Deviation",
      };
    }
  };

  const getConsistencyStatus = (score: number) => {
    if (score >= 80)
      return {
        label: "Excellent",
        color: "text-green-600",
        bg: "bg-green-100",
      };
    if (score >= 60)
      return { label: "Good", color: "text-blue-600", bg: "bg-blue-100" };
    if (score >= 40)
      return { label: "Fair", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { label: "Poor", color: "text-red-600", bg: "bg-red-100" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Typing Pattern Analysis
        </h2>
        <p className="text-gray-600">
          Baseline patterns and deviations for student coding behavior
        </p>
      </div>

      {/* Baseline Pattern */}
      {baseline && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Baseline Typing Pattern
            </h3>
            <span className="text-xs text-gray-500">
              Last updated:{" "}
              {baseline.lastCalculatedAt
                ? new Date(baseline.lastCalculatedAt).toLocaleDateString()
                : "N/A"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Typing Speed */}
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-indigo-900">
                  Typing Speed
                </span>
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-3xl font-bold text-indigo-900">
                {baseline.avgTypingSpeedWPM}
              </p>
              <p className="text-sm text-indigo-700 mt-1">words per minute</p>
            </div>

            {/* Consistency Score */}
            <div
              className={`p-4 bg-gradient-to-br rounded-lg border ${
                getConsistencyStatus(baseline.consistencyScore || 0).bg
              } border-current`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium ${getConsistencyStatus(baseline.consistencyScore || 0).color}`}
                >
                  Consistency
                </span>
                <CheckCircle
                  className={`w-5 h-5 ${getConsistencyStatus(baseline.consistencyScore || 0).color}`}
                />
              </div>
              <p
                className={`text-3xl font-bold ${getConsistencyStatus(baseline.consistencyScore || 0).color}`}
              >
                {baseline.consistencyScore || 0}
              </p>
              <p
                className={`text-sm mt-1 ${getConsistencyStatus(baseline.consistencyScore || 0).color}`}
              >
                {getConsistencyStatus(baseline.consistencyScore || 0).label}
              </p>
            </div>

            {/* Burst Average */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-900">
                  Avg Burst Size
                </span>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-purple-900">
                {(baseline.avgKeystrokesPerBurst || 0).toFixed(0)}
              </p>
              <p className="text-sm text-purple-700 mt-1">keystrokes/burst</p>
            </div>
          </div>

          {/* Detailed Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Common Pause Patterns
              </h4>
              <p className="text-sm text-gray-600">
                {baseline.commonPausePatterns ||
                  "No significant patterns detected"}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                Preferred Key Combinations
              </h4>
              <p className="text-sm text-gray-600">
                {baseline.preferredKeyCombinations ||
                  "No specific preferences detected"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pattern Deviations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Pattern Deviations{" "}
            {deviations.length > 0 && `(${deviations.length})`}
          </h3>
          {deviations.length === 0 && (
            <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle className="w-5 h-5" />
              No deviations detected
            </span>
          )}
        </div>

        {deviations.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <p className="text-gray-600">
              This session matches the student's typical typing patterns.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {deviations.map((deviation, idx) => {
              const indicator = getDeviationIndicator(
                deviation.deviationPercentage,
              );
              const Icon = indicator.icon;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${
                    deviation.severity === "critical" ||
                    deviation.severity === "high"
                      ? "border-red-200 bg-red-50"
                      : deviation.severity === "medium"
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(deviation.severity)}`}
                        >
                          {deviation.severity.toUpperCase()}
                        </span>
                        <h4 className="font-semibold text-gray-800">
                          {deviation.deviationType
                            .replace(/_/g, " ")
                            .toUpperCase()}
                        </h4>
                        <div
                          className={`flex items-center gap-1 ${indicator.color}`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {indicator.label}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-3">
                        {deviation.description}
                      </p>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Expected:</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {deviation.expectedValue.toFixed(1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Actual:</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {deviation.actualValue.toFixed(1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Deviation:</span>
                          <span
                            className={`ml-2 font-semibold ${
                              Math.abs(deviation.deviationPercentage) > 25
                                ? "text-red-600"
                                : Math.abs(deviation.deviationPercentage) > 10
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }`}
                          >
                            {deviation.deviationPercentage > 0 ? "+" : ""}
                            {deviation.deviationPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Visual Bar */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2 h-6">
                          <span className="text-xs text-gray-500 w-16">
                            Expected
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-full flex items-center">
                            <div
                              className="bg-gray-400 rounded-full h-full"
                              style={{ width: "50%" }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 h-6 mt-1">
                          <span className="text-xs text-gray-500 w-16">
                            Actual
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-full flex items-center">
                            <div
                              className={`rounded-full h-full ${
                                Math.abs(deviation.deviationPercentage) > 25
                                  ? "bg-red-600"
                                  : Math.abs(deviation.deviationPercentage) > 10
                                    ? "bg-yellow-600"
                                    : "bg-green-600"
                              }`}
                              style={{
                                width: `${Math.min(100, (deviation.actualValue / deviation.expectedValue) * 50)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      {getSeverityIcon(deviation.severity)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interpretation Guide */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Interpretation Guide
        </h3>
        <div className="space-y-2 text-sm text-indigo-800">
          <p>
            <strong>Typing Speed Deviations:</strong> Significant increases may
            indicate code pasting or AI-generated code insertion.
          </p>
          <p>
            <strong>Consistency Drops:</strong> Irregular patterns could suggest
            external assistance or distraction.
          </p>
          <p>
            <strong>Burst Pattern Changes:</strong> Unusual burst sizes often
            correlate with clipboard usage or copying from external sources.
          </p>
          <p>
            <strong>Normal Range:</strong> ±10% deviation is typical. ±25%+
            warrants closer review.
          </p>
        </div>
      </div>
    </div>
  );
};
