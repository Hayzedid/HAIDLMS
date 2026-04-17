-- Database Schema Verification Script
-- Run this to verify all new tables exist in your database

\echo '═══════════════════════════════════════════════════════════'
\echo '  Database Schema Verification'
\echo '  Checking: Peer Review & Learning Health Dashboard schemas'
\echo '═══════════════════════════════════════════════════════════'
\echo ''

-- Check Peer Review tables
\echo '📝 Checking Peer Review System Tables...'
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_rubrics')
    THEN '✅ review_rubrics exists'
    ELSE '❌ review_rubrics MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rubric_criteria')
    THEN '✅ rubric_criteria exists'
    ELSE '❌ rubric_criteria MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'code_reviews')
    THEN '✅ code_reviews exists'
    ELSE '❌ code_reviews MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_criterion_scores')
    THEN '✅ review_criterion_scores exists'
    ELSE '❌ review_criterion_scores MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_comments')
    THEN '✅ review_comments exists'
    ELSE '❌ review_comments MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_assignments')
    THEN '✅ review_assignments exists'
    ELSE '❌ review_assignments MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviewer_stats')
    THEN '✅ reviewer_stats exists'
    ELSE '❌ reviewer_stats MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_disputes')
    THEN '✅ review_disputes exists'
    ELSE '❌ review_disputes MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'peer_review_moss_checks')
    THEN '✅ peer_review_moss_checks exists'
    ELSE '❌ peer_review_moss_checks MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'peer_review_notifications')
    THEN '✅ peer_review_notifications exists'
    ELSE '❌ peer_review_notifications MISSING'
  END AS status;

\echo ''
\echo '⌨️  Checking Clipboard & Keystroke Tracking Tables...'
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clipboard_attempts')
    THEN '✅ clipboard_attempts exists'
    ELSE '❌ clipboard_attempts MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'keystroke_sessions')
    THEN '✅ keystroke_sessions exists'
    ELSE '❌ keystroke_sessions MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'keystroke_events')
    THEN '✅ keystroke_events exists'
    ELSE '❌ keystroke_events MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_typing_patterns')
    THEN '✅ student_typing_patterns exists'
    ELSE '❌ student_typing_patterns MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ide_integrity_flags')
    THEN '✅ ide_integrity_flags exists'
    ELSE '❌ ide_integrity_flags MISSING'
  END AS status;

\echo ''
\echo '📊 Checking Analytics Tables...'
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_learning_metrics')
    THEN '✅ user_learning_metrics exists'
    ELSE '❌ user_learning_metrics MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics')
    THEN '✅ user_analytics exists'
    ELSE '❌ user_analytics MISSING'
  END AS status;

\echo ''
\echo '🔍 Checking Views...'
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'pending_reviews')
    THEN '✅ pending_reviews view exists'
    ELSE '❌ pending_reviews view MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'submissions_awaiting_reviews')
    THEN '✅ submissions_awaiting_reviews view exists'
    ELSE '❌ submissions_awaiting_reviews view MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'high_quality_reviewers')
    THEN '✅ high_quality_reviewers view exists'
    ELSE '❌ high_quality_reviewers view MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'sessions_with_integrity_concerns')
    THEN '✅ sessions_with_integrity_concerns view exists'
    ELSE '❌ sessions_with_integrity_concerns view MISSING'
  END AS status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'typing_pattern_deviations')
    THEN '✅ typing_pattern_deviations view exists'
    ELSE '❌ typing_pattern_deviations view MISSING'
  END AS status;

\echo ''
\echo '🔧 Checking Triggers...'
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_calculate_review_score',
  'trigger_update_reviewer_stats',
  'update_keystroke_session_stats',
  'detect_typing_burst'
)
ORDER BY event_object_table, trigger_name;

\echo ''
\echo '═══════════════════════════════════════════════════════════'
\echo '  Verification Complete'
\echo '═══════════════════════════════════════════════════════════'
