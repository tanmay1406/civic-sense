#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3001/api}"
REGISTER_ENDPOINT="$API_BASE_URL/auth/register"
VERIFY_OTP_ENDPOINT="$API_BASE_URL/auth/verify-email-otp"
RESEND_OTP_ENDPOINT="$API_BASE_URL/auth/resend-email-otp"
LOGIN_ENDPOINT="$API_BASE_URL/auth/login"

echo -e "${BLUE}🔐 OTP Email Verification Test Suite${NC}"
echo "=============================================="

# Use timestamp to ensure unique email
TIMESTAMP=$(date +%s)
TEST_EMAIL="test_otp_${TIMESTAMP}@example.com"
TEST_PASSWORD="TestPass123!"

echo -e "\n${YELLOW}📧 Test Email: ${TEST_EMAIL}${NC}"

# Step 1: Register User (should generate OTP)
echo -e "\n${YELLOW}1️⃣ Registering new user...${NC}"
REGISTER_DATA='{
    "first_name": "OTP",
    "last_name": "Test",
    "email": "'${TEST_EMAIL}'",
    "password": "'${TEST_PASSWORD}'",
    "phone": "+918340334929"
}'

echo "POST $REGISTER_ENDPOINT"
REGISTER_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA" \
    -o /tmp/register_otp_response.json \
    "$REGISTER_ENDPOINT" 2>/dev/null)

REGISTER_STATUS_CODE="${REGISTER_RESPONSE: -3}"

echo -e "Response Status: $REGISTER_STATUS_CODE"
echo "Response Body:"
cat /tmp/register_otp_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/register_otp_response.json

if [ "$REGISTER_STATUS_CODE" -eq 201 ] || [ "$REGISTER_STATUS_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Registration successful! OTP should be sent to email.${NC}"

    # Extract verification info
    OTP_SENT=$(cat /tmp/register_otp_response.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('verification', {}).get('otp_sent', False))" 2>/dev/null)
    echo -e "${BLUE}📨 OTP Email Sent: $OTP_SENT${NC}"
else
    echo -e "${RED}❌ Registration failed!${NC}"
    exit 1
fi

# Step 2: Test OTP Verification with Wrong OTP
echo -e "\n${YELLOW}2️⃣ Testing OTP verification with wrong OTP...${NC}"
WRONG_OTP_DATA='{
    "email": "'${TEST_EMAIL}'",
    "otp": "123456"
}'

echo "POST $VERIFY_OTP_ENDPOINT"
WRONG_OTP_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$WRONG_OTP_DATA" \
    -o /tmp/wrong_otp_response.json \
    "$VERIFY_OTP_ENDPOINT" 2>/dev/null)

WRONG_OTP_STATUS_CODE="${WRONG_OTP_RESPONSE: -3}"

echo -e "Response Status: $WRONG_OTP_STATUS_CODE"
echo "Response Body:"
cat /tmp/wrong_otp_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/wrong_otp_response.json

if [ "$WRONG_OTP_STATUS_CODE" -eq 400 ]; then
    echo -e "${GREEN}✅ Wrong OTP correctly rejected${NC}"
else
    echo -e "${YELLOW}⚠️ Expected 400 status for wrong OTP${NC}"
fi

# Step 3: Test Resend OTP
echo -e "\n${YELLOW}3️⃣ Testing OTP resend...${NC}"
RESEND_DATA='{
    "email": "'${TEST_EMAIL}'"
}'

echo "POST $RESEND_OTP_ENDPOINT"
RESEND_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$RESEND_DATA" \
    -o /tmp/resend_otp_response.json \
    "$RESEND_OTP_ENDPOINT" 2>/dev/null)

RESEND_STATUS_CODE="${RESEND_RESPONSE: -3}"

echo -e "Response Status: $RESEND_STATUS_CODE"
echo "Response Body:"
cat /tmp/resend_otp_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/resend_otp_response.json

if [ "$RESEND_STATUS_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ OTP resend successful${NC}"
else
    echo -e "${YELLOW}⚠️ OTP resend may have failed${NC}"
fi

# Step 4: Manual OTP Entry (since we can't read email)
echo -e "\n${YELLOW}4️⃣ Manual OTP Verification${NC}"
echo -e "${BLUE}Since this is a test environment, you'll need to:${NC}"
echo -e "1. Check the backend logs for the OTP"
echo -e "2. Or check your email if SMTP is configured"
echo -e "3. Use the OTP to verify manually"

echo -e "\n${BLUE}To manually verify OTP, run this command:${NC}"
echo -e "${GREEN}curl -X POST $VERIFY_OTP_ENDPOINT \\"
echo -e "  -H \"Content-Type: application/json\" \\"
echo -e "  -d '{\"email\":\"$TEST_EMAIL\",\"otp\":\"YOUR_OTP_HERE\"}' \\"
echo -e "  | python3 -m json.tool${NC}"

# Step 5: Test Login (should fail if email not verified)
echo -e "\n${YELLOW}5️⃣ Testing login with unverified email...${NC}"
LOGIN_DATA='{
    "email": "'${TEST_EMAIL}'",
    "password": "'${TEST_PASSWORD}'"
}'

echo "POST $LOGIN_ENDPOINT"
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA" \
    -o /tmp/login_response.json \
    "$LOGIN_ENDPOINT" 2>/dev/null)

LOGIN_STATUS_CODE="${LOGIN_RESPONSE: -3}"

echo -e "Response Status: $LOGIN_STATUS_CODE"
echo "Response Body:"
cat /tmp/login_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/login_response.json

if [ "$LOGIN_STATUS_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Login successful${NC}"

    # Check if user is verified
    IS_VERIFIED=$(cat /tmp/login_response.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('user', {}).get('isVerified', False))" 2>/dev/null)
    EMAIL_VERIFIED=$(cat /tmp/login_response.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('user', {}).get('emailVerified', False))" 2>/dev/null)

    echo -e "${BLUE}User Verified: $IS_VERIFIED${NC}"
    echo -e "${BLUE}Email Verified: $EMAIL_VERIFIED${NC}"

elif [ "$LOGIN_STATUS_CODE" -eq 401 ]; then
    echo -e "${YELLOW}⚠️ Login failed - may require email verification${NC}"
else
    echo -e "${RED}❌ Login failed with status $LOGIN_STATUS_CODE${NC}"
fi

# Summary
echo -e "\n${BLUE}=============================================="
echo "📊 OTP VERIFICATION TEST SUMMARY"
echo "==============================================\033[0m"

echo -e "Registration: ${GREEN}✅ PASSED${NC} (Status: $REGISTER_STATUS_CODE)"

if [ "$WRONG_OTP_STATUS_CODE" -eq 400 ]; then
    echo -e "Wrong OTP Rejection: ${GREEN}✅ PASSED${NC}"
else
    echo -e "Wrong OTP Rejection: ${RED}❌ FAILED${NC}"
fi

if [ "$RESEND_STATUS_CODE" -eq 200 ]; then
    echo -e "OTP Resend: ${GREEN}✅ PASSED${NC}"
else
    echo -e "OTP Resend: ${RED}❌ FAILED${NC}"
fi

if [ "$LOGIN_STATUS_CODE" -eq 200 ]; then
    echo -e "Login (Unverified): ${GREEN}✅ WORKS${NC}"
else
    echo -e "Login (Unverified): ${YELLOW}⚠️ RESTRICTED${NC}"
fi

echo -e "\n${BLUE}🔧 Next Steps:${NC}"
echo "1. Check backend logs for the actual OTP"
echo "2. Use the manual curl command above to verify"
echo "3. Configure SMTP settings for real email delivery"
echo "4. Test the frontend /verify-email page"

echo -e "\n${BLUE}📱 Frontend Test:${NC}"
echo "Navigate to: http://localhost:3000/verify-email"
echo "Email: $TEST_EMAIL"

echo -e "\n${BLUE}🗑️ Cleanup:${NC}"
echo "Test user created: $TEST_EMAIL"
echo "You may want to delete this test user from the database"

# Cleanup temp files
rm -f /tmp/register_otp_response.json /tmp/wrong_otp_response.json /tmp/resend_otp_response.json /tmp/login_response.json

echo -e "\n${GREEN}🏁 OTP Verification Test Complete!${NC}"
