const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true,
    },
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      private: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActiveDate: {
      type: Date,
      default: Date.now,
    },
    settings: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
    },
    socialLogins: {
      google: {
        type: String,
        default: null,
        private: true,
      },
      facebook: {
        type: String,
        default: null,
        private: true,
      },
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.verificationToken;
        delete ret.socialLogins;
       ret.createdAt = doc.createdAt.toISOString();
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Add plugins
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  return bcrypt.compare(password, this.password);
};

/**
 * Update user's streak
 * @returns {Promise<User>}
 */
userSchema.methods.updateStreak = async function () {
  const now = new Date();
  const lastActive = new Date(this.lastActiveDate);
  
  // Check if the user was active yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (
    lastActive.getDate() === yesterday.getDate() &&
    lastActive.getMonth() === yesterday.getMonth() &&
    lastActive.getFullYear() === yesterday.getFullYear()
  ) {
    this.streak += 1;
  } else if (lastActive.getDate() !== now.getDate() || 
             lastActive.getMonth() !== now.getMonth() || 
             lastActive.getFullYear() !== now.getFullYear()) {
    // Reset streak if not consecutive
    this.streak = 1;
  }
  
  this.lastActiveDate = now;
  return this.save();
};

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// Soft delete method
userSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  await this.save();
};

// Virtual for profile URL
userSchema.virtual('profileUrl').get(function () {
  return this.avatar 
    ? `${process.env.BASE_URL}/uploads/avatars/${this.avatar}`
    : `${process.env.BASE_URL}/default-avatar.png`;
});

/**
 * @typedef User
 */
module.exports = mongoose.model('User', userSchema);