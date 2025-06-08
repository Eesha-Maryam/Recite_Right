const mongoose = require('mongoose');
const { User } = require('../models');
const config = require('../config/config');

const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'admin',
};

const seedAdmin = async () => {
  try {
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    await User.create(adminUser);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
