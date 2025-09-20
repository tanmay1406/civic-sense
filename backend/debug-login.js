const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sih25031:sih25031@cluster0.khct6iw.mongodb.net/civic_issue_reporter';

// Import User model and auth middleware
const User = require('./src/models/mongodb/User');
const authMiddleware = require('./src/middleware/auth');

console.log('🔍 Debug Login Script');
console.log('=====================');

async function debugLogin() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test login data
    const loginData = {
      email: "debug@example.com",
      password: "DebugTest123!"
    };

    console.log('\n📝 Login Test Data:');
    console.log('Email:', loginData.email);
    console.log('Password:', loginData.password);

    // Step 1: Find user
    console.log('\n🔍 Step 1: Finding user...');
    const user = await User.findOne({ email: loginData.email }).populate('department', 'name code').select('+password');

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:');
    console.log('  ID:', user._id);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Is Active:', user.isActive);
    console.log('  Is Verified:', user.isVerified);
    console.log('  Email Verified:', user.emailVerified);
    console.log('  Has Password:', !!user.password);
    console.log('  Password Length:', user.password ? user.password.length : 0);

    // Step 2: Check if account is locked
    console.log('\n🔒 Step 2: Checking account lock status...');
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const lockTimeRemaining = Math.ceil((user.lockedUntil - new Date()) / (1000 * 60));
      console.log('❌ Account is locked for', lockTimeRemaining, 'minutes');
      return;
    }
    console.log('✅ Account is not locked');

    // Step 3: Check password
    console.log('\n🔐 Step 3: Checking password...');
    try {
      const isPasswordValid = await user.comparePassword(loginData.password);
      console.log('Password comparison result:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('❌ Password is invalid');
        return;
      }
      console.log('✅ Password is valid');
    } catch (passwordError) {
      console.log('❌ Error during password comparison:');
      console.log('  Error:', passwordError.message);
      console.log('  Stack:', passwordError.stack);
      return;
    }

    // Step 4: Check if user is active
    console.log('\n👤 Step 4: Checking user status...');
    if (!user.isActive) {
      console.log('❌ User account is deactivated');
      return;
    }
    console.log('✅ User account is active');

    // Step 5: Check if user is blocked
    if (user.isBlocked) {
      console.log('❌ User account is blocked');
      console.log('  Blocked reason:', user.blockedReason || 'No reason provided');
      return;
    }
    console.log('✅ User account is not blocked');

    // Step 6: Generate JWT tokens
    console.log('\n🔑 Step 6: Generating JWT tokens...');
    try {
      console.log('User data for token generation:');
      console.log('  _id:', user._id);
      console.log('  email:', user.email);
      console.log('  role:', user.role);
      console.log('  department:', user.department);
      console.log('  tokenVersion:', user.tokenVersion);

      const token = authMiddleware.generateToken(user);
      const refreshToken = authMiddleware.generateRefreshToken(user);

      console.log('✅ Tokens generated successfully:');
      console.log('  Token length:', token.length);
      console.log('  Refresh token length:', refreshToken.length);
      console.log('  Token preview:', token.substring(0, 50) + '...');
    } catch (tokenError) {
      console.log('❌ Error generating tokens:');
      console.log('  Error:', tokenError.message);
      console.log('  Stack:', tokenError.stack);
      return;
    }

    // Step 7: Create user data response
    console.log('\n📊 Step 7: Creating user data response...');
    try {
      const userData = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        isActive: user.isActive,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        avatar: user.avatar,
        lastLoginAt: user.lastLoginAt
      };

      console.log('✅ User data created successfully:');
      console.log(JSON.stringify(userData, null, 2));
    } catch (userDataError) {
      console.log('❌ Error creating user data:');
      console.log('  Error:', userDataError.message);
      console.log('  Stack:', userDataError.stack);
      return;
    }

    // Step 8: Update user login info
    console.log('\n🔄 Step 8: Updating user login info...');
    try {
      user.lastLoginAt = new Date();
      user.lastLoginIP = '127.0.0.1'; // Mock IP
      user.loginAttempts = 0;
      user.lockedUntil = undefined;

      await user.save();
      console.log('✅ User login info updated successfully');
    } catch (updateError) {
      console.log('❌ Error updating user login info:');
      console.log('  Error:', updateError.message);
      console.log('  Stack:', updateError.stack);
      return;
    }

    console.log('\n🎉 Login debug completed successfully!');
    console.log('All login steps should work properly.');

  } catch (error) {
    console.error('\n❌ Error during login debug:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  } finally {
    console.log('\n🔌 Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('✅ Connection closed');
  }
}

// Also test the actual API endpoint
async function testLoginAPI() {
  console.log('\n🌐 Testing Login API Endpoint...');

  const fetch = require('node-fetch');

  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: "debug@example.com",
        password: "DebugTest123!"
      })
    });

    const responseText = await response.text();

    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('API Response Body:', responseText);

    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const jsonData = JSON.parse(responseText);
        console.log('Parsed JSON Response:', JSON.stringify(jsonData, null, 2));
      } catch (parseError) {
        console.log('❌ Error parsing JSON response:', parseError.message);
      }
    }

  } catch (apiError) {
    console.log('❌ Error testing API endpoint:');
    console.log('  Error:', apiError.message);

    if (apiError.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running on http://localhost:3001');
    }
  }
}

// Run both debug functions
async function runAllTests() {
  await debugLogin();
  await testLoginAPI();
}

runAllTests().catch(console.error);
