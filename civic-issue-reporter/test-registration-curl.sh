#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3001/api}"
HEALTH_ENDPOINT="$API_BASE_URL/health"
REGISTER_ENDPOINT="$API_BASE_URL/auth/register"
LOGIN_ENDPOINT="$API_BASE_URL/auth/login"

echo -e "${BLUE}🧪 Civic Issue Reporter - Registration API Test${NC}"
echo "=================================================="

# Test 1: Health Check
echo -e "\n${YELLOW}1️⃣ Testing Backend Health...${NC}"
echo "GET $HEALTH_ENDPOINT"

HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$HEALTH_ENDPOINT" 2>/dev/null)
HEALTH_STATUS_CODE="${HEALTH_RESPONSE: -3}"

if [ "$HEALTH_STATUS_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Backend is healthy (Status: $HEALTH_STATUS_CODE)${NC}"
    echo "Response:"
    cat /tmp/health_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/health_response.json
else
    echo -e "${RED}❌ Backend health check failed (Status: $HEALTH_STATUS_CODE)${NC}"
    echo "Response:"
    cat /tmp/health_response.json 2>/dev/null || echo "No response received"
    echo -e "${RED}Please start the backend server first: cd backend && npm start${NC}"
    exit 1
fi

# Test 2: Registration with Valid Data
echo -e "\n${YELLOW}2️⃣ Testing Registration with Valid Data...${NC}"
echo "POST $REGISTER_ENDPOINT"

VALID_REGISTRATION_DATA='{
    "first_name": "Rahul",
    "last_name": "Kumar",
    "email": "test_'$(date +%s)'@example.com",
    "password": "TestPass123!",
    "phone": "+918340334929"
}'

echo "Request Body:"
echo "$VALID_REGISTRATION_DATA" | python3 -m json.tool 2>/dev/null || echo "$VALID_REGISTRATION_DATA"

REGISTER_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$VALID_REGISTRATION_DATA" \
    -o /tmp/register_response.json \
    "$REGISTER_ENDPOINT" 2>/dev/null)

REGISTER_STATUS_CODE="${REGISTER_RESPONSE: -3}"

echo -e "\nResponse Status: $REGISTER_STATUS_CODE"
echo "Response Body:"
cat /tmp/register_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/register_response.json

if [ "$REGISTER_STATUS_CODE" -eq 201 ] || [ "$REGISTER_STATUS_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Registration successful!${NC}"

    # Extract token if available
    TOKEN=$(cat /tmp/register_response.json | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('token', ''))" 2>/dev/null)
    if [ ! -z "$TOKEN" ]; then
        echo -e "${GREEN}🔑 JWT Token received: ${TOKEN:0:20}...${NC}"
    fi
else
    echo -e "${RED}❌ Registration failed (Status: $REGISTER_STATUS_CODE)${NC}"
fi

# Test 3: Registration with Missing Fields
echo -e "\n${YELLOW}3️⃣ Testing Registration with Missing Fields...${NC}"
echo "POST $REGISTER_ENDPOINT"

INVALID_REGISTRATION_DATA='{
    "first_name": "Test",
    "email": "incomplete@example.com"
}'

echo "Request Body (missing fields):"
echo "$INVALID_REGISTRATION_DATA" | python3 -m json.tool 2>/dev/null || echo "$INVALID_REGISTRATION_DATA"

INVALID_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$INVALID_REGISTRATION_DATA" \
    -o /tmp/invalid_response.json \
    "$REGISTER_ENDPOINT" 2>/dev/null)

INVALID_STATUS_CODE="${INVALID_RESPONSE: -3}"

echo -e "\nResponse Status: $INVALID_STATUS_CODE"
echo "Response Body:"
cat /tmp/invalid_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/invalid_response.json

if [ "$INVALID_STATUS_CODE" -eq 400 ]; then
    echo -e "${GREEN}✅ Validation working correctly (400 Bad Request)${NC}"
else
    echo -e "${YELLOW}⚠️ Expected 400 status code for invalid data${NC}"
fi

# Test 4: Registration with Duplicate Email
echo -e "\n${YELLOW}4️⃣ Testing Registration with Duplicate Email...${NC}"
echo "POST $REGISTER_ENDPOINT"

DUPLICATE_REGISTRATION_DATA='{
    "first_name": "Another",
    "last_name": "User",
    "email": "duplicate@example.com",
    "password": "TestPass123!",
    "phone": "+919876543210"
}'

echo "Request Body (first registration):"
echo "$DUPLICATE_REGISTRATION_DATA" | python3 -m json.tool 2>/dev/null || echo "$DUPLICATE_REGISTRATION_DATA"

# First registration
curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$DUPLICATE_REGISTRATION_DATA" \
    -o /tmp/first_dup.json \
    "$REGISTER_ENDPOINT" >/dev/null 2>&1

# Second registration with same email
echo -e "\nAttempting duplicate registration..."
DUPLICATE_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$DUPLICATE_REGISTRATION_DATA" \
    -o /tmp/duplicate_response.json \
    "$REGISTER_ENDPOINT" 2>/dev/null)

DUPLICATE_STATUS_CODE="${DUPLICATE_RESPONSE: -3}"

echo -e "\nResponse Status: $DUPLICATE_STATUS_CODE"
echo "Response Body:"
cat /tmp/duplicate_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/duplicate_response.json

if [ "$DUPLICATE_STATUS_CODE" -eq 409 ] || [ "$DUPLICATE_STATUS_CODE" -eq 400 ]; then
    echo -e "${GREEN}✅ Duplicate email detection working (Status: $DUPLICATE_STATUS_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️ Expected 409 or 400 status code for duplicate email${NC}"
fi

# Test 5: Password Strength Validation
echo -e "\n${YELLOW}5️⃣ Testing Password Strength Validation...${NC}"
echo "POST $REGISTER_ENDPOINT"

WEAK_PASSWORD_DATA='{
    "first_name": "Weak",
    "last_name": "Password",
    "email": "weak_'$(date +%s)'@example.com",
    "password": "123",
    "phone": "+919876543211"
}'

echo "Request Body (weak password):"
echo "$WEAK_PASSWORD_DATA" | python3 -m json.tool 2>/dev/null || echo "$WEAK_PASSWORD_DATA"

WEAK_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$WEAK_PASSWORD_DATA" \
    -o /tmp/weak_response.json \
    "$REGISTER_ENDPOINT" 2>/dev/null)

WEAK_STATUS_CODE="${WEAK_RESPONSE: -3}"

echo -e "\nResponse Status: $WEAK_STATUS_CODE"
echo "Response Body:"
cat /tmp/weak_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/weak_response.json

if [ "$WEAK_STATUS_CODE" -eq 400 ]; then
    echo -e "${GREEN}✅ Password validation working correctly${NC}"
else
    echo -e "${YELLOW}⚠️ Expected 400 status code for weak password${NC}"
fi

# Test 6: Phone Number Validation
echo -e "\n${YELLOW}6️⃣ Testing Phone Number Validation...${NC}"
echo "POST $REGISTER_ENDPOINT"

INVALID_PHONE_DATA='{
    "first_name": "Invalid",
    "last_name": "Phone",
    "email": "invalidphone_'$(date +%s)'@example.com",
    "password": "TestPass123!",
    "phone": "123"
}'

echo "Request Body (invalid phone):"
echo "$INVALID_PHONE_DATA" | python3 -m json.tool 2>/dev/null || echo "$INVALID_PHONE_DATA"

PHONE_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$INVALID_PHONE_DATA" \
    -o /tmp/phone_response.json \
    "$REGISTER_ENDPOINT" 2>/dev/null)

PHONE_STATUS_CODE="${PHONE_RESPONSE: -3}"

echo -e "\nResponse Status: $PHONE_STATUS_CODE"
echo "Response Body:"
cat /tmp/phone_response.json | python3 -m json.tool 2>/dev/null || cat /tmp/phone_response.json

if [ "$PHONE_STATUS_CODE" -eq 400 ]; then
    echo -e "${GREEN}✅ Phone validation working correctly${NC}"
else
    echo -e "${YELLOW}⚠️ Expected 400 status code for invalid phone${NC}"
fi

# Summary
echo -e "\n${BLUE}=================================================="
echo "📊 TEST SUMMARY"
echo "==================================================${NC}"

echo -e "Health Check: ${GREEN}✅ PASSED${NC}"

if [ "$REGISTER_STATUS_CODE" -eq 201 ] || [ "$REGISTER_STATUS_CODE" -eq 200 ]; then
    echo -e "Valid Registration: ${GREEN}✅ PASSED${NC}"
else
    echo -e "Valid Registration: ${RED}❌ FAILED${NC}"
fi

if [ "$INVALID_STATUS_CODE" -eq 400 ]; then
    echo -e "Missing Fields Validation: ${GREEN}✅ PASSED${NC}"
else
    echo -e "Missing Fields Validation: ${RED}❌ FAILED${NC}"
fi

if [ "$DUPLICATE_STATUS_CODE" -eq 409 ] || [ "$DUPLICATE_STATUS_CODE" -eq 400 ]; then
    echo -e "Duplicate Email Detection: ${GREEN}✅ PASSED${NC}"
else
    echo -e "Duplicate Email Detection: ${RED}❌ FAILED${NC}"
fi

if [ "$WEAK_STATUS_CODE" -eq 400 ]; then
    echo -e "Password Validation: ${GREEN}✅ PASSED${NC}"
else
    echo -e "Password Validation: ${RED}❌ FAILED${NC}"
fi

if [ "$PHONE_STATUS_CODE" -eq 400 ]; then
    echo -e "Phone Validation: ${GREEN}✅ PASSED${NC}"
else
    echo -e "Phone Validation: ${RED}❌ FAILED${NC}"
fi

echo -e "\n${BLUE}🎯 To use your own data, modify the script or use environment variables:${NC}"
echo "   export FIRST_NAME='YourFirstName'"
echo "   export LAST_NAME='YourLastName'"
echo "   export EMAIL='your@email.com'"
echo "   export PASSWORD='YourPassword123!'"
echo "   export PHONE='+919876543210'"

echo -e "\n${BLUE}🔧 To test different API endpoint:${NC}"
echo "   export API_BASE_URL='http://localhost:3002/api'"

# Cleanup
rm -f /tmp/health_response.json /tmp/register_response.json /tmp/invalid_response.json
rm -f /tmp/duplicate_response.json /tmp/weak_response.json /tmp/phone_response.json /tmp/first_dup.json

echo -e "\n${GREEN}🏁 Registration API testing complete!${NC}"
