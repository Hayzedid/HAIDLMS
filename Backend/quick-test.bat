@echo off
REM Quick Testing Script for Backend Infrastructure (Windows)
REM Runs health checks and basic tests for newly implemented features

echo ================================================================
echo   Backend Quick Test Script
echo   Testing: Peer Review and Learning Health Dashboard
echo ================================================================
echo.

REM Configuration
set COURSE_PORT=4002
set IDE_PORT=4003
set ANALYTICS_PORT=4006
set BASE_URL=http://localhost

REM Test counter
set PASSED=0
set FAILED=0

echo ================================================================
echo 1. Health Checks
echo ================================================================

echo Testing: Course Service ...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:%COURSE_PORT%/health
echo.

echo Testing: IDE Service ...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:%IDE_PORT%/health
echo.

echo Testing: Analytics Service ...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:%ANALYTICS_PORT%/health
echo.
echo.

echo ================================================================
echo 2. Peer Review System Tests
echo ================================================================

echo Testing: Create Rubric ...
curl -s -o nul -w "Status: %%{http_code}" -X POST ^
  -H "Content-Type: application/json" ^
  -d "{\"courseId\":\"00000000-0000-0000-0000-000000000001\",\"name\":\"Quick Test Rubric\",\"minReviewsRequired\":2}" ^
  http://localhost:%COURSE_PORT%/api/peer-review/rubrics
echo.

echo Testing: Get Course Rubrics ...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:%COURSE_PORT%/api/peer-review/courses/00000000-0000-0000-0000-000000000001/rubrics
echo.

echo Testing: Get Pending Reviews ...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:%COURSE_PORT%/api/peer-review/pending-reviews
echo.

echo Testing: Get High-Quality Reviewers ...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:%COURSE_PORT%/api/peer-review/high-quality-reviewers
echo.
echo.

echo ================================================================
echo 3. Learning Health Dashboard Tests
echo ================================================================

set USER_ID=00000000-0000-0000-0000-000000000001
set COURSE_ID=00000000-0000-0000-0000-000000000002

echo Note: Health dashboard tests may show errors if external services are unavailable
echo.

echo Testing: Get Health Score ...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:%ANALYTICS_PORT%/api/learning-health/users/%USER_ID%/courses/%COURSE_ID%/health-score
echo.

echo Testing: Get At-Risk Learners ...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:%ANALYTICS_PORT%/api/learning-health/courses/%COURSE_ID%/at-risk-learners
echo.

echo Testing: Get Dashboard Summary ...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:%ANALYTICS_PORT%/api/learning-health/courses/%COURSE_ID%/dashboard-summary
echo.
echo.

echo ================================================================
echo 4. Clipboard and Keystroke Tracking Tests
echo ================================================================

echo Testing: Log Clipboard Attempt ...
curl -s -o nul -w "Status: %%{http_code}" -X POST ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"%USER_ID%\",\"sessionId\":\"00000000-0000-0000-0000-000000000099\",\"attemptType\":\"paste\",\"source\":\"keyboard_shortcut\",\"blocked\":true,\"detectedBy\":\"clipboard_api\"}" ^
  http://localhost:%IDE_PORT%/api/clipboard/log-attempt
echo.

echo Testing: Get Clipboard Stats ...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:%IDE_PORT%/api/clipboard/stats/%USER_ID%
echo.

echo Testing: Start Keystroke Session ...
curl -s -o nul -w "Status: %%{http_code}" -X POST ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"%USER_ID%\",\"lessonId\":\"00000000-0000-0000-0000-000000000003\"}" ^
  http://localhost:%IDE_PORT%/api/keystroke/start-session
echo.

echo Testing: Get Typing Patterns ...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:%IDE_PORT%/api/keystroke/patterns/%USER_ID%
echo.

echo Testing: Get Integrity Flags ...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:%IDE_PORT%/api/keystroke/integrity-flags
echo.
echo.

echo ================================================================
echo Test Complete
echo ================================================================
echo.
echo For detailed testing, run: node test-backend.js
echo For documentation, see: Backend/TESTING.md
echo.

pause
