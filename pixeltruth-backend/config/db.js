const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI is not defined in .env file');
    process.exit(1);
  }

  const isAtlas = uri.includes('mongodb+srv');
  console.log(`🔌 Connecting to ${isAtlas ? 'MongoDB Atlas (cloud)' : 'MongoDB Local'}...`);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // fail fast if unreachable
    });

    const { host, name } = conn.connection;
    console.log(`✅ MongoDB Connected`);
    console.log(`   Host     : ${host}`);
    console.log(`   Database : ${name}`);
    console.log(`   Type     : ${isAtlas ? 'Atlas (cloud)' : 'Local'}`);

    // Log collection names on startup
    const collections = await conn.connection.db.listCollections().toArray();
    if (collections.length > 0) {
      console.log(`   Collections: ${collections.map(c => c.name).join(', ')}`);
    }

  } catch (error) {
    console.error('❌ MongoDB connection FAILED');
    console.error(`   Error: ${error.message}`);

    if (error.message.includes('ECONNREFUSED')) {
      console.error('   → Local MongoDB is not running. Start it with: mongod');
    } else if (error.message.includes('bad auth') || error.message.includes('Authentication')) {
      console.error('   → Wrong username or password in your Atlas connection string');
    } else if (error.message.includes('timed out')) {
      console.error('   → Connection timed out. Check your Atlas IP whitelist (allow 0.0.0.0/0)');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('   → Hostname not found. Check your Atlas connection string');
    }

    process.exit(1);
  }
};

// Handle disconnection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

module.exports = connectDB;
