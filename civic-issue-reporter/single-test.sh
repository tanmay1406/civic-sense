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

echo -e "${BLUE}🧪 Single Registration Test${NC}"
echo "================================"

# Use timestamp to ensure unique email
TIMESTAMP=$(date +%s)
UNIQUE_EMAIL="test_${TIMESTAMP}@example.com"

# Test data
REGISTRATION_DATA='{
    "first_name": "Test",
    "last_name": "User",
    "email": "'${UNIQUE_EMAIL}'",
    "password": "TestPass123!",
    "phone": "+918340334929"
}'

echo -e "\n${YELLOW}📤 Sending Registration Request...${NC}"
echo "POST $REGISTER_ENDPOINT"
echo -e "\n${BLUE}Request Body:${NC}"
echo "$REGISTRATION_DATA" | python3 -m json.tool 2>/dev/null || echo "$REGISTRATION_DATA"

# Make the request
echo -e "\n${YELLOW}⏳ Making request...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$REGISTRATION_DATA" \
    "$REGISTER_ENDPOINT" 2>/dev/null)

# Extract status code (last line) and response body (everything else)
STATUS_CODE=$(echo "$RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "\n${BLUE}Response Status:${NC} $STATUS_CODE"
echo -e "${BLUE}Response Body:${NC}"
echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"

# Analyze result
echo -e "\n${BLUE}================================${NC}"
if [ "$STATUS_CODE" -eq 201 ] || [ "$STATUS_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Registration SUCCESS!${NC}"

    # Try to extract token
    TOKEN=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('token', 'No token found'))" 2>/dev/null)
    if [ "$TOKEN" != "No token found" ] && [ ! -z "$TOKEN" ]; then
        echo -e "${GREEN}🔑 JWT Token: ${TOKEN:0:30}...${NC}"
    fi

elif [ "$STATUS_CODE" -eq 400 ]; then
    echo -e "${YELLOW}⚠️ Validation Error (400)${NC}"
    echo "Check the validation details above"

elif [ "$STATUS_CODE" -eq 409 ]; then
    echo -e "${YELLOW}⚠️ User Already Exists (409)${NC}"
    echo "Try with a different email address"

elif [ "$STATUS_CODE" -eq 429 ]; then
    echo -e "${RED}🚫 Rate Limited (429)${NC}"
    echo "Too many requests. Wait a few minutes and try again"

elif [ "$STATUS_CODE" -eq 500 ]; then
    echo -e "${RED}💥 Server Error (500)${NC}"
    echo "Check backend logs for detailed error information"

else
    echo -e "${RED}❌ Unexpected Status Code: $STATUS_CODE${NC}"
fi

echo -e "\n${BLUE}💡 Tips:${NC}"
echo "• If you get 429 (rate limited), wait 15 minutes"
echo "• If you get 500, check backend console logs"
echo "• If you get 409, the email already exists"
echo "• Success codes are 200 or 201"

echo -e "\n${BLUE}🔍 To check backend logs:${NC}"
echo "Look at the terminal where you started the backend server"

echo -e "\n${GREEN}🏁 Test Complete${NC}"
