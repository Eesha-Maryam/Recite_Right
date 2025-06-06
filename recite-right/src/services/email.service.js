const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'reciteright12@gmail.com',
    pass: 'ncmpwyuejymvibud'
  }
});

transporter.sendMail({
  from: 'your-email@gmail.com',
  to: 'receiver@example.com',
  subject: 'Test',
  text: 'Hello!'
}, (err, info) => {
  if (err) {
    console.error('Error sending mail:', err);
  } else {
    console.log('Email sent:', info.response);
  }
});
/* istanbul ignore next */
if (config.env !== 'test') {
  transporter
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text, html = '') => {
  const msg = {
    from: config.email.from, // or your Gmail address
    to,
    subject,
    text,
    html, // allow HTML content
  };

  await transporter.sendMail(msg);
};


/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `http://localhost:3000/reset-password?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';

const verificationUrl = `http://localhost:5000/v1/auth/verify-email/${token}`;


  const text = `Click the following link to verify your email: ${verificationUrl}`;

  const html = `
    <p>Hello,</p>
    <p>Please click the button below to verify your email address:</p>
    <a href="${verificationUrl}" style="display:inline-block;padding:10px 20px;background-color:#4CAF50;color:white;text-decoration:none;border-radius:5px;">
      Verify Email
    </a>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  try {
    await sendEmail(to, subject, text, html);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};




module.exports = {
  transporter,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
