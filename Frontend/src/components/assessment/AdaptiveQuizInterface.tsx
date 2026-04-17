import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Target, Clock, CheckCircle, XCircle, Award, Zap } from 'lucide-react';
import axios from 'axios';

interface Props {
  assessmentId: string;
  userId: string;
  onComplete: (result: any) => void;
}

interface Question {
  id: string;
  questionId: string;
  questionText: string;
  options: string[];
  difficultyLevel: string;
  difficultyScore: number;
}

interface Session {
  id: string;
  currentDifficulty: string;
  currentAbilityEstimate: number;
  abilityConfidence: number;
  questionsAnswered: number;
  questionsCorrect: number;
  currentStreak: number;
}

const API_URL = import.meta.env.VITE_COURSE_SERVICE_URL || 'http://localhost:4002';

export const AdaptiveQuizInterface: React.FC<Props> = ({ assessmentId, userId, onComplete }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  useEffect(() => {
    startSession();
  }, []);

  const startSession = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/api/adaptive-assessment/${assessmentId}/start`,
        { userId }
      );

      setSession(response.data.data);
      await loadNextQuestion(response.data.data.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start adaptive assessment');
    } finally {
      setLoading(false);
    }
  };

  const loadNextQuestion = async (sessionId: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/adaptive-assessment/sessions/${sessionId}/next-question`
      );

      if (response.data.data === null) {
        // Session complete
        await completeSession(sessionId);
        return;
      }

      setCurrentQuestion(response.data.data);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setQuestionStartTime(Date.now());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load next question');
    }
  };

  const submitAnswer = async () => {
    if (selectedAnswer === null || !currentQuestion || !session) return;

    setIsSubmitting(true);
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);

    try {
      // In a real implementation, you'd check against the correct answer
      // For now, we'll simulate it
      const correct = Math.random() > 0.5; // Placeholder
      setIsCorrect(correct);
      setShowFeedback(true);

      const response = await axios.post(
        `${API_URL}/api/adaptive-assessment/sessions/${session.id}/submit-response`,
        {
          questionId: currentQuestion.questionId,
          isCorrect: correct,
          timeTakenSeconds: timeTaken,
          confidenceLevel: 'medium',
          confidenceScore: 0.7,
        }
      );

      // Update session with new ability estimate
      const updatedSession = await axios.get(
        `${API_URL}/api/adaptive-assessment/sessions/${session.id}`
      );
      setSession(updatedSession.data.data);

      // Wait 2 seconds to show feedback, then load next question
      setTimeout(async () => {
        await loadNextQuestion(session.id);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeSession = async (sessionId: string) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/adaptive-assessment/sessions/${sessionId}/complete`
      );

      onComplete(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete session');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'text-green-600 bg-green-100',
      medium: 'text-blue-600 bg-blue-100',
      hard: 'text-orange-600 bg-orange-100',
      expert: 'text-red-600 bg-red-100',
    };
    return colors[difficulty] || colors.medium;
  };

  const getAbilityLevelLabel = (ability: number) => {
    if (ability < 0.35) return { label: 'Novice', color: 'text-blue-600' };
    if (ability < 0.65) return { label: 'Intermediate', color: 'text-indigo-600' };
    if (ability < 0.85) return { label: 'Advanced', color: 'text-purple-600' };
    return { label: 'Expert', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Preparing your adaptive assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return null;
  }

  const abilityLevel = getAbilityLevelLabel(session.currentAbilityEstimate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Stats */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-indigo-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">Questions</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{session.questionsAnswered}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">Correct</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{session.questionsCorrect}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">Streak</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{session.currentStreak}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Brain className="w-5 h-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">Level</span>
              </div>
              <p className={`text-lg font-bold ${abilityLevel.color}`}>{abilityLevel.label}</p>
            </div>
          </div>

          {/* Ability Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Ability Estimate</span>
              <span className="font-semibold">{(session.currentAbilityEstimate * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${session.currentAbilityEstimate * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Confidence: {(session.abilityConfidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Current Difficulty Badge */}
        <div className="flex items-center justify-center">
          <span className={`px-4 py-2 rounded-full font-semibold ${getDifficultyColor(session.currentDifficulty)}`}>
            Current Difficulty: {session.currentDifficulty.toUpperCase()}
          </span>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Question {session.questionsAnswered + 1}
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(currentQuestion.difficultyLevel)}`}>
              {currentQuestion.difficultyLevel}
            </span>
          </div>

          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            {currentQuestion.questionText}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => !showFeedback && setSelectedAnswer(idx)}
                disabled={showFeedback || isSubmitting}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === idx
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${showFeedback && selectedAnswer === idx
                    ? isCorrect
                      ? 'border-green-600 bg-green-50'
                      : 'border-red-600 bg-red-50'
                    : ''} disabled:cursor-not-allowed`}
              >
                <div className="flex items-center">
                  <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 ${
                    selectedAnswer === idx
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-gray-300'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-gray-800">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div className={`mt-6 p-4 rounded-lg border-2 ${
              isCorrect ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'
            }`}>
              <div className="flex items-center">
                {isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 mr-3" />
                )}
                <span className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              <p className={`mt-2 text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect
                  ? 'Great job! Moving to a higher difficulty level.'
                  : 'Don\'t worry, we\'ll adjust the difficulty to match your level.'}
              </p>
            </div>
          )}

          {/* Submit Button */}
          {!showFeedback && (
            <button
              onClick={submitAnswer}
              disabled={selectedAnswer === null || isSubmitting}
              className="w-full mt-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          )}
        </div>

        {/* AI Adaptation Notice */}
        <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-4 border border-indigo-200">
          <div className="flex items-start">
            <TrendingUp className="w-5 h-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-indigo-900">
              <strong>Adaptive Assessment:</strong> This quiz adjusts to your ability level in real-time.
              Answer correctly to face harder questions, or we'll adapt to help you learn at your pace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
