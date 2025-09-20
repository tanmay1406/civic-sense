const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

async function testRegistration() {
  console.log('🔍 Testing Registration API...\n');

  // Test data
  const testData = {
    first_name: "Rahul",
    last_name: "Kumar",
    email: "jaiyankargupta@gmail.com",
    password: "Rustyn@123",
    phone: "+918340334929"
  };

  console.log('📤 Sending registration data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n');

  try {
    // First, test if backend is running
    console.log('1️⃣ Testing backend health...');
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/health`);
      console.log(`✅ Backend is running (Status: ${healthResponse.status})`);
    } catch (error) {
      console.log('❌ Backend is NOT running!');
      console.log('Please start the backend with: cd backend && npm start');
      return;
    }

    console.log('\n2️⃣ Testing registration endpoint...');

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);

    const responseData = await response.json();
    console.log('\n📥 Response Data:');
    console.log(JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('\n✅ Registration successful!');
    } else {
      console.log('\n❌ Registration failed!');

      // Detailed error analysis
      if (response.status === 400) {
        console.log('\n🔍 Validation Error Details:');
        if (responseData.details) {
          responseData.details.forEach((error, index) => {
            console.log(`${index + 1}. Field: ${error.path || error.param}`);
            console.log(`   Error: ${error.msg || error.message}`);
            console.log(`   Value: ${error.value || 'N/A'}`);
          });
        }
      } else if (response.status === 409) {
        console.log('\n⚠️  User already exists with this email or phone');
      } else if (response.status === 500) {
        console.log('\n💥 Server error - check backend logs');
      }
    }

  } catch (error) {
    console.log('\n💥 Network/Connection Error:');
    console.log('Error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n❌ Cannot connect to backend server!');
      console.log('Make sure the backend is running on http://localhost:3001');
    }
  }
}

// Password validation test
function testPasswordValidation() {
  console.log('\n🔐 Testing Password Validation...');

  const password = "Rustyn@123";
  const requirements = {
    'At least 8 characters': password.length >= 8,
    'Contains lowercase': /[a-z]/.test(password),
    'Contains uppercase': /[A-Z]/.test(password),
    'Contains number': /\d/.test(password),
    'Contains special char': /[@$!%*?&]/.test(password),
    'Only allowed characters': /^[A-Za-z\d@$!%*?&]+$/.test(password)
  };

  Object.entries(requirements).forEach(([requirement, passes]) => {
    console.log(`${passes ? '✅' : '❌'} ${requirement}`);
  });
}

// Phone validation test
function testPhoneValidation() {
  console.log('\n📱 Testing Phone Validation...');

  const phone = "+918340334929";
  console.log(`Phone: ${phone}`);
  console.log(`✅ Starts with +91: ${phone.startsWith('+91')}`);
  console.log(`✅ Correct length: ${phone.length === 13} (should be 13)`);
  console.log(`✅ Valid digits after +91: ${/^\+91[6-9]\d{9}$/.test(phone)}`);
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Registration API Test Suite');
  console.log('================================\n');

  testPasswordValidation();
  testPhoneValidation();
  await testRegistration();

  console.log('\n================================');
  console.log('🏁 Test Complete');
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testRegistration, testPasswordValidation, testPhoneValidation };
