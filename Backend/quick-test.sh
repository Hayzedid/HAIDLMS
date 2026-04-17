#!/bin/bash
# Quick Testing Script for Backend Infrastructure
# Runs health checks and basic tests for newly implemented features

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  Backend Quick Test Script                                ║"
echo "║  Testing: Peer Review & Learning Health Dashboard         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Configuration
COURSE_PORT=4002
IDE_PORT=4003
ANALYTICS_PORT=4006
BASE_URL="http://localhost"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function for tests
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"

    echo -n "Testing: $name ... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)

    if [ "$response" = "$expected_status" ] || [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $response)"
        ((FAILED++))
    fi
}

# Test POST endpoint
test_post_endpoint() {
    local name="$1"
    local url="$2"
    local data="$3"

    echo -n "Testing: $name ... "

    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$url" 2>/dev/null)

    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Status: $response)"
        ((FAILED++))
    fi
}

echo "═══════════════════════════════════════════════════════════"
echo "1. Health Checks"
echo "═══════════════════════════════════════════════════════════"

test_endpoint "Course Service" "$BASE_URL:$COURSE_PORT/health"
test_endpoint "IDE Service" "$BASE_URL:$IDE_PORT/health"
test_endpoint "Analytics Service" "$BASE_URL:$ANALYTICS_PORT/health"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "2. Peer Review System Tests"
echo "═══════════════════════════════════════════════════════════"

# Test rubric creation
RUBRIC_DATA='{
  "courseId": "00000000-0000-0000-0000-000000000001",
  "name": "Quick Test Rubric",
  "minReviewsRequired": 2,
  "allowSelfReview": false,
  "anonymizeReviewers": true
}'
test_post_endpoint "Create Rubric" "$BASE_URL:$COURSE_PORT/api/peer-review/rubrics" "$RUBRIC_DATA"

# Test get rubrics
test_endpoint "Get Course Rubrics" "$BASE_URL:$COURSE_PORT/api/peer-review/courses/00000000-0000-0000-0000-000000000001/rubrics"

# Test pending reviews
test_endpoint "Get Pending Reviews" "$BASE_URL:$COURSE_PORT/api/peer-review/pending-reviews"

# Test high-quality reviewers
test_endpoint "Get High-Quality Reviewers" "$BASE_URL:$COURSE_PORT/api/peer-review/high-quality-reviewers"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "3. Learning Health Dashboard Tests"
echo "═══════════════════════════════════════════════════════════"

USER_ID="00000000-0000-0000-0000-000000000001"
COURSE_ID="00000000-0000-0000-0000-000000000002"

# Note: These may fail if dependent services aren't running
echo -e "${YELLOW}Note: Health dashboard tests may show errors if external services are unavailable${NC}"

test_endpoint "Get Health Score" "$BASE_URL:$ANALYTICS_PORT/api/learning-health/users/$USER_ID/courses/$COURSE_ID/health-score"
test_endpoint "Get At-Risk Learners" "$BASE_URL:$ANALYTICS_PORT/api/learning-health/courses/$COURSE_ID/at-risk-learners"
test_endpoint "Get Dashboard Summary" "$BASE_URL:$ANALYTICS_PORT/api/learning-health/courses/$COURSE_ID/dashboard-summary"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "4. Clipboard & Keystroke Tracking Tests"
echo "═══════════════════════════════════════════════════════════"

# Test clipboard attempt logging
CLIPBOARD_DATA='{
  "userId": "'$USER_ID'",
  "sessionId": "00000000-0000-0000-0000-000000000099",
  "attemptType": "paste",
  "source": "keyboard_shortcut",
  "blocked": true,
  "detectedBy": "clipboard_api"
}'
test_post_endpoint "Log Clipboard Attempt" "$BASE_URL:$IDE_PORT/api/clipboard/log-attempt" "$CLIPBOARD_DATA"

# Test get stats
test_endpoint "Get Clipboard Stats" "$BASE_URL:$IDE_PORT/api/clipboard/stats/$USER_ID"

# Test start keystroke session
KEYSTROKE_DATA='{
  "userId": "'$USER_ID'",
  "lessonId": "00000000-0000-0000-0000-000000000003"
}'
test_post_endpoint "Start Keystroke Session" "$BASE_URL:$IDE_PORT/api/keystroke/start-session" "$KEYSTROKE_DATA"

# Test get typing patterns
test_endpoint "Get Typing Patterns" "$BASE_URL:$IDE_PORT/api/keystroke/patterns/$USER_ID"

# Test get integrity flags
test_endpoint "Get Integrity Flags" "$BASE_URL:$IDE_PORT/api/keystroke/integrity-flags"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Test Summary"
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}Passed:${NC}  $PASSED"
echo -e "${RED}Failed:${NC}  $FAILED"
echo "Total:   $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    PASS_RATE=$((PASSED * 100 / (PASSED + FAILED)))
    echo -e "${YELLOW}⚠ Some tests failed (Pass rate: ${PASS_RATE}%)${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure all services are running (course, ide, analytics)"
    echo "2. Check database schemas are loaded"
    echo "3. For health dashboard errors, ensure dependent services are running"
    echo "4. See Backend/TESTING.md for detailed troubleshooting"
    exit 1
fi
