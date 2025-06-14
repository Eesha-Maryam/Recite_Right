const request = require('supertest');
const faker = require('faker');
const httpStatus = require('http-status');
const httpMocks = require('node-mocks-http');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const config = require('../../src/config/config');
const auth = require('../../src/middlewares/auth');
const { tokenService, emailService } = require('../../src/services');
const ApiError = require('../../src/utils/ApiError');
const setupTestDB = require('../utils/setupTestDB');
const { User, Token } = require('../../src/models');
const { tokenTypes } = require('../../src/config/tokens');
const { userOne, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken } = require('../fixtures/token.fixture');

setupTestDB();

describe('Auth routes', () => {
  describe('POST /v1/auth/register', () => {
    let newUser;
    beforeEach(() => {
      newUser = {
        name: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
      };
    });

    test('should return 201 and successfully register user if request data is ok', async () => {
      const res = await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.CREATED);

      expect(res.body).toEqual({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: expect.anything(),
            name: newUser.name,
            email: newUser.email,
            role: 'user',
            isEmailVerified: false,
          },
          tokens: {
            access: {
              token: expect.anything(),
              expires: expect.anything(),
            },
            refresh: {
              token: expect.anything(),
              expires: expect.anything(),
            },
          },
        },
      });

      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });

      const dbUser = await User.findById(res.body.data.user.id);
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe(newUser.password);
      expect(dbUser).toMatchObject({ name: newUser.name, email: newUser.email, role: 'user', isEmailVerified: false });
    });

    test('should return 400 error if email is invalid', async () => {
      newUser.email = 'invalidEmail';

      const res = await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);

      expect(res.body).toEqual({
        success: false,
        error: '"email" must be a valid email',
      });
    });

    test('should return 400 error if email is already used', async () => {
      await insertUsers([userOne]);
      newUser.email = userOne.email;

      const res = await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);

      expect(res.body).toEqual({
        success: false,
        error: 'Email already taken',
      });
    });

    test('should return 400 error if password length is less than 8 characters', async () => {
      newUser.password = 'passwo1';

      const res = await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);

      expect(res.body).toEqual({
        success: false,
        error: 'password must be at least 8 characters',
      });
    });

    test('should return 400 error if password does not contain both letters and numbers', async () => {
      newUser.password = 'password';

      let res = await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);

      expect(res.body).toEqual({
        success: false,
        error: 'password must contain at least 1 letter and 1 number',
      });

      newUser.password = '11111111';

      res = await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);

      expect(res.body).toEqual({
        success: false,
        error: 'password must contain at least 1 letter and 1 number',
      });
    });
  });

  describe('POST /v1/auth/login', () => {
    test('should return 200 and login user if email and password match', async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app).post('/v1/auth/login').send(loginCredentials).expect(httpStatus.OK);

      expect(res.body).toEqual({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: expect.anything(),
            name: userOne.name,
            email: userOne.email,
            role: userOne.role,
            isEmailVerified: userOne.isEmailVerified,
          },
          tokens: {
            access: { token: expect.anything(), expires: expect.anything() },
            refresh: { token: expect.anything(), expires: expect.anything() },
          },
        },
      });

      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test('should return 401 error if there are no users with that email', async () => {
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app).post('/v1/auth/login').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        success: false,
        error: 'Incorrect email or password',
      });
    });

    test('should return 401 error if password is wrong', async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: 'wrongPassword1',
      };

      const res = await request(app).post('/v1/auth/login').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        success: false,
        error: 'Incorrect email or password',
      });
    });
  });

  describe('POST /v1/auth/logout', () => {
    test('should return 204 if refresh token is valid', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NO_CONTENT);

      const dbRefreshTokenDoc = await Token.findOne({ token: refreshToken });
      expect(dbRefreshTokenDoc).toBe(null);
    });

    test('should return 400 error if refresh token is missing from request body', async () => {
      const res = await request(app).post('/v1/auth/logout').send().expect(httpStatus.BAD_REQUEST);

      expect(res.body).toEqual({
        success: false,
        error: '"refreshToken" is required',
      });
    });

    test('should return 404 error if refresh token is not found in the database', async () => {
      await insertUsers([userOne]);
      const res = await request(app)
        .post('/v1/auth/logout')
        .send({ refreshToken: 'nonExistentToken' })
        .expect(httpStatus.NOT_FOUND);

      expect(res.body).toEqual({
        success: false,
        error: 'Not found',
      });
    });

    test('should return 404 error if refresh token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH, true);

      const res = await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NOT_FOUND);

      expect(res.body).toEqual({
        success: false,
        error: 'Not found',
      });
    });
  });

  describe('POST /v1/auth/refresh-tokens', () => {
    test('should return 200 and new auth tokens if refresh token is valid', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      const res = await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.OK);

      expect(res.body).toEqual({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          access: { token: expect.anything(), expires: expect.anything() },
          refresh: { token: expect.anything(), expires: expect.anything() },
        },
      });

      expect(res.body.data).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() },
      });

      const dbRefreshTokenDoc = await Token.findOne({ token: res.body.data.refresh.token });
      expect(dbRefreshTokenDoc).toMatchObject({ type: tokenTypes.REFRESH, user: userOne._id, blacklisted: false });

      const dbRefreshTokenCount = await Token.countDocuments();
      expect(dbRefreshTokenCount).toBe(1);
    });

    test('should return 400 error if refresh token is missing from request body', async () => {
      const res = await request(app).post('/v1/auth/refresh-tokens').send().expect(httpStatus.BAD_REQUEST);

      expect(res.body).toEqual({
        success: false,
        error: '"refreshToken" is required',
      });
    });

    test('should return 401 error if refresh token is signed using an invalid secret', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH, 'invalidSecret');
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      const res = await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        success: false,
        error: 'Please authenticate',
      });
    });

    test('should return 401 error if refresh token is not found in the database', async () => {
      const res = await request(app)
        .post('/v1/auth/refresh-tokens')
        .send({ refreshToken: 'nonExistentToken' })
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        success: false,
        error: 'Please authenticate',
      });
    });

    test('should return 401 error if refresh token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH, true);

      const res = await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        success: false,
        error: 'Please authenticate',
      });
    });

    test('should return 401 error if refresh token is expired', async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, 'minutes');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      const res = await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        success: false,
        error: 'Please authenticate',
      });
    });

    test('should return 401 error if user is not found', async () => {
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      const res = await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        success: false,
        error: 'Please authenticate',
      });
    });
  });

  describe('POST /v1/auth/forgot-password', () => {
    beforeEach(() => {
      jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue();
    });

    test('should return 204 and send reset password email to the user', async () => {
      await insertUsers([userOne]);
      const sendResetPasswordEmailSpy = jest.spyOn(emailService, 'sendResetPasswordEmail');

      await request(app).post('/v1/auth/forgot-password').send({ email: userOne.email }).expect(httpStatus.NO_CONTENT);

      expect(sendResetPasswordEmailSpy).toHaveBeenCalledWith(userOne.email, expect.any(String));
      const resetPasswordToken = sendResetPasswordEmailSpy.mock.calls[0][1];
      const dbResetPasswordTokenDoc = await Token.findOne({ token: resetPasswordToken, type: tokenTypes.RESET_PASSWORD });
      expect(dbResetPasswordTokenDoc).toBeDefined();
    });

    test('should return 400 if email is missing', async () => {
      const res = await request(app).post('/v1/auth/forgot-password').send().expect(httpStatus.BAD_REQUEST);

      expect(res.body).toEqual({
        success: false,
        error: '"email" is required',
      });
    });

    test('should return 404 if email does not belong to any user', async () => {
      const res = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: faker.internet.email().toLowerCase() })
        .expect(httpStatus.NOT_FOUND);

      expect(res.body).toEqual({
        success: false,
        error: 'No users found with this email',
      });
    });
  });

  describe('POST /v1/auth/reset-password', () => {
    test('should return 204 and reset the password', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(userOne._id, expires, tokenTypes.RESET_PASSWORD);
      await tokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD);

      await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);
      const isPasswordMatch = await bcrypt.compare('password2', dbUser.password);
      expect(isPasswordMatch).toBe(true);

      const dbResetPasswordTokenCount = await Token.countDocuments({ user: userOne._id, type: tokenTypes.RESET_PASSWORD });
      expect(dbResetPasswordTokenCount).toBe(0);
    });

    test('should return 400 if reset password token is missing', async () => {
      const res = await request(app)
        .post('/v1/auth/reset-password')
        .send({ password: 'password2' })
        .expect(httpStatus.BAD_REQUEST);

      expect(res.body).toEqual({
        success: false,
        error: '"token" is required',
      });
    });

    test('should return 401 if reset password token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(userOne._id, expires, tokenTypes.RESET_PASSWORD);
      await tokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD, true);

      const res = await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        success: false,
        error: 'Password reset failed',
      });
    });

    test('should return 401 if reset password token is expired', async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, 'minutes');
      const resetPasswordToken = tokenService.generateToken(userOne._id, expires, tokenTypes.RESET_PASSWORD);
      await tokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD);

      const res = await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        success: false,
        error: 'Password reset failed',
      });
    });

    test('should return 401 if user is not found', async () => {
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(userOne._id, expires, tokenTypes.RESET_PASSWORD);
      await tokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD);

      const res = await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        success: false,
        error: 'Password reset failed',
      });
    });

    test('should return 400 if password is missing or invalid', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(userOne._id, expires, tokenTypes.RESET_PASSWORD);
      await tokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD);

      const res = await request(app)
        .post('/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'short1' })
        .expect(httpStatus.BAD_REQUEST);

      expect(res.body).toEqual({
        success: false,
        error: 'password must be at least 8 characters',
      });
    });
  });

  describe('POST /v1/auth/send-verification-email', () => {
    beforeEach(() => {
      jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue();
    });

    test('should return 204 and send verification email to the user', async () => {
      await insertUsers([userOne]);
      const sendVerificationEmailSpy = jest.spyOn(emailService, 'sendVerificationEmail');

      await request(app)
        .post('/v1/auth/send-verification-email')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);

      expect(sendVerificationEmailSpy).toHaveBeenCalledWith(userOne.email, expect.any(String));
      const verifyEmailToken = sendVerificationEmailSpy.mock.calls[0][1];
      const dbVerifyEmailToken = await Token.findOne({ token: verifyEmailToken, type: tokenTypes.VERIFY_EMAIL });
      expect(dbVerifyEmailToken).toBeDefined();
    });

    test('should return 401 error if access token is missing', async () => {
      const res = await request(app).post('/v1/auth/send-verification-email').send().expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        success: false,
        error: 'No auth token',
      });
    });
  });

  describe('POST /v1/auth/verify-email', () => {
    test('should return 204 and verify the email', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.verifyEmailExpirationDays, 'days');
      const verifyEmailToken = tokenService.generateToken(userOne._id, expires, tokenTypes.VERIFY_EMAIL);
      await tokenService.saveToken(verifyEmailToken, userOne._id, expires, tokenTypes.VERIFY_EMAIL);

      await request(app)
        .post('/v1/auth/verify-email')
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);
      expect(dbUser.isEmailVerified).toBe(true);

      const dbVerifyEmailToken = await Token.countDocuments({
        user: userOne._id,
        type: tokenTypes.VERIFY_EMAIL,
      });
      expect(dbVerifyEmailToken).toBe(0);
    });

    test('should return 400 if verify email token is missing', async () => {
      const res = await request(app).post('/v1/auth/verify-email').send().expect(httpStatus.BAD_REQUEST);

      expect(res.body).toEqual({
        success: false,
        error: '"token" is required',
      });
    });

    test('should return 401 if verify email token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.verifyEmailExpirationDays, 'days');
      const verifyEmailToken = tokenService.generateToken(userOne._id, expires, tokenTypes.VERIFY_EMAIL);
      await tokenService.saveToken(verifyEmailToken, userOne._id, expires, tokenTypes.VERIFY_EMAIL, true);

      const res = await request(app)
        .post('/v1/auth/verify-email')
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        success: false,
        error: 'Email verification failed',
      });
    });

    test('should return 401 if verify email token is expired', async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, 'minutes');
      const verifyEmailToken = tokenService.generateToken(userOne._id, expires, tokenTypes.VERIFY_EMAIL);
      await tokenService.saveToken(verifyEmailToken, userOne._id, expires, tokenTypes.VERIFY_EMAIL);

      const res = await request(app)
        .post('/v1/auth/verify-email')
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        success: false,
        error: 'Email verification failed',
      });
    });

    test('should return 401 if user is not found', async () => {
      const expires = moment().add(config.jwt.verifyEmailExpirationDays, 'days');
      const verifyEmailToken = tokenService.generateToken(userOne._id, expires, tokenTypes.VERIFY_EMAIL);
      await tokenService.saveToken(verifyEmailToken, userOne._id, expires, tokenTypes.VERIFY_EMAIL);

      const res = await request(app)
        .post('/v1/auth/verify-email')
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({
        success: false,
        error: 'Email verification failed',
      });
    });
  });
});

describe('Auth middleware', () => {
  test('should call next with no errors if access token is valid', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });

  test('should call next with unauthorized error if access token is not found in header', async () => {
    const req = httpMocks.createRequest();
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'No auth token',
      }),
    );
  });

  test('should call next with unauthorized error if access token is not a valid jwt token', async () => {
    const req = httpMocks.createRequest({
      headers: { Authorization: 'Bearer invalidToken' },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'jwt malformed',
      }),
    );
  });

  test('should call next with unauthorized error if the token is not an access token', async () => {
    await insertUsers([userOne]);
    const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'Authentication failed',
      }),
    );
  });

  test('should call next with unauthorized error if access token is generated with an invalid secret', async () => {
    await insertUsers([userOne]);
    const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = tokenService.generateToken(userOne._id, expires, tokenTypes.ACCESS, 'invalidSecret');
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'invalid signature',
      }),
    );
  });

  test('should call next with unauthorized error if access token is expired', async () => {
    await insertUsers([userOne]);
    const expires = moment().subtract(1, 'minutes');
    const accessToken = tokenService.generateToken(userOne._id, expires, tokenTypes.ACCESS);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'jwt expired',
      }),
    );
  });

  test('should call next with unauthorized error if user is not found', async () => {
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
    });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'Please authenticate',
      }),
    );
  });

  test('should call next with forbidden error if user does not have required rights and userId is not in params', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
    });
    const next = jest.fn();

    await auth('admin')(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: httpStatus.FORBIDDEN,
        message: 'Insufficient permissions',
      }),
    );
  });

  test('should call next with no errors if user does not have required rights but userId is in params', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
      params: { userId: userOne._id.toHexString() },
    });
    const next = jest.fn();

    await auth('admin')(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });

  test('should call next with no errors if user has required rights', async () => {
    await insertUsers([admin]);
    const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const adminToken = tokenService.generateToken(admin._id, expires, tokenTypes.ACCESS);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const next = jest.fn();

    await auth('getUsers')(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });
});
