#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# API Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3001/api}"
HEALTH_ENDPOINT="$API_BASE_URL/health"
REGISTER_ENDPOINT="$API_BASE_URL/auth/register"
VERIFY_OTP_ENDPOINT="$API_BASE_URL/auth/verify-email-otp"
RESEND_OTP_ENDPOINT="$API_BASE_URL/auth/resend-email-otp"
LOGIN_ENDPOINT="$API_BASE_URL/auth/login"
ME_ENDPOINT="$API_BASE_URL/auth/me"

# Test data
TIMESTAMP=$(date +%s)
TEST_EMAIL="complete_test_${TIMESTAMP}@example.com"
TEST_PASSWORD="CompleteTest123!"
TEST_FIRST_NAME="Complete"
TEST_LAST_NAME="Test"
TEST_PHONE="+918340334920"

echo -e "${CYAN}🚀 Complete Registration-to-Login Flow Test${NC}"
echo -e "${CYAN}=============================================${NC}"
echo -e "${BLUE}Test User: $TEST_EMAIL${NC}"
echo -e "${BLUE}Password: $TEST_PASSWORD${NC}"
echo ""

# Step 0: Health Check
echo -e "${YELLOW}0️⃣ Backend Health Check...${NC}"
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_check.json "$HEALTH_ENDPOINT" 2>/dev/null)
HEALTH_STATUS="${HEALTH_RESPONSE: -3}"

if [ "$HEALTH_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
    DATABASE_STATUS=$(cat /tmp/health_check.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('database', 'unknown'))" 2>/dev/null)
    echo -e "${BLUE}📊 Database: $DATABASE_STATUS${NC}"
else
    echo -e "${RED}❌ Backend is not healthy (Status: $HEALTH_STATUS)${NC}"
    echo -e "${RED}Please start the backend server first${NC}"
    exit 1
fi

# Step 1: User Registration
echo -e "\n${YELLOW}1️⃣ User Registration...${NC}"
REGISTER_DATA='{
    "first_name": "'$TEST_FIRST_NAME'",
    "last_name": "'$TEST_LAST_NAME'",
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "phone": "'$TEST_PHONE'"
}'

echo -e "${BLUE}POST $REGISTER_ENDPOINT${NC}"
echo -e "${CYAN}Request Data:${NC}"
echo "$REGISTER_DATA" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_DATA"

REGISTER_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA" \
    -o /tmp/register_response.json \
    "$REGISTER_ENDPOINT" 2>/dev/null)

REGISTER_STATUS="${REGISTER_RESPONSE: -3}"

echo -e "\n${PURPLE}Response Status: $REGISTER_STATUS${NC}"
echo -e "${CYAN}Response Body:${NC}"
cat /tmp/register_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/register_response.json

if [ "$REGISTER_STATUS" -eq 201 ]; then
    echo -e "${GREEN}✅ Registration successful!${NC}"

    # Extract user ID and other info
    USER_ID=$(cat /tmp/register_response.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('user', {}).get('id', ''))" 2>/dev/null)
    OTP_SENT=$(cat /tmp/register_response.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('verification', {}).get('otp_sent', False))" 2>/dev/null)

    echo -e "${BLUE}👤 User ID: $USER_ID${NC}"
    echo -e "${BLUE}📧 OTP Email Sent: $OTP_SENT${NC}"

    if [ "$OTP_SENT" = "True" ]; then
        echo -e "${GREEN}📨 OTP has been sent to email${NC}"
    else
        echo -e "${YELLOW}⚠️ OTP email may not have been sent (check SMTP config)${NC}"
    fi
else
    echo -e "${RED}❌ Registration failed!${NC}"

    # Try to extract error details
    ERROR_MSG=$(cat /tmp/register_response.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('message', data.get('error', 'Unknown error')))" 2>/dev/null)
    echo -e "${RED}Error: $ERROR_MSG${NC}"

    if [ "$REGISTER_STATUS" -eq 409 ]; then
        echo -e "${YELLOW}💡 This email might already be registered${NC}"
    elif [ "$REGISTER_STATUS" -eq 400 ]; then
        echo -e "${YELLOW}💡 Check validation errors above${NC}"
    fi

    exit 1
fi

# Step 2: Test Login Before Email Verification
echo -e "\n${YELLOW}2️⃣ Testing Login (Before Email Verification)...${NC}"
LOGIN_DATA='{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'"
}'

echo -e "${BLUE}POST $LOGIN_ENDPOINT${NC}"
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA" \
    -o /tmp/login_unverified.json \
    "$LOGIN_ENDPOINT" 2>/dev/null)

LOGIN_UNVERIFIED_STATUS="${LOGIN_RESPONSE: -3}"

echo -e "${PURPLE}Response Status: $LOGIN_UNVERIFIED_STATUS${NC}"
cat /tmp/login_unverified.json | python3 -m json.tool 2>/dev/null || cat /tmp/login_unverified.json

if [ "$LOGIN_UNVERIFIED_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Login works before email verification${NC}"

    EMAIL_VERIFIED=$(cat /tmp/login_unverified.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('user', {}).get('emailVerified', False))" 2>/dev/null)
    IS_VERIFIED=$(cat /tmp/login_unverified.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('user', {}).get('isVerified', False))" 2>/dev/null)

    echo -e "${BLUE}📧 Email Verified: $EMAIL_VERIFIED${NC}"
    echo -e "${BLUE}✅ User Verified: $IS_VERIFIED${NC}"
else
    echo -e "${YELLOW}⚠️ Login restricted for unverified users${NC}"
fi

# Step 3: Test Wrong OTP
echo -e "\n${YELLOW}3️⃣ Testing Wrong OTP...${NC}"
WRONG_OTP_DATA='{
    "email": "'$TEST_EMAIL'",
    "otp": "000000"
}'

echo -e "${BLUE}POST $VERIFY_OTP_ENDPOINT${NC}"
WRONG_OTP_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$WRONG_OTP_DATA" \
    -o /tmp/wrong_otp.json \
    "$VERIFY_OTP_ENDPOINT" 2>/dev/null)

WRONG_OTP_STATUS="${WRONG_OTP_RESPONSE: -3}"

echo -e "${PURPLE}Response Status: $WRONG_OTP_STATUS${NC}"
cat /tmp/wrong_otp.json | python3 -m json.tool 2>/dev/null || cat /tmp/wrong_otp.json

if [ "$WRONG_OTP_STATUS" -eq 400 ]; then
    echo -e "${GREEN}✅ Wrong OTP correctly rejected${NC}"
else
    echo -e "${YELLOW}⚠️ Expected 400 status for wrong OTP${NC}"
fi

# Step 4: Resend OTP
echo -e "\n${YELLOW}4️⃣ Testing OTP Resend...${NC}"
RESEND_DATA='{
    "email": "'$TEST_EMAIL'"
}'

echo -e "${BLUE}POST $RESEND_OTP_ENDPOINT${NC}"
RESEND_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$RESEND_DATA" \
    -o /tmp/resend_otp.json \
    "$RESEND_OTP_ENDPOINT" 2>/dev/null)

RESEND_STATUS="${RESEND_RESPONSE: -3}"

echo -e "${PURPLE}Response Status: $RESEND_STATUS${NC}"
cat /tmp/resend_otp.json | python3 -m json.tool 2>/dev/null || cat /tmp/resend_otp.json

if [ "$RESEND_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ OTP resend successful${NC}"
else
    echo -e "${YELLOW}⚠️ OTP resend may have failed${NC}"
fi

# Step 5: Manual OTP Instructions
echo -e "\n${YELLOW}5️⃣ Manual OTP Verification Required${NC}"
echo -e "${CYAN}Since this is a test environment, you need to:${NC}"
echo -e "1. ${BLUE}Check backend logs${NC} for the actual OTP"
echo -e "2. ${BLUE}Look for lines like:${NC} 'OTP for $TEST_EMAIL: XXXXXX'"
echo -e "3. ${BLUE}Use the command below${NC} with the real OTP"

echo -e "\n${GREEN}Manual Verification Command:${NC}"
echo -e "${CYAN}curl -X POST $VERIFY_OTP_ENDPOINT \\${NC}"
echo -e "${CYAN}  -H \"Content-Type: application/json\" \\${NC}"
echo -e "${CYAN}  -d '{\"email\":\"$TEST_EMAIL\",\"otp\":\"YOUR_OTP_HERE\"}' \\${NC}"
echo -e "${CYAN}  | python3 -m json.tool${NC}"

# Step 6: Test Protected Endpoint (should fail without verification)
echo -e "\n${YELLOW}6️⃣ Testing Protected Endpoint (/me)...${NC}"
if [ "$LOGIN_UNVERIFIED_STATUS" -eq 200 ]; then
    # Extract token from login response
    TOKEN=$(cat /tmp/login_unverified.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('token', ''))" 2>/dev/null)

    if [ ! -z "$TOKEN" ]; then
        echo -e "${BLUE}GET $ME_ENDPOINT${NC}"
        ME_RESPONSE=$(curl -s -w "%{http_code}" -X GET \
            -H "Authorization: Bearer $TOKEN" \
            -o /tmp/me_response.json \
            "$ME_ENDPOINT" 2>/dev/null)

        ME_STATUS="${ME_RESPONSE: -3}"

        echo -e "${PURPLE}Response Status: $ME_STATUS${NC}"
        cat /tmp/me_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/me_response.json

        if [ "$ME_STATUS" -eq 200 ]; then
            echo -e "${GREEN}✅ Protected endpoint accessible${NC}"
        else
            echo -e "${YELLOW}⚠️ Protected endpoint may require full verification${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ No token available for protected endpoint test${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Skipping protected endpoint test (no login token)${NC}"
fi

# Final Summary
echo -e "\n${CYAN}=============================================${NC}"
echo -e "${CYAN}📊 COMPLETE FLOW TEST SUMMARY${NC}"
echo -e "${CYAN}=============================================${NC}"

echo -e "Backend Health: ${GREEN}✅ PASSED${NC}"

if [ "$REGISTER_STATUS" -eq 201 ]; then
    echo -e "User Registration: ${GREEN}✅ PASSED${NC}"
else
    echo -e "User Registration: ${RED}❌ FAILED${NC}"
fi

if [ "$LOGIN_UNVERIFIED_STATUS" -eq 200 ]; then
    echo -e "Login (Unverified): ${GREEN}✅ WORKS${NC}"
else
    echo -e "Login (Unverified): ${YELLOW}⚠️ RESTRICTED${NC}"
fi

if [ "$WRONG_OTP_STATUS" -eq 400 ]; then
    echo -e "Wrong OTP Rejection: ${GREEN}✅ PASSED${NC}"
else
    echo -e "Wrong OTP Rejection: ${RED}❌ FAILED${NC}"
fi

if [ "$RESEND_STATUS" -eq 200 ]; then
    echo -e "OTP Resend: ${GREEN}✅ PASSED${NC}"
else
    echo -e "OTP Resend: ${RED}❌ FAILED${NC}"
fi

echo -e "\n${BLUE}📱 Frontend Testing:${NC}"
echo -e "1. Navigate to: ${CYAN}http://localhost:3000/register${NC}"
echo -e "2. Complete registration → Should redirect to email verification"
echo -e "3. Use OTP from backend logs to verify email"
echo -e "4. Login and access protected pages"

echo -e "\n${BLUE}🔧 Next Steps:${NC}"
echo -e "1. ${YELLOW}Configure SMTP${NC} settings for real email delivery"
echo -e "2. ${YELLOW}Test complete flow${NC} in frontend application"
echo -e "3. ${YELLOW}Verify protected routes${NC} work after email verification"

echo -e "\n${BLUE}🧪 Test Data Created:${NC}"
echo -e "Email: ${CYAN}$TEST_EMAIL${NC}"
echo -e "Password: ${CYAN}$TEST_PASSWORD${NC}"
echo -e "User ID: ${CYAN}$USER_ID${NC}"

echo -e "\n${BLUE}🗑️ Cleanup:${NC}"
echo -e "Remember to clean up test users from the database periodically"

# Cleanup temp files
rm -f /tmp/health_check.json /tmp/register_response.json /tmp/login_unverified.json
rm -f /tmp/wrong_otp.json /tmp/resend_otp.json /tmp/me_response.json

echo -e "\n${GREEN}🎉 Complete Flow Test Finished!${NC}"
echo -e "${GREEN}Check backend logs for OTP codes to complete verification${NC}"
