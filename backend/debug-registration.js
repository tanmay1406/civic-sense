const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sih25031:sih25031@cluster0.khct6iw.mongodb.net/civic_issue_reporter';

// Import User model
const User = require('./src/models/mongodb/User');

console.log('🔍 Debug Registration Script');
console.log('============================');

async function debugRegistration() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test data
    const testData = {
      firstName: "Debug",
      lastName: "Test",
      email: "debug@example.com",
      password: "DebugTest123!",
      phone: "+918340334997",
      role: "citizen",
      isActive: true,
      isVerified: false,
      emailVerified: false,
      phoneVerified: false,
      emailOTP: "123456",
      emailOTPExpires: new Date(Date.now() + 10 * 60 * 1000)
    };

    console.log('\n📝 Test Data:');
    console.log(JSON.stringify(testData, null, 2));

    // Check if user already exists
    console.log('\n🔍 Checking if user exists...');
    const existingUser = await User.findOne({
      $or: [
        { email: testData.email },
        { phone: testData.phone }
      ]
    });

    if (existingUser) {
      console.log('⚠️  User already exists, deleting...');
      await User.deleteOne({ _id: existingUser._id });
      console.log('✅ Existing user deleted');
    }

    // Create new user
    console.log('\n👤 Creating new user...');
    const user = await User.create(testData);
    console.log('✅ User created successfully!');
    console.log('User ID:', user._id);
    console.log('Email:', user.email);
    console.log('Phone:', user.phone);

    // Test password comparison
    console.log('\n🔐 Testing password comparison...');
    const passwordMatch = await user.comparePassword("DebugTest123!");
    console.log('Password match:', passwordMatch);

    // Test user methods
    console.log('\n🧪 Testing user methods...');
    console.log('Is locked:', user.isLocked());
    console.log('Token version:', user.tokenVersion);

    // Test user data extraction
    console.log('\n📊 User data for JWT:');
    const userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      department: user.department,
      tokenVersion: user.tokenVersion
    };
    console.log(JSON.stringify(userData, null, 2));

    // Test JWT token generation (simplified)
    console.log('\n🔑 Testing JWT generation...');
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      version: user.tokenVersion || 0
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ JWT token generated successfully');
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 50) + '...');

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ JWT token verified successfully');
    console.log('Decoded payload:', JSON.stringify(decoded, null, 2));

    console.log('\n🎉 All tests passed! Registration should work.');

  } catch (error) {
    console.error('\n❌ Error during registration debug:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    if (error.errors) {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  ${key}: ${error.errors[key].message}`);
      });
    }

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

// Run the debug script
debugRegistration().catch(console.error);
