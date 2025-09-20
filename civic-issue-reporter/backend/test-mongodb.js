const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://sih25031:sih25031@cluster0.khct6iw.mongodb.net/civic_issue_reporter';

console.log('🔍 MongoDB Connection Test');
console.log('=' .repeat(50));

async function testConnection() {
  try {
    console.log('📡 Attempting to connect to MongoDB Atlas...');
    console.log('🔗 URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

    // Set connection options
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    };

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, options);

    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📊 Connection Details:');
    console.log('   - Host:', mongoose.connection.host);
    console.log('   - Port:', mongoose.connection.port);
    console.log('   - Database:', mongoose.connection.name);
    console.log('   - Ready State:', mongoose.connection.readyState);

    // Test basic operations
    console.log('\n🧪 Testing basic operations...');

    // Create a simple test collection
    const TestSchema = new mongoose.Schema({
      name: String,
      timestamp: { type: Date, default: Date.now }
    });

    const TestModel = mongoose.model('ConnectionTest', TestSchema);

    // Insert a test document
    console.log('📝 Inserting test document...');
    const testDoc = await TestModel.create({
      name: 'Connection Test - ' + new Date().toISOString()
    });
    console.log('✅ Test document created:', testDoc._id);

    // Query the test document
    console.log('🔍 Querying test document...');
    const foundDoc = await TestModel.findById(testDoc._id);
    console.log('✅ Test document found:', foundDoc.name);

    // Clean up - delete test document
    console.log('🧹 Cleaning up test document...');
    await TestModel.findByIdAndDelete(testDoc._id);
    console.log('✅ Test document deleted');

    // Drop the test collection
    await TestModel.collection.drop();
    console.log('✅ Test collection dropped');

    console.log('\n🎉 All tests passed! MongoDB Atlas is working correctly.');

    return true;

  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error details:', error.message);

    // Provide helpful error messages
    if (error.message.includes('authentication failed')) {
      console.error('\n💡 Authentication Error:');
      console.error('   - Check if username and password are correct');
      console.error('   - Ensure database user has proper permissions');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 DNS Resolution Error:');
      console.error('   - Check your internet connection');
      console.error('   - Verify the cluster hostname is correct');
    } else if (error.message.includes('IP whitelist')) {
      console.error('\n💡 IP Whitelist Error:');
      console.error('   - Add your IP address to MongoDB Atlas whitelist');
      console.error('   - Or allow access from anywhere (0.0.0.0/0) for testing');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Timeout Error:');
      console.error('   - Check your network connection');
      console.error('   - MongoDB Atlas may be unreachable');
    }

    return false;
  } finally {
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      console.log('\n🔌 Closing MongoDB connection...');
      await mongoose.connection.close();
      console.log('✅ Connection closed');
    }
  }
}

// Run the test
async function main() {
  const success = await testConnection();

  console.log('\n' + '='.repeat(50));
  console.log(success ? '🎉 TEST RESULT: SUCCESS' : '❌ TEST RESULT: FAILED');
  console.log('='.repeat(50));

  process.exit(success ? 0 : 1);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Test interrupted by user');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('\n💥 Unhandled Promise Rejection:', error.message);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  console.error('\n💥 Fatal error:', error.message);
  process.exit(1);
});
