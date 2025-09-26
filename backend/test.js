require('dotenv').config();
const mongoose = require('mongoose');

console.log("Trying URI:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected!');
    process.exit();
  })
  .catch((err) => {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  });
